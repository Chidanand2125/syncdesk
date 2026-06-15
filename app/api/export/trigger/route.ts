import { createClient } from '@/lib/supabase/server'
import {
  extract,
  formatPayload,
  isBlockedHost,
} from '@/lib/export/engine'
import type {
  ExportFormat,
  ExportPipeline,
  SourceConfig,
  SourceType,
} from '@/lib/types'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface TriggerBody {
  /** Run a saved pipeline (preferred). RLS guarantees tenant isolation. */
  pipelineId?: string
  /** Or run an ad-hoc extraction (used by the onboarding "test" step). */
  sourceType?: SourceType
  sourceConfig?: SourceConfig
  format?: ExportFormat
  /** Whether to attempt scheduled delivery (e.g. Slack) on this run. */
  deliver?: boolean
}

function slugifyFilename(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'syncdesk-export'
  )
}

async function deliverToSlack(
  webhook: string,
  pipelineName: string,
  rowCount: number,
  format: ExportFormat,
): Promise<{ delivered: boolean; detail: string }> {
  try {
    const url = new URL(webhook)
    if (url.protocol !== 'https:' || url.hostname !== 'hooks.slack.com') {
      return {
        delivered: false,
        detail: 'Delivery endpoint must be a https://hooks.slack.com webhook.',
      }
    }
  } catch {
    return { delivered: false, detail: 'Invalid Slack webhook URL.' }
  }

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: `:white_check_mark: *SyncDesk export ready* — \`${pipelineName}\`\n${rowCount} rows exported as ${format.toUpperCase()}.`,
      }),
    })
    return res.ok
      ? { delivered: true, detail: 'Posted to Slack.' }
      : { delivered: false, detail: `Slack responded HTTP ${res.status}.` }
  } catch {
    return { delivered: false, detail: 'Failed to reach the Slack webhook.' }
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  let body: TriggerBody
  try {
    body = (await request.json()) as TriggerBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  let sourceType: SourceType
  let sourceConfig: SourceConfig
  let format: ExportFormat
  let name = 'syncdesk-export'
  let pipeline: ExportPipeline | null = null

  if (body.pipelineId) {
    // Saved pipeline path — the query is RLS-scoped, so a user can only
    // ever read pipelines belonging to their own organization.
    const { data, error } = await supabase
      .from('export_pipelines')
      .select('*')
      .eq('id', body.pipelineId)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Pipeline not found in your workspace.' },
        { status: 404 },
      )
    }
    pipeline = data as ExportPipeline
    sourceType = pipeline.source_type
    sourceConfig = pipeline.source_config ?? {}
    format = pipeline.format
    name = pipeline.name
  } else {
    // Ad-hoc path.
    if (!body.sourceType) {
      return NextResponse.json(
        { error: 'sourceType or pipelineId is required.' },
        { status: 400 },
      )
    }
    sourceType = body.sourceType
    sourceConfig = body.sourceConfig ?? {}
    format = body.format ?? 'csv'
  }

  // Defense in depth: reject obviously unsafe ad-hoc endpoints early.
  if (sourceType === 'api' && sourceConfig.endpoint) {
    try {
      const u = new URL(sourceConfig.endpoint)
      if (isBlockedHost(u.hostname)) {
        return NextResponse.json(
          { error: 'Refusing to fetch a private or internal address.' },
          { status: 400 },
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid endpoint URL.' },
        { status: 400 },
      )
    }
  }

  try {
    const result = await extract(sourceType, sourceConfig)
    const payload = formatPayload(result, format)
    const rowCount = result.rows.length

    // Optional scheduled delivery on this run.
    let delivery: { delivered: boolean; detail: string } | null = null
    if (body.deliver && pipeline) {
      if (pipeline.delivery_type === 'slack' && pipeline.delivery_endpoint) {
        delivery = await deliverToSlack(
          pipeline.delivery_endpoint,
          name,
          rowCount,
          format,
        )
      } else if (pipeline.delivery_type === 'email') {
        // No transactional email provider is configured in this environment.
        delivery = {
          delivered: false,
          detail:
            'Email delivery is queued. Connect an email provider to enable sending.',
        }
      }
    }

    // Record run metadata on saved pipelines (RLS-scoped update).
    if (pipeline) {
      await supabase
        .from('export_pipelines')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: 'success',
          row_count: rowCount,
        })
        .eq('id', pipeline.id)
    }

    const filename = `${slugifyFilename(name)}.${payload.extension}`
    const wantsDownload =
      request.nextUrl.searchParams.get('download') === '1'

    if (wantsDownload) {
      return new NextResponse(payload.body, {
        status: 200,
        headers: {
          'Content-Type': payload.contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Row-Count': String(rowCount),
        },
      })
    }

    // JSON envelope (used by the dashboard to show a preview + status).
    return NextResponse.json({
      ok: true,
      name,
      source: result.source,
      format,
      rowCount,
      columns: result.columns,
      filename,
      contentType: payload.contentType,
      payload: payload.body,
      delivery,
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Extraction failed.'

    if (pipeline) {
      await supabase
        .from('export_pipelines')
        .update({
          last_run_at: new Date().toISOString(),
          last_run_status: `error: ${message}`.slice(0, 200),
        })
        .eq('id', pipeline.id)
    }

    return NextResponse.json({ error: message }, { status: 502 })
  }
}
