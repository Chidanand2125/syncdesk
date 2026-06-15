'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { SOURCES } from './source-meta'
import { listMockDatasets } from '@/lib/export/engine'
import type {
  ExportFormat,
  ExportPipeline,
  PipelineInput,
  SourceType,
} from '@/lib/types'
import { createPipeline, updatePipeline } from '@/lib/actions/pipelines'
import { ArrowLeft, ArrowRight, Check, Clock, Mail, Slack } from 'lucide-react'
import { toast } from 'sonner'

const DATASETS = listMockDatasets()

function timeToCron(time: string): string {
  const [h, m] = time.split(':')
  return `${Number(m)} ${Number(h)} * * *`
}
function cronToTime(cron: string | null): string {
  if (!cron) return '09:00'
  const parts = cron.split(' ')
  if (parts.length < 2) return '09:00'
  const m = String(Number(parts[0])).padStart(2, '0')
  const h = String(Number(parts[1])).padStart(2, '0')
  return `${h}:${m}`
}

interface FormState {
  name: string
  source_type: SourceType
  endpoint: string
  dataset: string
  table: string
  format: ExportFormat
  scheduleOn: boolean
  time: string
  delivery_type: 'email' | 'slack'
  delivery_endpoint: string
}

const DEFAULT_STATE: FormState = {
  name: '',
  source_type: 'database',
  endpoint: '',
  dataset: 'db-customers',
  table: 'customers',
  format: 'csv',
  scheduleOn: false,
  time: '09:00',
  delivery_type: 'email',
  delivery_endpoint: '',
}

export function PipelineDialog({
  open,
  onOpenChange,
  pipeline,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pipeline: ExportPipeline | null
}) {
  const [step, setStep] = useState(1)
  const [state, setState] = useState<FormState>(DEFAULT_STATE)
  const [pending, startTransition] = useTransition()
  const isEdit = Boolean(pipeline)

  useEffect(() => {
    if (!open) return
    setStep(1)
    if (pipeline) {
      setState({
        name: pipeline.name,
        source_type: pipeline.source_type,
        endpoint: pipeline.source_config.endpoint ?? '',
        dataset:
          pipeline.source_config.dataset ??
          (pipeline.source_type === 'stripe'
            ? 'stripe-charges'
            : 'db-customers'),
        table: pipeline.source_config.table ?? 'customers',
        format: pipeline.format,
        scheduleOn: pipeline.delivery_type !== 'none',
        time: cronToTime(pipeline.cron_schedule),
        delivery_type:
          pipeline.delivery_type === 'slack' ? 'slack' : 'email',
        delivery_endpoint: pipeline.delivery_endpoint ?? '',
      })
    } else {
      setState(DEFAULT_STATE)
    }
  }, [open, pipeline])

  function patch(p: Partial<FormState>) {
    setState((s) => ({ ...s, ...p }))
  }

  const datasetOptions = DATASETS.filter((d) =>
    state.source_type === 'stripe'
      ? d.key.startsWith('stripe')
      : d.key.startsWith('db'),
  )

  function buildInput(): PipelineInput {
    const source_config =
      state.source_type === 'api'
        ? { endpoint: state.endpoint.trim() }
        : state.source_type === 'stripe'
          ? { dataset: state.dataset }
          : { dataset: state.dataset, table: state.table.trim() }

    return {
      name: state.name.trim(),
      source_type: state.source_type,
      source_config,
      format: state.format,
      cron_schedule: state.scheduleOn ? timeToCron(state.time) : null,
      delivery_type: state.scheduleOn ? state.delivery_type : 'none',
      delivery_endpoint: state.scheduleOn
        ? state.delivery_endpoint.trim()
        : null,
      is_active: state.scheduleOn,
    }
  }

  function canProceed(): boolean {
    if (step === 1) {
      if (!state.name.trim()) return false
      if (state.source_type === 'api') return Boolean(state.endpoint.trim())
      return true
    }
    return true
  }

  function submit() {
    const input = buildInput()
    startTransition(async () => {
      const res = isEdit
        ? await updatePipeline(pipeline!.id, input)
        : await createPipeline(input)
      if (res.ok) {
        toast.success(isEdit ? 'Pipeline updated' : 'Pipeline created', {
          description: input.is_active
            ? 'Auto-delivery is active.'
            : 'Run it any time from your dashboard.',
        })
        onOpenChange(false)
      } else {
        toast.error('Could not save', { description: res.error })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit pipeline' : 'New export pipeline'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Connect a data source.' : 'Set format & schedule.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  step >= s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {step > s ? <Check className="h-3.5 w-3.5" /> : s}
              </span>
              <div
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  step > s ? 'bg-primary' : 'bg-muted',
                )}
              />
            </div>
          ))}
        </div>

        {/* Step 1 — Connect data source */}
        {step === 1 && (
          <div className="flex animate-fade-rise flex-col gap-4 py-1">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pname">Pipeline name</Label>
              <Input
                id="pname"
                value={state.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="Daily revenue export"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Data source</Label>
              <div className="grid grid-cols-3 gap-3">
                {SOURCES.map((s) => {
                  const active = state.source_type === s.type
                  const Icon = s.icon
                  return (
                    <button
                      key={s.type}
                      type="button"
                      onClick={() =>
                        patch({
                          source_type: s.type,
                          dataset:
                            s.type === 'stripe'
                              ? 'stripe-charges'
                              : 'db-customers',
                        })
                      }
                      className={cn(
                        'group flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200',
                        active
                          ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30'
                          : 'border-border bg-card hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground group-hover:text-foreground',
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {s.label}
                      </span>
                      <span className="text-[11px] leading-tight text-muted-foreground">
                        {s.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {state.source_type === 'api' ? (
              <div className="flex animate-fade-rise flex-col gap-2">
                <Label htmlFor="endpoint">Public API endpoint</Label>
                <Input
                  id="endpoint"
                  value={state.endpoint}
                  onChange={(e) => patch({ endpoint: e.target.value })}
                  placeholder="https://api.example.com/v1/orders"
                />
                <p className="text-xs text-muted-foreground">
                  Must return JSON. Private/internal addresses are blocked.
                </p>
              </div>
            ) : (
              <div className="flex animate-fade-rise flex-col gap-2">
                <Label>Dataset</Label>
                <Select
                  value={state.dataset}
                  onValueChange={(v) => patch({ dataset: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {datasetOptions.map((d) => (
                      <SelectItem key={d.key} value={d.key}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Sample data stream — connect live credentials in production.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Format & schedule */}
        {step === 2 && (
          <div className="flex animate-fade-rise flex-col gap-5 py-1">
            <div className="flex flex-col gap-2">
              <Label>Output format</Label>
              <div className="grid grid-cols-2 gap-3">
                {(['csv', 'json'] as ExportFormat[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => patch({ format: f })}
                    className={cn(
                      'rounded-lg border p-3 text-sm font-medium uppercase tracking-wide transition-all',
                      state.format === f
                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/30'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  Auto-delivery scheduler
                </span>
                <span className="text-xs text-muted-foreground">
                  Deliver this export every day automatically.
                </span>
              </div>
              <Switch
                checked={state.scheduleOn}
                onCheckedChange={(v) => patch({ scheduleOn: v })}
              />
            </div>

            {state.scheduleOn && (
              <div className="flex animate-fade-rise flex-col gap-4 rounded-lg border border-border bg-muted/40 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => patch({ delivery_type: 'email' })}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-all',
                      state.delivery_type === 'email'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    <Mail className="h-4 w-4" /> Email
                  </button>
                  <button
                    type="button"
                    onClick={() => patch({ delivery_type: 'slack' })}
                    className={cn(
                      'flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-all',
                      state.delivery_type === 'slack'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40',
                    )}
                  >
                    <Slack className="h-4 w-4" /> Slack
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="delivery">
                    {state.delivery_type === 'email'
                      ? 'Recipient email'
                      : 'Slack webhook URL'}
                  </Label>
                  <Input
                    id="delivery"
                    value={state.delivery_endpoint}
                    onChange={(e) =>
                      patch({ delivery_endpoint: e.target.value })
                    }
                    placeholder={
                      state.delivery_type === 'email'
                        ? 'team@company.com'
                        : 'https://hooks.slack.com/services/…'
                    }
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="time" className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Delivery time (daily)
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={state.time}
                    onChange={(e) => patch({ time: e.target.value })}
                    className="w-40"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          {step === 1 ? (
            <span />
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(1)}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}

          {step === 1 ? (
            <Button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canProceed()}
              className="gap-1.5"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={pending}>
              {pending
                ? 'Saving…'
                : isEdit
                  ? 'Save changes'
                  : 'Create pipeline'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
