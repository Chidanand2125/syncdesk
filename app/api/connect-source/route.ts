import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, value } = body

    if (!type || (type !== 'database' && type !== 'stripe')) {
      return NextResponse.json({ error: 'Invalid or missing type parameter' }, { status: 400 })
    }

    // Retrieve user profile to find organization ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.org_id) {
      return NextResponse.json({ error: 'User profile or organization not found' }, { status: 404 })
    }

    const orgId = profile.org_id

    const updatePayload: Record<string, string | null> = {}
    if (type === 'database') {
      updatePayload.database_connection_string = value || null
    } else {
      updatePayload.stripe_api_key_mock = value || null
    }

    const { error: updateError } = await supabase
      .from('organizations')
      .update(updatePayload)
      .eq('id', orgId)

    if (updateError) {
      console.error('Failed to update organization connection:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Connect Source Route crashed:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
