'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Check,
  Download,
  FileJson,
  FileSpreadsheet,
  Send,
  TriangleAlert,
} from 'lucide-react'
import type { ExportPipeline } from '@/lib/types'
import { toast } from 'sonner'

interface RunResult {
  ok: boolean
  name: string
  source: string
  format: 'csv' | 'json'
  rowCount: number
  columns: string[]
  filename: string
  contentType: string
  payload: string
  delivery: { delivered: boolean; detail: string } | null
}

type Phase = 'idle' | 'running' | 'success' | 'error'

export function RunDialog({
  pipeline,
  open,
  onOpenChange,
  onCompleted,
}: {
  pipeline: ExportPipeline | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompleted?: () => void
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<RunResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const run = useCallback(async () => {
    if (!pipeline) return
    setPhase('running')
    setResult(null)
    setErrorMsg('')
    try {
      const res = await fetch('/api/export/trigger', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pipelineId: pipeline.id,
          deliver: pipeline.is_active && pipeline.delivery_type !== 'none',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Export failed.')
      // Brief artificial beat so the skeleton is perceptible on fast runs.
      await new Promise((r) => setTimeout(r, 450))
      setResult(data as RunResult)
      setPhase('success')
      onCompleted?.()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Export failed.')
      setPhase('error')
    }
  }, [pipeline, onCompleted])

  // Auto-start the run each time the dialog opens for a pipeline.
  useEffect(() => {
    if (open && pipeline) run()
  }, [open, pipeline, run])

  function download() {
    if (!result) return
    const blob = new Blob([result.payload], { type: result.contentType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('Download started', { description: result.filename })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {phase === 'success'
              ? 'Export ready'
              : phase === 'error'
                ? 'Export failed'
                : 'Running export'}
          </DialogTitle>
          <DialogDescription>
            {pipeline ? pipeline.name : 'Extracting your data…'}
          </DialogDescription>
        </DialogHeader>

        {/* Running: premium skeleton */}
        {phase === 'running' && (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex items-center justify-center py-6">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary [animation-duration:0.9s]" />
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="shimmer relative h-9 overflow-hidden rounded-md bg-muted"
                  style={{ width: `${100 - i * 8}%` }}
                />
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Extracting &amp; formatting rows…
            </p>
          </div>
        )}

        {/* Success: spring checkmark */}
        {phase === 'success' && result && (
          <div className="flex flex-col gap-5 py-2">
            <div className="flex items-center justify-center py-3">
              <div className="relative flex h-20 w-20 items-center justify-center">
                <span className="absolute h-20 w-20 animate-ripple-out rounded-full bg-success/30" />
                <span className="animate-spring-pop flex h-16 w-16 items-center justify-center rounded-full bg-success text-success-foreground">
                  <Check className="h-8 w-8" strokeWidth={3} />
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="gap-1.5">
                {result.format === 'json' ? (
                  <FileJson className="h-3.5 w-3.5" />
                ) : (
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                )}
                {result.format.toUpperCase()}
              </Badge>
              <Badge variant="secondary">{result.rowCount} rows</Badge>
              <Badge variant="secondary">
                {result.columns.length} columns
              </Badge>
            </div>

            {result.delivery && (
              <div
                className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                  result.delivery.delivered
                    ? 'border-success/30 bg-success/10 text-foreground'
                    : 'border-border bg-muted text-muted-foreground'
                }`}
              >
                <Send className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{result.delivery.detail}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={download} className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                Download {result.format.toUpperCase()}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="flex flex-col gap-5 py-2">
            <div className="flex items-center justify-center py-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <TriangleAlert className="h-8 w-8" />
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {errorMsg}
            </p>
            <div className="flex gap-2">
              <Button onClick={run} className="flex-1">
                Retry
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
