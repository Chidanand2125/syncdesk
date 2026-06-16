import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/**
 * Creates a Supabase admin client using the service role key.
 * This bypasses RLS, so use only for trusted server-side operations
 * like updating billing status after payment verification.
 */
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase service role configuration missing')
  }
  return createServiceClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user via their session cookie
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      mock,
    } = body

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID missing' }, { status: 400 })
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

    // Use admin client for the billing update (bypasses RLS)
    const adminClient = createAdminClient()

    // Check if it's a mock payment
    if (mock) {
      console.log(`Mock payment verified successfully for org: ${orgId}, plan: ${planId}`)

      const { error: updateError } = await adminClient
        .from('organizations')
        .update({ billing_status: planId })
        .eq('id', orgId)

      if (updateError) {
        console.error('Failed to update organization plan status (mock):', updateError)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, planId })
    }

    // Live verification
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details for verification' }, { status: 400 })
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      console.error('Razorpay secret missing from environment during live verification.')
      return NextResponse.json({ error: 'Server key configuration missing' }, { status: 500 })
    }

    // HMAC-SHA256 signature verification
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (generatedSignature !== razorpay_signature) {
      console.error('Razorpay signature mismatch:', { generatedSignature, received: razorpay_signature })
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Signature matches — update plan status in DB
    const { error: updateError } = await adminClient
      .from('organizations')
      .update({ billing_status: planId })
      .eq('id', orgId)

    if (updateError) {
      console.error('Failed to update organization plan status (live):', updateError)
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, planId })
  } catch (error) {
    console.error('Verification Route crashed:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
