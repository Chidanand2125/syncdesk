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
    const { planId, billingCycle } = body

    if (!planId || !billingCycle) {
      return NextResponse.json({ error: 'Plan details missing' }, { status: 400 })
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

    // Determine price in USD
    let basePriceUsd = 0
    if (planId === 'pro') {
      basePriceUsd = 29
    } else if (planId === 'business') {
      basePriceUsd = 99
    } else if (planId === 'free') {
      return NextResponse.json({ error: 'Free plan does not require payment' }, { status: 400 })
    } else {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    // Apply 20% discount for annual, then multiply by 12 months
    let priceUsd = basePriceUsd
    if (billingCycle === 'annual') {
      priceUsd = Math.round(basePriceUsd * 0.8) * 12
    }

    // Convert to INR (85 INR per USD) and then to paise (1 INR = 100 paise)
    const inrRate = 85
    const amountInPaise = Math.round(priceUsd * inrRate * 100)

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    // Fallback to mock mode if keys are not set in the environment
    if (!keyId || !keySecret) {
      console.warn('Razorpay keys missing from environment. Operating in mock mode.')
      return NextResponse.json({
        mock: true,
        order_id: `mock_order_${orgId}_${Date.now()}`,
        amount: amountInPaise,
        currency: 'INR',
        key_id: 'rzp_test_mockkeyid',
        userEmail: user.email,
        planId,
      })
    }

    // Make live request to Razorpay order endpoint
    const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${orgId.substring(0, 8)}_${Date.now()}`,
        notes: {
          orgId,
          planId,
          billingCycle,
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Razorpay Order API failure:', errText)
      return NextResponse.json({ error: 'Failed to initiate order with Razorpay' }, { status: 502 })
    }

    const orderData = await response.json()

    return NextResponse.json({
      mock: false,
      order_id: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      key_id: keyId,
      userEmail: user.email,
      planId,
    })
  } catch (error) {
    console.error('Payment Order Route crashed:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
