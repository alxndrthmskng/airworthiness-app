import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/profile')

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="aw-gradient py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-block bg-white/10 text-white text-sm font-medium px-3 py-1 rounded-full mb-6 border border-white/20">
            Aircraft Maintenance Recency
          </span>
          <h1 className="text-5xl text-white leading-tight mb-6">
            Free Continuation Training.
            <br />
            Human Factors. Electrical Wiring. Fuel Tank Safety.
          </h1>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            Study our courses, test your knowledge with our exam,
            and receive a verifiable certificate you can share with employers.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-[#2d3a80] hover:bg-white/90 font-semibold">Get started free</Button>
            </Link>
            <Link href="/courses">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">Browse courses</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="aw-gradient-light py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl text-center text-white mb-12">
            Everything you need to get certified
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                title: 'Expert-written courses',
                description: 'Text-based modules written by aviation professionals.',
              },
              {
                title: 'Multiple-Choice Exams',
                description: 'A minimum pass score of 75% to ensure you\'ve understood the material.',
              },
              {
                title: 'Verifiable certificates',
                description: 'Every certificate has a unique URL. Anyone can verify it\'s real in seconds.',
              },
            ].map(feature => (
              <div key={feature.title} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="aw-gradient py-24">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl text-white mb-4">
            Ready to get certified?
          </h2>
          <p className="text-white/70 mb-8">
            Join professionals already using the platform. Start with a free course today.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-white text-[#2d3a80] hover:bg-white/90 font-semibold">Create your free account</Button>
          </Link>
        </div>
      </section>

    </div>
  )
}
