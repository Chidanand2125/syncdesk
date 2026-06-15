import type { ExportFormat, SourceConfig, SourceType } from '@/lib/types'

export type Row = Record<string, unknown>

export interface ExtractionResult {
  rows: Row[]
  columns: string[]
  source: string
}

/* -------------------------------------------------------------------------- */
/*  Mock data generators                                                       */
/*  Deterministic, dependency-free sample datasets so the export engine works  */
/*  end-to-end without dialing real customer infrastructure.                   */
/* -------------------------------------------------------------------------- */

function seeded(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const FIRST = ['Ava', 'Noah', 'Mia', 'Liam', 'Zoe', 'Ethan', 'Aria', 'Leo']
const LAST = ['Chen', 'Patel', 'Nguyen', 'Garcia', 'Kim', 'Okafor', 'Silva', 'Haas']
const PLANS = ['starter', 'growth', 'scale', 'enterprise']
const STATUS = ['paid', 'pending', 'refunded', 'failed']

function mockStripeLedger(count = 40): Row[] {
  const rand = seeded(7)
  const rows: Row[] = []
  for (let i = 0; i < count; i++) {
    const amount = Math.round((rand() * 480 + 19) * 100) / 100
    const created = new Date(Date.now() - i * 36e5 * 6)
    rows.push({
      id: `ch_${(1e9 + Math.floor(rand() * 9e8)).toString(36)}`,
      customer_email: `${FIRST[i % FIRST.length].toLowerCase()}.${
        LAST[i % LAST.length].toLowerCase()
      }@example.com`,
      amount,
      currency: 'usd',
      status: STATUS[Math.floor(rand() * STATUS.length)],
      plan: PLANS[Math.floor(rand() * PLANS.length)],
      created_at: created.toISOString(),
    })
  }
  return rows
}

function mockDatabaseTable(count = 50): Row[] {
  const rand = seeded(13)
  const rows: Row[] = []
  for (let i = 0; i < count; i++) {
    rows.push({
      id: i + 1,
      first_name: FIRST[Math.floor(rand() * FIRST.length)],
      last_name: LAST[Math.floor(rand() * LAST.length)],
      seats: Math.floor(rand() * 25) + 1,
      mrr_usd: Math.round((rand() * 1200 + 49) * 100) / 100,
      active: rand() > 0.25,
      signed_up_at: new Date(Date.now() - Math.floor(rand() * 300) * 864e5)
        .toISOString()
        .slice(0, 10),
    })
  }
  return rows
}

const MOCK_DATASETS: Record<string, () => Row[]> = {
  'stripe-charges': () => mockStripeLedger(),
  'stripe-subscriptions': () =>
    mockStripeLedger(30).map((r) => ({
      subscription_id: String(r.id).replace('ch_', 'sub_'),
      customer_email: r.customer_email,
      plan: r.plan,
      mrr: r.amount,
      status: r.status === 'paid' ? 'active' : r.status,
      renews_at: r.created_at,
    })),
  'db-customers': () => mockDatabaseTable(),
  'db-usage-events': () =>
    mockDatabaseTable(60).map((r) => ({
      event_id: r.id,
      user: `${r.first_name} ${r.last_name}`,
      api_calls: (r.seats as number) * 1000,
      bandwidth_mb: Math.round((r.mrr_usd as number) * 3.2),
      recorded_at: r.signed_up_at,
    })),
}

export function listMockDatasets(): { key: string; label: string }[] {
  return [
    { key: 'stripe-charges', label: 'Stripe — Charges ledger' },
    { key: 'stripe-subscriptions', label: 'Stripe — Subscriptions' },
    { key: 'db-customers', label: 'Database — customers' },
    { key: 'db-usage-events', label: 'Database — usage_events' },
  ]
}

/* -------------------------------------------------------------------------- */
/*  Safe public-URL fetching                                                   */
/*  Blocks localhost / private network ranges to mitigate SSRF.                */
/* -------------------------------------------------------------------------- */

export function isBlockedHost(hostname: string): boolean {
  const h = hostname.toLowerCase()
  if (h === 'localhost' || h.endsWith('.localhost') || h === '0.0.0.0') return true
  if (h === '::1' || h === '[::1]') return true
  // IPv4 private / link-local / loopback ranges
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])]
    if (a === 10) return true
    if (a === 127) return true
    if (a === 169 && b === 254) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
  }
  // Cloud metadata endpoints commonly resolve here
  if (h === '169.254.169.254' || h === 'metadata.google.internal') return true
  return false
}

async function fetchPublicJson(endpoint: string): Promise<Row[]> {
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    throw new Error('Invalid endpoint URL.')
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only http(s) endpoints are supported.')
  }
  if (isBlockedHost(url.hostname)) {
    throw new Error('Refusing to fetch a private or internal network address.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  let res: Response
  try {
    res = await fetch(url.toString(), {
      headers: { accept: 'application/json' },
      signal: controller.signal,
      redirect: 'error',
    })
  } catch {
    throw new Error('Failed to reach the endpoint (timeout or network error).')
  } finally {
    clearTimeout(timeout)
  }

  if (!res.ok) {
    throw new Error(`Endpoint responded with HTTP ${res.status}.`)
  }

  const data = await res.json()
  const arr = Array.isArray(data)
    ? data
    : Array.isArray((data as Row)?.data)
      ? ((data as Row).data as Row[])
      : [data]
  return arr as Row[]
}

/* -------------------------------------------------------------------------- */
/*  Extraction orchestrator                                                    */
/* -------------------------------------------------------------------------- */

export async function extract(
  sourceType: SourceType,
  config: SourceConfig,
): Promise<ExtractionResult> {
  let rows: Row[] = []
  let source = ''

  if (sourceType === 'api') {
    if (!config.endpoint) throw new Error('An API endpoint URL is required.')
    rows = await fetchPublicJson(config.endpoint)
    source = config.endpoint
  } else if (sourceType === 'stripe') {
    const key = config.dataset ?? 'stripe-charges'
    const gen = MOCK_DATASETS[key] ?? MOCK_DATASETS['stripe-charges']
    rows = gen()
    source = `mock:${key}`
  } else if (sourceType === 'database') {
    // We never dial arbitrary connection strings server-side. Database
    // sources read from a curated mock catalog keyed by table/dataset.
    const key = config.dataset ?? 'db-customers'
    const gen = MOCK_DATASETS[key] ?? MOCK_DATASETS['db-customers']
    rows = gen()
    source = `mock:${config.table ?? key}`
  } else {
    throw new Error('Unsupported source type.')
  }

  const columns = deriveColumns(rows)
  return { rows, columns, source }
}

function deriveColumns(rows: Row[]): string[] {
  const set = new Set<string>()
  for (const row of rows) {
    if (row && typeof row === 'object') {
      Object.keys(row).forEach((k) => set.add(k))
    }
  }
  return Array.from(set)
}

/* -------------------------------------------------------------------------- */
/*  Formatting                                                                 */
/* -------------------------------------------------------------------------- */

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str =
    typeof value === 'object' ? JSON.stringify(value) : String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function toCsv(rows: Row[], columns: string[]): string {
  const header = columns.map(csvCell).join(',')
  const body = rows
    .map((row) => columns.map((col) => csvCell(row?.[col])).join(','))
    .join('\n')
  return body ? `${header}\n${body}` : header
}

export function toJson(rows: Row[]): string {
  return JSON.stringify(rows, null, 2)
}

export function formatPayload(
  result: ExtractionResult,
  format: ExportFormat,
): { body: string; contentType: string; extension: string } {
  if (format === 'json') {
    return {
      body: toJson(result.rows),
      contentType: 'application/json; charset=utf-8',
      extension: 'json',
    }
  }
  return {
    body: toCsv(result.rows, result.columns),
    contentType: 'text/csv; charset=utf-8',
    extension: 'csv',
  }
}
