'use client'

import { useMemo, useState } from 'react'
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
} from 'lucide-react'
import type { ExportPipeline, Organization, Profile } from '@/lib/types'
import { PipelineCard } from './pipeline-card'
import { PipelineDialog } from './pipeline-dialog'
import { RunDialog } from './run-dialog'
import { signOut } from '@/lib/actions/auth'

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
        </nav>

        <div className="mt-auto rounded-lg bg-sidebar-accent/60 p-4">
          <p className="text-xs font-medium text-sidebar-foreground">
            {organization?.name ?? 'Your workspace'}
          </p>
          <p className="mt-1 text-[11px] text-sidebar-foreground/60">
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
    </div>
  )
}
