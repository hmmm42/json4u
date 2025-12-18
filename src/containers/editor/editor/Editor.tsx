"use client";

import { useEffect, type ComponentPropsWithoutRef } from "react";
import Loading from "@/components/Loading";
import { vsURL } from "@/lib/editor/cdn";
import { EditorWrapper, type Kind } from "@/lib/editor/editor";
import { useEditor, useEditorStore } from "@/stores/editorStore";
import { useStatusStore } from "@/stores/statusStore";
import { loader, Editor as MonacoEditor } from "@monaco-editor/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useShallow } from "zustand/shallow";
import { example } from "./data";
import { getLastDocument } from "@/lib/db/document";
import { setLastDocument } from "@/lib/db/document";
import { postDocUpdate, onDocUpdate } from "@/lib/sync/documentSync";
import { useTreeMeta } from "@/stores/treeStore";
import { debounce } from "lodash-es";

loader.config({ paths: { vs: vsURL } });

interface EditorProps extends ComponentPropsWithoutRef<typeof MonacoEditor> {
  kind: Kind;
}

export default function Editor({ kind, ...props }: EditorProps) {
  const translations = useTranslations();
  const setEditor = useEditorStore((state) => state.setEditor);
  const setTranslations = useEditorStore((state) => state.setTranslations);
  const { theme, systemTheme } = useTheme();

  const resolvedTheme = (theme === "system" ? systemTheme : theme) ?? "light";
  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "vs";

  useDisplayExample(kind);
  useRevealNode(kind);
  useEditTree(kind);
  usePersistDoc(kind);

  return (
    <MonacoEditor
      language="json"
      loading={<Loading />}
      theme={monacoTheme}
      options={{
        fontSize: 13, // 设置初始字体大小
        scrollBeyondLastLine: false, // 行数超过一屏时才展示滚动条
        automaticLayout: true, // 当编辑器所在的父容器的大小改变时，编辑器会自动重新计算并调整大小
        wordWrap: "on",
        minimap: { enabled: false },
        stickyScroll: {
          enabled: true,
          defaultModel: "foldingProviderModel",
        },
      }}
      onMount={(editor, monaco) => {
        if (!window.monacoApi) {
          window.monacoApi = {
            Raw: monaco,
            KeyCode: monaco.KeyCode,
            MinimapPosition: monaco.editor.MinimapPosition,
            OverviewRulerLane: monaco.editor.OverviewRulerLane,
            Range: monaco.Range,
            RangeFromPositions: monaco.Range.fromPositions,
          };
        }
        // used for e2e tests.
        window.monacoApi[kind] = editor;

        const wrapper = new EditorWrapper(editor, kind);
        wrapper.init();
        setEditor(wrapper);
        setTranslations(translations);
        console.l(`finished initial editor ${kind}:`, wrapper);
      }}
      {...props}
    />
  );
}

// reveal position in text
export function useRevealNode(kind: Kind) {
  const editor = useEditor("main");
  const { isNeedReveal, revealPosition } = useStatusStore(
    useShallow((state) => ({
      isNeedReveal: state.isNeedReveal("editor"),
      revealPosition: state.revealPosition,
    })),
  );

  useEffect(() => {
    const { treeNodeId, target } = revealPosition;

    if (kind === "main" && editor && isNeedReveal && treeNodeId) {
      editor.setNodeSelection(treeNodeId, target);
    }
  }, [editor, revealPosition, isNeedReveal]);
}

export function useEditTree(kind: Kind) {
  const editor = useEditor("main");
  const { editQueue, clearEditQueue } = useStatusStore(
    useShallow((state) => ({
      editQueue: state.editQueue,
      clearEditQueue: state.clearEditQueue,
    })),
  );

  useEffect(() => {
    if (kind === "main" && editor && editQueue.length > 0) {
      editor.applyTreeEdits(editQueue);
      clearEditQueue();
    }
  }, [editor, editQueue]);
}

function usePersistDoc(kind: Kind) {
  const editor = useEditor("main");
  const { version } = useTreeMeta();
  const lastSavedRef = (typeof window !== "undefined" ? (window as any).__json4u_lastSavedRef : undefined) ?? { text: "" };
  if (typeof window !== "undefined") {
    (window as any).__json4u_lastSavedRef = lastSavedRef;
  }
  useEffect(() => {
    if (kind !== "main" || !editor) {
      return;
    }
    const save = debounce(async () => {
      const text = editor.text();
      if (text && text.length > 0 && text !== lastSavedRef.text) {
        await setLastDocument(text, version);
        lastSavedRef.text = text;
        postDocUpdate({ version, timestamp: Date.now() });
      }
    }, 500, { trailing: true });
    const idle = (typeof (window as any).requestIdleCallback === "function");
    if (idle) {
      (window as any).requestIdleCallback(() => save());
    } else {
      save();
    }
    return () => {
      save.cancel();
    };
  }, [editor, version, kind]);

  useEffect(() => {
    if (kind !== "main" || !editor) {
      return;
    }
    const off = onDocUpdate(async () => {
      const saved = await getLastDocument();
      const text = saved?.text;
      if (typeof text === "string" && text.length > 0) {
        await editor.parseAndSet(text, { format: false }, false);
      }
    });
    return () => {
      off();
    };
  }, [editor, kind]);
}

function useDisplayExample(kind: Kind) {
  const editor = useEditor("main");
  const incrEditorInitCount = useStatusStore((state) => state.incrEditorInitCount);

  useEffect(() => {
    if (kind === "main" && editor) {
      (async () => {
        const saved = await getLastDocument();
        const text = saved?.text;
        const count = incrEditorInitCount();
        if (typeof text === "string" && text.length > 0) {
          await editor.parseAndSet(text, { format: false });
        } else if (count <= 1) {
          editor.parseAndSet(example);
        }
      })();
    }
  }, [editor]);
}
