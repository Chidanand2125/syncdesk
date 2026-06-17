import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toCsv, toJson } from '@/lib/export/engine'
import { Pool } from '@neondatabase/serverless'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const sourceType = searchParams.get('sourceType')
  const format = searchParams.get('format') || 'csv'

  if (!sourceType || !['database', 'stripe', 'api'].includes(sourceType)) {
    return NextResponse.json({ error: 'Invalid sourceType' }, { status: 400 })
  }

  try {
    // Fetch profile and organization to get credentials
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('database_connection_string, stripe_api_key_mock')
      .eq('id', profile.organization_id)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    let rows: Record<string, any>[] = []
    let sourceName = ''

    if (sourceType === 'database') {
      const dbUri = org.database_connection_string
      if (!dbUri) {
        return NextResponse.json({ error: 'Database connection not configured' }, { status: 400 })
      }
      
      const pool = new Pool({ connectionString: dbUri })
      
      try {
        // Try to query 'users' or fallback
        const result = await pool.query('SELECT * FROM users LIMIT 1000;')
        rows = result.rows
        sourceName = 'database-users'
      } catch (err: any) {
        // If users table doesn't exist, we might fail. Just throw a clean error.
        throw new Error(`Database query failed: ${err.message}`)
      } finally {
        await pool.end()
      }
    } else if (sourceType === 'stripe') {
      const stripeKey = org.stripe_api_key_mock
      if (!stripeKey) {
        return NextResponse.json({ error: 'Stripe API key not configured' }, { status: 400 })
      }

      const res = await fetch('https://api.stripe.com/v1/customers', {
        headers: {
          Authorization: `Bearer ${stripeKey}`,
        },
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(`Stripe API error: ${errorData.error?.message || res.statusText}`)
      }

      const data = await res.json()
      rows = data.data || []
      sourceName = 'stripe-customers'
    } else if (sourceType === 'api') {
      return NextResponse.json({ error: 'API sourceType not yet implemented in this route' }, { status: 501 })
    }

    // Export logic
    const columns = rows.length > 0 ? Array.from(new Set(rows.flatMap(r => Object.keys(r)))) : []
    const filename = `${sourceName}-export.${format}`

    if (format === 'json') {
      const jsonBody = toJson(rows)
      return new NextResponse(jsonBody, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } else {
      const csvBody = toCsv(rows, columns)
      return new NextResponse(csvBody, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Connection failed' }, { status: 500 })
  }
}
