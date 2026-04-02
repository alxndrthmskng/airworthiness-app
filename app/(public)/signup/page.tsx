'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [state, setState] = useState<'idle' | 'link_sent' | 'code_sent'>('idle')
  const [code, setCode] = useState('')
  const [resendCountdown, setResendCountdown] = useState(0)

  useEffect(() => {
    if (resendCountdown <= 0) return
    const timer = setTimeout(() => setResendCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCountdown])

  async function handleOAuth(provider: 'google' | 'apple') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/complete-profile`,
      },
    })
    if (error) setError(error.message)
  }

  async function handleSendMagicLink() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/complete-profile`,
      },
    })
    if (error) {
      setError(error.message)
    } else {
      setState('link_sent')
      setResendCountdown(60)
    }
    setLoading(false)
  }

  async function handleSendCode() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    if (error) {
      setError(error.message)
    } else {
      setState('code_sent')
      setResendCountdown(60)
    }
    setLoading(false)
  }

  async function handleVerifyCode() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })
    if (error) {
      setError(error.message)
    } else {
      router.push('/complete-profile')
    }
    setLoading(false)
  }

  function handleTryDifferentEmail() {
    setState('idle')
    setCode('')
    setError('')
    setResendCountdown(0)
  }

  // Sent state — magic link
  if (state === 'link_sent') {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-green-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Check your email</h2>
          <p className="text-sm text-gray-500">
            We sent a sign-in link to <span className="font-medium text-gray-700">{email}</span>.
          </p>
          <div className="mt-6 space-y-3">
            {resendCountdown > 0 ? (
              <p className="text-sm text-gray-400">Resend available in {resendCountdown}s</p>
            ) : (
              <button
                onClick={handleSendMagicLink}
                disabled={loading}
                className="text-sm font-bold text-black hover:underline"
              >
                {loading ? 'Sending...' : 'Resend magic link'}
              </button>
            )}
            <div>
              <button onClick={handleTryDifferentEmail} className="text-sm text-gray-400 hover:underline">
                Try a different email
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Sent state — 6-digit code
  if (state === 'code_sent') {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-black mb-2">Enter your code</h2>
            <p className="text-sm text-gray-500">
              We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleVerifyCode() }} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-bold text-black">Verification code</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="h-12 rounded-xl text-center text-lg tracking-widest border-gray-300 focus:border-black focus:ring-black"
                autoFocus
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-black text-white hover:bg-gray-800 font-bold rounded-xl"
              disabled={loading || code.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            {resendCountdown > 0 ? (
              <p className="text-sm text-gray-400">Resend available in {resendCountdown}s</p>
            ) : (
              <button
                onClick={handleSendCode}
                disabled={loading}
                className="text-sm font-bold text-black hover:underline"
              >
                {loading ? 'Sending...' : 'Resend code'}
              </button>
            )}
            <div>
              <button onClick={handleTryDifferentEmail} className="text-sm text-gray-400 hover:underline">
                Try a different email
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default — idle state
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black tracking-tight">Sign in to Airworthiness</h1>
          <p className="text-sm text-gray-500 mt-2">
            The digital platform for aviation engineering professionals.
          </p>
        </div>

        {/* OAuth buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            onClick={() => handleOAuth('google')}
            className="w-full h-12 bg-black text-white hover:bg-gray-800 font-bold rounded-xl"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <Button
            type="button"
            onClick={() => handleOAuth('apple')}
            className="w-full h-12 bg-black text-white hover:bg-gray-800 font-bold rounded-xl"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Email OTP */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold text-black">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-12 rounded-xl border-gray-300 focus:border-black focus:ring-black"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="button"
            onClick={handleSendMagicLink}
            className="w-full h-12 bg-black text-white hover:bg-gray-800 font-bold rounded-xl"
            disabled={loading || !email}
          >
            {loading ? 'Sending...' : 'Send magic link'}
          </Button>

          <button
            type="button"
            onClick={handleSendCode}
            disabled={loading || !email}
            className="w-full h-12 rounded-xl border border-black text-black font-bold hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Send code instead
          </button>
        </div>

        <p className="text-[11px] text-gray-300 text-center mt-6 leading-relaxed">
          By continuing you agree to our{' '}
          <Link href="/terms" className="hover:underline">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    }>
      <AuthForm />
    </Suspense>
  )
}
