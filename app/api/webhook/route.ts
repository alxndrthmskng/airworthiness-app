export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { query } from '@/lib/db'

export async function GET() {
  return new Response('Webhook route is alive', { status: 200 })
}

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  let body: string

  try {
    body = await request.text()
  } catch {
    return NextResponse.json({ error: 'Could not read body' }, { status: 400 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  console.log('Webhook received:', event.type)

  if (event.type === 'checkout.session.completed') {
    const stripeSession = event.data.object as Stripe.Checkout.Session
    const userId = stripeSession.metadata?.user_id

    console.log('Payment completed for user:', userId)

    if (userId && stripeSession.id) {
      try {
        await query(
          'INSERT INTO purchases (user_id, stripe_session_id) VALUES ($1, $2) ON CONFLICT (stripe_session_id) DO NOTHING',
          [userId, stripeSession.id]
        )
        console.log('Purchase saved successfully for user:', userId)
      } catch (err: any) {
        console.error('DB insert error:', err.message)
      }
    } else {
      console.error('Missing user_id in session metadata:', stripeSession.id)
    }
  }

  return NextResponse.json({ received: true })
}
