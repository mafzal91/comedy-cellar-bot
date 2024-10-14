/// <reference types="vite/client" />
  interface ImportMetaEnv {
    readonly VITE_REGION: string
  readonly VITE_API_URL: string
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly CLERK_SIGN_IN_URL: string
  readonly CLERK_SIGN_UP_URL: string
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }