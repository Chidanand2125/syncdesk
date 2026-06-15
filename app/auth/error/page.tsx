import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">
          Authentication error
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t complete your sign-in. The link may have expired or
          already been used.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/auth/login">Back to sign in</Link>
        </Button>
      </div>
    </main>
  )
}
