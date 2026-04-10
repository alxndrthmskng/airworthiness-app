import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const session = await auth()
  const user = session?.user

  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  const origin = request.headers.get('origin') || request.nextUrl.origin

  const stripeSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price: process.env.STRIPE_PREMIUM_PRICE_ID!,
        quantity: 1,
      },
    ],
    metadata: {
      user_id: user.id!,
    },
    success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/account`,
  })

  return NextResponse.json({ url: stripeSession.url })
}
