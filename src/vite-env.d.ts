/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GIGACHAT_CREDENTIALS?: string;
  readonly VITE_GIGACHAT_SCOPE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
