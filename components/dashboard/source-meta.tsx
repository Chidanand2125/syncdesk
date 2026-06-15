import { Database, CreditCard, Globe, type LucideIcon } from 'lucide-react'
import type { SourceType } from '@/lib/types'

interface SourceMeta {
  type: SourceType
  label: string
  description: string
  icon: LucideIcon
}

export const SOURCES: SourceMeta[] = [
  {
    type: 'database',
    label: 'Database',
    description: 'Postgres tables & views',
    icon: Database,
  },
  {
    type: 'stripe',
    label: 'Stripe',
    description: 'Charges & subscriptions',
    icon: CreditCard,
  },
  {
    type: 'api',
    label: 'Custom API',
    description: 'Any public JSON endpoint',
    icon: Globe,
  },
]

export function getSourceMeta(type: SourceType): SourceMeta {
  return SOURCES.find((s) => s.type === type) ?? SOURCES[0]
}
