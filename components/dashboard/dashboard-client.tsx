'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Database,
  LayoutGrid,
  LogOut,
  Plus,
  Repeat,
  Rows3,
  Zap,
  CreditCard,
  Globe,
} from 'lucide-react'
import type { ExportPipeline, Organization, Profile } from '@/lib/types'
import { PipelineCard } from './pipeline-card'
import { PipelineDialog } from './pipeline-dialog'
import { RunDialog } from './run-dialog'
import { signOut } from '@/lib/actions/auth'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'


function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: typeof Zap
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex flex-col">
        <span className="text-2xl font-semibold leading-none text-foreground">
          {value}
        </span>
        <span className="mt-1 text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

export function DashboardClient({
  profile,
  organization,
  pipelines,
}: {
  profile: Profile
  organization: Organization | null
  pipelines: ExportPipeline[]
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ExportPipeline | null>(null)
  const [running, setRunning] = useState<ExportPipeline | null>(null)
  const [runOpen, setRunOpen] = useState(false)

  const [dbModalOpen, setDbModalOpen] = useState(false)
  const [stripeModalOpen, setStripeModalOpen] = useState(false)
  
  const [dbUri, setDbUri] = useState(organization?.database_connection_string ?? '')
  const [stripeKey, setStripeKey] = useState(organization?.stripe_api_key_mock ?? '')
  
  const [isSavingDb, setIsSavingDb] = useState(false)
  const [isSavingStripe, setIsSavingStripe] = useState(false)

  const router = useRouter()

  useEffect(() => {
    if (organization) {
      setDbUri(organization.database_connection_string ?? '')
      setStripeKey(organization.stripe_api_key_mock ?? '')
    }
  }, [organization])

  const isDbConnected = !!organization?.database_connection_string
  const isStripeConnected = !!organization?.stripe_api_key_mock

  async function handleSaveDb() {
    setIsSavingDb(true)
    try {
      const res = await fetch('/api/connect-source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'database',
          value: dbUri,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save database connection')
      }

      toast.success('Connected Successfully')
      setDbModalOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setIsSavingDb(false)
    }
  }

  async function handleDisconnectDb() {
    setIsSavingDb(true)
    try {
      const res = await fetch('/api/connect-source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'database',
          value: '',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to disconnect database')
      }

      toast.success('Disconnected Successfully')
      setDbUri('')
      setDbModalOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setIsSavingDb(false)
    }
  }

  async function handleSaveStripe() {
    setIsSavingStripe(true)
    try {
      const res = await fetch('/api/connect-source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'stripe',
          value: stripeKey,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save Stripe key')
      }

      toast.success('Connected Successfully')
      setStripeModalOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setIsSavingStripe(false)
    }
  }

  async function handleDisconnectStripe() {
    setIsSavingStripe(true)
    try {
      const res = await fetch('/api/connect-source', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'stripe',
          value: '',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to disconnect Stripe')
      }

      toast.success('Disconnected Successfully')
      setStripeKey('')
      setStripeModalOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setIsSavingStripe(false)
    }
  }


  const stats = useMemo(() => {
    const active = pipelines.filter((p) => p.is_active).length
    const totalRows = pipelines.reduce((sum, p) => sum + (p.row_count ?? 0), 0)
    return { total: pipelines.length, active, totalRows }
  }, [pipelines])

  const initials =
    (profile.full_name ?? profile.email ?? 'U')
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'U'

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }
  function openEdit(p: ExportPipeline) {
    setEditing(p)
    setDialogOpen(true)
  }
  function openRun(p: ExportPipeline) {
    setRunning(p)
    setRunOpen(true)
  }

  return (
    <div className="flex min-h-svh bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar p-5 text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Database className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">SyncDesk</span>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          <span className="flex items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-2 text-sm font-medium text-sidebar-accent-foreground">
            <LayoutGrid className="h-4 w-4" />
            Pipelines
          </span>
          <Link
            href="/pricing"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors group"
          >
            <Zap className="h-4 w-4 text-primary group-hover:scale-110 transition-transform animate-pulse" />
            Upgrade Plan
          </Link>
        </nav>

        <div className="mt-auto rounded-lg bg-sidebar-accent/60 p-4">
          <p className="text-xs font-medium text-sidebar-foreground">
            {organization?.name ?? 'Your workspace'}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            <span className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
              organization?.billing_status === 'pro'
                ? "bg-primary/20 text-primary border border-primary/30"
                : organization?.billing_status === 'business'
                  ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                  : "bg-muted text-muted-foreground border border-border"
            )}>
              {organization?.billing_status === 'pro'
                ? 'Pro Plan'
                : organization?.billing_status === 'business'
                  ? 'Business Plan'
                  : 'Free Plan'}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-sidebar-foreground/60">
            Tenant-isolated · RLS enforced
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-foreground">
              Export pipelines
            </h1>
            <p className="text-xs text-muted-foreground">
              {organization?.name ?? 'Workspace'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={openCreate} className="gap-1.5">
              <Plus className="h-4 w-4" /> New pipeline
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9">
                    {profile.avatar_url && (
                      <AvatarImage src={profile.avatar_url} alt="" />
                    )}
                    <AvatarFallback className="bg-primary/10 text-sm text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="text-sm font-medium">
                    {profile.full_name ?? 'Member'}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {profile.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer"
                  onSelect={(e) => e.preventDefault()}
                >
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="flex w-full items-center"
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto flex max-w-5xl flex-col gap-6">
            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                label="Total pipelines"
                value={stats.total}
                icon={Rows3}
              />
              <StatCard
                label="Active automations"
                value={stats.active}
                icon={Repeat}
              />
              <StatCard
                label="Rows exported"
                value={stats.totalRows.toLocaleString()}
                icon={Zap}
              />
            </div>

            {/* Data Sources */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">Data Sources</h2>
                <span className="text-xs text-muted-foreground">Configure ingest credentials</span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Database Source */}
                <button
                  onClick={() => setDbModalOpen(true)}
                  className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <div className="flex w-full items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                      <Database className="h-5 w-5" />
                    </span>
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                      isDbConnected
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-muted text-muted-foreground border border-border"
                    )}>
                      {isDbConnected ? (
                        <>
                          <span className="relative mr-1.5 flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          </span>
                          Live Data Stream Active
                        </>
                      ) : (
                        "Disconnected"
                      )}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Database
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      Postgres tables & views
                    </span>
                  </div>
                </button>

                {/* Stripe Source */}
                <button
                  onClick={() => setStripeModalOpen(true)}
                  className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <div className="flex w-full items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                      <CreditCard className="h-5 w-5" />
                    </span>
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                      isStripeConnected
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-muted text-muted-foreground border border-border"
                    )}>
                      {isStripeConnected ? (
                        <>
                          <span className="relative mr-1.5 flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          </span>
                          Live Data Stream Active
                        </>
                      ) : (
                        "Disconnected"
                      )}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      Stripe
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      Charges & subscriptions
                    </span>
                  </div>
                </button>

                {/* Custom API Source */}
                <div
                  className="group relative flex flex-col justify-between rounded-xl border border-border bg-card/60 p-5 text-left shadow-sm"
                >
                  <div className="flex w-full items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Globe className="h-5 w-5" />
                    </span>
                    <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      API Routing Active
                    </span>
                  </div>
                  <div className="mt-4 flex flex-col">
                    <span className="font-semibold text-foreground">
                      Custom API
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                      Any public JSON endpoint
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pipeline grid / empty state */}
            {pipelines.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card/50 py-20 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Database className="h-7 w-7" />
                </span>
                <div className="flex flex-col gap-1">
                  <h2 className="text-base font-semibold text-foreground">
                    No pipelines yet
                  </h2>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    Connect a data source and export clean CSV or JSON in
                    seconds.
                  </p>
                </div>
                <Button onClick={openCreate} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Create your first pipeline
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {pipelines.map((p) => (
                  <PipelineCard
                    key={p.id}
                    pipeline={p}
                    onRun={openRun}
                    onEdit={openEdit}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        <footer className="border-t border-border p-6 text-sm text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>&copy; {new Date().getFullYear()} SyncDesk</span>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/refund" className="hover:text-foreground transition-colors">Refund</Link>
            </div>
          </div>
        </footer>
      </div>

      <PipelineDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pipeline={editing}
      />
      <RunDialog
        pipeline={running}
        open={runOpen}
        onOpenChange={setRunOpen}
      />

      {/* Database Connection Modal */}
      <Dialog open={dbModalOpen} onOpenChange={setDbModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Database Source</DialogTitle>
            <DialogDescription>
              Provide your PostgreSQL or Supabase connection string. SyncDesk connects over TLS to query tables and views.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="db_uri" className="text-sm font-medium">
                Enter PostgreSQL/Supabase Connection URI
              </Label>
              <Input
                id="db_uri"
                placeholder="postgresql://user:password@host:5432/db"
                value={dbUri}
                onChange={(e) => setDbUri(e.target.value)}
                disabled={isSavingDb}
              />
              <p className="text-[11px] text-muted-foreground">
                Credentials are encrypted and isolated within your workspace's row.
              </p>
            </div>
          </div>
          <DialogFooter className="flex sm:justify-between items-center gap-2">
            {isDbConnected && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDisconnectDb}
                disabled={isSavingDb}
              >
                Disconnect
              </Button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDbModalOpen(false)}
                disabled={isSavingDb}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveDb}
                disabled={isSavingDb}
                className="gap-1.5"
              >
                {isSavingDb && (
                  <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                )}
                Save Connection
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stripe Connection Modal */}
      <Dialog open={stripeModalOpen} onOpenChange={setStripeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Stripe Source</DialogTitle>
            <DialogDescription>
              Connect your Stripe account using a Restricted API Key. Only read permissions on charges and subscriptions are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="stripe_key" className="text-sm font-medium">
                Enter Stripe Restricted API Key
              </Label>
              <Input
                id="stripe_key"
                type="password"
                placeholder="rk_live_..."
                value={stripeKey}
                onChange={(e) => setStripeKey(e.target.value)}
                disabled={isSavingStripe}
              />
              <p className="text-[11px] text-muted-foreground">
                For security, restrict this key to read-only access for charges and customers.
              </p>
            </div>
          </div>
          <DialogFooter className="flex sm:justify-between items-center gap-2">
            {isStripeConnected && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDisconnectStripe}
                disabled={isSavingStripe}
              >
                Disconnect
              </Button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStripeModalOpen(false)}
                disabled={isSavingStripe}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveStripe}
                disabled={isSavingStripe}
                className="gap-1.5"
              >
                {isSavingStripe && (
                  <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
                )}
                Connect Stripe Account
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
