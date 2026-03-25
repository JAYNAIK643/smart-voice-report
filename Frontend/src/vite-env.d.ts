/// <reference types="vite/client" />

type ViteEnv = {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
};

declare interface ImportMetaEnv extends ViteEnv {}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
