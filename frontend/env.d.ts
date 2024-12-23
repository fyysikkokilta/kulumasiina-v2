/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly BACKEND_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
