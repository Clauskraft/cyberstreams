/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VECTOR_DB_PROVIDER?: string
  readonly VITE_VECTOR_DB_URL?: string
  readonly VITE_VECTOR_DB_API_KEY?: string
  readonly VITE_VECTOR_DB_COLLECTION?: string
  readonly VITE_VECTOR_DB_NAMESPACE?: string
  readonly VITE_VECTOR_DB_TENANT_ID?: string
  readonly VITE_VECTOR_DB_SESSION_ID?: string
  readonly VITE_VECTOR_DB_ENCRYPTION_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
