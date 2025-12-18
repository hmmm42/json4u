"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { MessageKey } from "@/global";
import BasePopover from "./BasePopover";

type ThemeValue = "light" | "dark" | "system";

const themeOptions: Array<{ value: ThemeValue; labelKey: MessageKey; descKey: MessageKey }> = [
  { value: "light", labelKey: "theme_light", descKey: "theme_light_desc" },
  { value: "dark", labelKey: "theme_dark", descKey: "theme_dark_desc" },
  { value: "system", labelKey: "theme_system", descKey: "theme_system_desc" },
];

export default function ThemePopover() {
  const t = useTranslations();
  const { theme, systemTheme, setTheme } = useTheme();

  const currentTheme = (theme ?? "system") as ThemeValue;

  return (
    <BasePopover
      title="Theme"
      className="w-64"
      optionsNode={
        <div className="flex flex-col gap-2 mt-2">
          {themeOptions.map(({ value, labelKey, descKey }) => {
            const selected = currentTheme === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-start rounded-md border px-3 py-2 text-left text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-primary-foreground"
                    : "border-border bg-background hover:bg-muted",
                )}
              >
                <span className="font-medium">{t(labelKey)}</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  {value === "system" && systemTheme
                    ? t(systemTheme === "dark" ? "theme_system_active_dark" : "theme_system_active_light")
                    : t(descKey)}
                </span>
              </button>
            );
          })}
        </div>
      }
    >
      <span>{t("theme_desc")}</span>
    </BasePopover>
  );
}

