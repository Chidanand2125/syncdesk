'use server'

import { createClient } from '@/lib/supabase/server'
import type { PipelineInput } from '@/lib/types'
import { revalidatePath } from 'next/cache'

interface ActionResult {
  ok: boolean
  error?: string
}

async function getContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, organizationId: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id:org_id')
    .eq('id', user.id)
    .single()

  return {
    supabase,
    user,
    organizationId: (profile?.organization_id as string) ?? null,
  }
}

function validate(input: PipelineInput): string | null {
  if (!input.name?.trim()) return 'Pipeline name is required.'
  if (input.source_type === 'api' && !input.source_config.endpoint?.trim()) {
    return 'An API endpoint URL is required for API sources.'
  }
  if (input.delivery_type !== 'none' && !input.delivery_endpoint?.trim()) {
    return 'A delivery endpoint is required when auto-delivery is on.'
  }
  return null
}

export async function createPipeline(input: PipelineInput): Promise<ActionResult> {
  const { supabase, user, organizationId } = await getContext()
  if (!user || !organizationId) return { ok: false, error: 'Not authenticated.' }

  const invalid = validate(input)
  if (invalid) return { ok: false, error: invalid }

  // Check pipeline capacity (Limit of 1 pipeline on the Free plan, unlimited on Pro/Business)
  const { count, error: countError } = await supabase
    .from('export_pipelines')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  if (countError) return { ok: false, error: countError.message }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('billing_status')
    .eq('id', organizationId)
    .single()

  if (orgError) return { ok: false, error: orgError.message }

  const isPremium = org?.billing_status === 'pro' || org?.billing_status === 'business'
  if (!isPremium && count !== null && count >= 1) {
    return { ok: false, error: 'LIMIT_REACHED' }
  }

  const { error } = await supabase.from('export_pipelines').insert({
    organization_id: organizationId,
    created_by: user.id,
    name: input.name.trim(),
    source_type: input.source_type,
    source_config: input.source_config,
    format: input.format,
    cron_schedule: input.cron_schedule,
    delivery_type: input.delivery_type,
    delivery_endpoint: input.delivery_endpoint,
    is_active: input.is_active,
  })

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function updatePipeline(
  id: string,
  input: PipelineInput,
): Promise<ActionResult> {
  const { supabase, user } = await getContext()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const invalid = validate(input)
  if (invalid) return { ok: false, error: invalid }

  // RLS ensures the row must belong to the caller's organization.
  const { error } = await supabase
    .from('export_pipelines')
    .update({
      name: input.name.trim(),
      source_type: input.source_type,
      source_config: input.source_config,
      format: input.format,
      cron_schedule: input.cron_schedule,
      delivery_type: input.delivery_type,
      delivery_endpoint: input.delivery_endpoint,
      is_active: input.is_active,
    })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function setPipelineActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const { supabase, user } = await getContext()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('export_pipelines')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function deletePipeline(id: string): Promise<ActionResult> {
  const { supabase, user } = await getContext()
  if (!user) return { ok: false, error: 'Not authenticated.' }

  const { error } = await supabase
    .from('export_pipelines')
    .delete()
    .eq('id', id)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/dashboard')
  return { ok: true }
}
