export type SourceType = 'database' | 'stripe' | 'api'
export type ExportFormat = 'csv' | 'json'
export type DeliveryType = 'none' | 'email' | 'slack'
export type MemberRole = 'owner' | 'admin' | 'member'

export interface Organization {
  id: string
  name: string
  billing_status: string
  created_at: string
}


export interface Profile {
  id: string
  organization_id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role: MemberRole
  created_at: string
}

/**
 * Non-secret connection metadata. We intentionally never persist raw
 * credentials (DB passwords, live API keys) in this column — only the
 * minimum needed to describe where data comes from.
 */
export interface SourceConfig {
  /** For `api` sources: a public, http(s) endpoint returning JSON. */
  endpoint?: string
  /** For `database` sources: the logical table/view name to extract. */
  table?: string
  /** For `stripe` sources: which mock ledger stream to read. */
  dataset?: string
}

export interface ExportPipeline {
  id: string
  organization_id: string
  created_by: string | null
  name: string
  source_type: SourceType
  source_config: SourceConfig
  credentials_ref: string | null
  format: ExportFormat
  cron_schedule: string | null
  delivery_type: DeliveryType
  delivery_endpoint: string | null
  is_active: boolean
  last_run_at: string | null
  last_run_status: string | null
  row_count: number | null
  created_at: string
  updated_at: string
}

/** Payload accepted when creating or updating a pipeline from the client. */
export interface PipelineInput {
  name: string
  source_type: SourceType
  source_config: SourceConfig
  format: ExportFormat
  cron_schedule: string | null
  delivery_type: DeliveryType
  delivery_endpoint: string | null
  is_active: boolean
}
