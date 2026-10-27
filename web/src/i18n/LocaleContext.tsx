import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { messages } from "./messages";
import type { Lang, Messages } from "./messages";

export const LANG_STORAGE_KEY = "mwi.lang";

export type LocaleTag = "en-US" | "fa-IR";

interface LocaleValue {
  lang: Lang;
  dir: "ltr" | "rtl";
  /** برچسب locale برای Intl.NumberFormat */
  intl: LocaleTag;
  t: Messages;
  setLang: (lang: Lang) => void;
  toggle: () => void;
}

const LocaleContext = createContext<LocaleValue | null>(null);

function initialLang(): Lang {
  if (typeof document === "undefined") return "en";
  return document.documentElement.lang === "fa" ? "fa" : "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(initialLang);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "fa" ? "rtl" : "ltr";
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      /* حالت خصوصی مرورگر */
    }
  }, [lang]);

  const toggle = useCallback(
    () => setLang((current) => (current === "en" ? "fa" : "en")),
    []
  );

  const value: LocaleValue = {
    lang,
    dir: lang === "fa" ? "rtl" : "ltr",
    intl: lang === "fa" ? "fa-IR" : "en-US",
    t: messages[lang],
    setLang,
    toggle,
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleValue {
  const context = useContext(LocaleContext);
  if (context === null) throw new Error("useLocale must run inside LocaleProvider");
  return context;
}
