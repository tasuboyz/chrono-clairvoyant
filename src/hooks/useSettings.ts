import { useState, useCallback } from "react";

export interface AppSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  geminiApiKey: string;
}

const KEYS = {
  supabaseUrl: "cc_supabase_url",
  supabaseAnonKey: "cc_supabase_anon_key",
  geminiApiKey: "cc_gemini_api_key",
} as const;

export function loadSettings(): AppSettings {
  return {
    supabaseUrl: localStorage.getItem(KEYS.supabaseUrl) ?? "",
    supabaseAnonKey: localStorage.getItem(KEYS.supabaseAnonKey) ?? "",
    geminiApiKey: localStorage.getItem(KEYS.geminiApiKey) ?? "",
  };
}

export function persistSettings(settings: AppSettings): void {
  const set = (k: string, v: string) =>
    v ? localStorage.setItem(k, v) : localStorage.removeItem(k);
  set(KEYS.supabaseUrl, settings.supabaseUrl.trim());
  set(KEYS.supabaseAnonKey, settings.supabaseAnonKey.trim());
  set(KEYS.geminiApiKey, settings.geminiApiKey.trim());
}

/** True when Supabase credentials are available (env or localStorage). */
export function isSupabaseConfigured(): boolean {
  const s = loadSettings();
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  return !!((s.supabaseUrl || envUrl) && (s.supabaseAnonKey || envKey));
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  const save = useCallback((next: AppSettings, reload = true) => {
    persistSettings(next);
    setSettings(next);
    if (reload) window.location.reload();
  }, []);

  return { settings, save };
}
