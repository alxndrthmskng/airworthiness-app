import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-background text-muted-foreground border-t">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <h3 className="text-foreground font-bold text-sm tracking-tight mb-3">Airworthiness Limited</h3>
            <p className="text-xs leading-relaxed">
              The digital platform for aviation engineering professionals and initial and continuing airworthiness organisations.
            </p>
          </div>

          {/* Professionals */}
          <div>
            <h4 className="text-foreground/80 font-semibold text-xs uppercase tracking-wider mb-3">Professionals</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/progress" className="hover:text-foreground transition-colors">Module Tracker</Link></li>
              <li><Link href="/logbook" className="hover:text-foreground transition-colors">Digital Logbook</Link></li>
              <li><Link href="/courses" className="hover:text-foreground transition-colors">Continuation Training</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-foreground/80 font-semibold text-xs uppercase tracking-wider mb-3">Legal</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-foreground transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-foreground/80 font-semibold text-xs uppercase tracking-wider mb-3">Contact</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="mailto:contact@airworthiness.org.uk" className="hover:text-foreground transition-colors">
                  contact@airworthiness.org.uk
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} Airworthiness Limited. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
