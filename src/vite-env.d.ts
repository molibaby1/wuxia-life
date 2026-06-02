/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_P6B_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
