import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import type { ExportPipeline, Organization, Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Profile (RLS-scoped). Created automatically by the signup trigger.
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organization_id:org_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Trigger may not have completed (e.g. unconfirmed email session edge).
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-6 text-center">
        <div className="max-w-sm">
          <h1 className="text-lg font-semibold text-foreground">
            Setting up your workspace…
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your profile is being provisioned. Refresh in a moment.
          </p>
        </div>
      </main>
    )
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', profile.organization_id)
    .single()

  const { data: pipelines } = await supabase
    .from('export_pipelines')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <DashboardClient
      profile={profile as Profile}
      organization={(organization as Organization) ?? null}
      pipelines={(pipelines as ExportPipeline[]) ?? []}
    />
  )
}
