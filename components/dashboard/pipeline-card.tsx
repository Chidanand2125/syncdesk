'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Clock,
  Mail,
  MoreVertical,
  Pencil,
  Play,
  MessageSquare,
  Trash2,
} from 'lucide-react'

import type { ExportPipeline } from '@/lib/types'
import { getSourceMeta } from './source-meta'
import { deletePipeline, setPipelineActive } from '@/lib/actions/pipelines'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function formatRelative(iso: string | null): string {
  if (!iso) return 'Never run'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function cronLabel(cron: string | null): string {
  if (!cron) return ''
  const [m, h] = cron.split(' ')
  const hh = String(Number(h)).padStart(2, '0')
  const mm = String(Number(m)).padStart(2, '0')
  return `Daily at ${hh}:${mm}`
}

export function PipelineCard({
  pipeline,
  onRun,
  onEdit,
}: {
  pipeline: ExportPipeline
  onRun: (p: ExportPipeline) => void
  onEdit: (p: ExportPipeline) => void
}) {
  const [pending, startTransition] = useTransition()
  const meta = getSourceMeta(pipeline.source_type)
  const Icon = meta.icon
  const failed = pipeline.last_run_status?.startsWith('error')

  function toggleActive(next: boolean) {
    startTransition(async () => {
      const res = await setPipelineActive(pipeline.id, next)
      if (!res.ok) toast.error('Update failed', { description: res.error })
    })
  }

  function remove() {
    startTransition(async () => {
      const res = await deletePipeline(pipeline.id)
      if (res.ok) toast.success('Pipeline deleted')
      else toast.error('Delete failed', { description: res.error })
    })
  }

  return (
    <div
      className={cn(
        'group flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md',
        pending && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
            <Icon className="h-5 w-5" />
          </span>
          <div className="flex flex-col">
            <span className="font-medium leading-tight text-foreground">
              {pipeline.name}
            </span>
            <span className="text-xs capitalize text-muted-foreground">
              {meta.label} · {pipeline.format.toUpperCase()}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Pipeline actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(pipeline)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={remove}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status row */}
      <div className="flex flex-wrap items-center gap-2">
        {pipeline.is_active ? (
          <Badge className="gap-1.5 border-success/30 bg-success/10 hover:bg-success/10 [&]:text-success-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Active
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1.5">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
            Paused
          </Badge>
        )}

        {pipeline.delivery_type !== 'none' && (
          <Badge variant="outline" className="gap-1.5">
            {pipeline.delivery_type === 'slack' ? (
              <MessageSquare className="h-3 w-3" />

            ) : (
              <Mail className="h-3 w-3" />
            )}
            {pipeline.delivery_type === 'slack' ? 'Slack' : 'Email'}
          </Badge>
        )}

        {pipeline.cron_schedule && (
          <Badge variant="outline" className="gap-1.5">
            <Clock className="h-3 w-3" />
            {cronLabel(pipeline.cron_schedule)}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span
          className={cn(
            'text-xs',
            failed ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {failed
            ? 'Last run failed'
            : `${formatRelative(pipeline.last_run_at)}${
                pipeline.row_count != null
                  ? ` · ${pipeline.row_count} rows`
                  : ''
              }`}
        </span>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Auto</span>
            <Switch
              checked={pipeline.is_active}
              onCheckedChange={toggleActive}
              disabled={pending}
              aria-label="Toggle auto-delivery"
            />
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => onRun(pipeline)}>
            <Play className="h-3.5 w-3.5" /> Run
          </Button>
        </div>
      </div>
    </div>
  )
}
