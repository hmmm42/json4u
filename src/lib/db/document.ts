import { get, set, del, type UseStore, createStore } from "idb-keyval";

let docStore: UseStore | undefined;

function initDocStore() {
  docStore = createStore("json4u", "kv");
}

async function docGet(key: string) {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    if (!docStore) {
      initDocStore();
    }
    return (await get(key, docStore)) || null;
  } catch (e) {
    const name = (e as unknown as Error).name;
    if (name === "InvalidStateError") {
      const ls: any = (window as any).localStorage;
      if (ls && typeof ls.getItem === "function") {
        return ls.getItem(key);
      }
      return null;
    }
    throw e;
  }
}

async function docSet(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (!docStore) {
      initDocStore();
    }
    await set(key, value, docStore);
  } catch (e) {
    const name = (e as unknown as Error).name;
    if (name === "InvalidStateError") {
      const ls: any = (window as any).localStorage;
      if (ls && typeof ls.setItem === "function") {
        ls.setItem(key, value);
      }
      return;
    }
    throw e;
  }
}

async function docDel(key: string) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (!docStore) {
      initDocStore();
    }
    await del(key, docStore);
  } catch (e) {
    const name = (e as unknown as Error).name;
    if (name === "InvalidStateError") {
      const ls: any = (window as any).localStorage;
      if (ls && typeof ls.removeItem === "function") {
        ls.removeItem(key);
      }
      return;
    }
    throw e;
  }
}

export type PersistedDoc = {
  text: string;
  timestamp: number;
  version?: number;
};

const LAST_KEY = "lastDoc";

export async function getLastDocument(): Promise<PersistedDoc | null> {
  const str = await docGet(LAST_KEY);
  if (!str) {
    return null;
  }
  try {
    return JSON.parse(str) as PersistedDoc;
  } catch {
    return null;
  }
}

export async function setLastDocument(text: string, version?: number): Promise<void> {
  const payload: PersistedDoc = { text, timestamp: Date.now(), version };
  await docSet(LAST_KEY, JSON.stringify(payload));
}

export async function clearLastDocument(): Promise<void> {
  await docDel(LAST_KEY);
}

export function initDocStoreLazy() {
  if (!docStore && typeof window !== "undefined") {
    initDocStore();
  }
}
