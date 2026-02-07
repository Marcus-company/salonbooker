import InstagramFeed from '@/components/InstagramFeed'
import LocationMap from '@/components/LocationMap'
import Link from 'next/link'

export const metadata = {
  title: 'HairsalonX - Kapsalon in Amsterdam',
  description: 'Professionele kapsalon voor dames en heren. Boek nu je afspraak online!',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-slate-900">HairsalonX</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/afspraak" 
                className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Afspraak maken
              </Link>
              <Link 
                href="/" 
                className="text-slate-600 hover:text-slate-900"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-slate-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Jouw haar, onze passie
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Professionele kapsalon voor dames en heren. Van knippen tot kleuren, 
            wij zorgen voor het perfecte kapsel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/afspraak"
              className="bg-slate-900 text-white px-8 py-3 rounded-lg hover:bg-slate-800 transition-colors font-medium"
            >
              Boek nu je afspraak
            </Link>
            <a 
              href="tel:+31612345678"
              className="border-2 border-slate-300 text-slate-700 px-8 py-3 rounded-lg hover:border-slate-400 transition-colors font-medium"
            >
              Bel ons
            </a>
          </div>
        </div>
      </section>

      {/* Instagram Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Volg ons op Instagram
            </h2>
            <p className="text-slate-600">
              @hairsalonx — Blijf op de hoogte van ons laatste werk
            </p>
          </div>
          <InstagramFeed />
        </div>
      </section>

      {/* Location Section */}
      <section className="bg-slate-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Waar vind je ons
              </h2>
              <p className="text-slate-600 mb-8">
                Kom langs in onze salon. Gelegen in het centrum met gratis parkeergelegenheid 
                voor de deur. We zien je graag!
              </p>
              <LocationMap 
                address="Dorpsstraat 123"
                postcode="1234 AB" 
                city="Amsterdam"
              />
            </div>
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-4">Contact</h3>
                <div className="space-y-3 text-slate-600">
                  <p className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href="tel:+31612345678" className="hover:text-slate-900">06-12345678</a>
                  </p>
                  <p className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href="mailto:info@hairsalonx.nl" className="hover:text-slate-900">info@hairsalonx.nl</a>
                  </p>
                  <p className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ma-Vr: 09:00-18:00, Za: 09:00-16:00
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-4">Diensten</h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    Knippen dames & heren
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    Kleuren & highlights
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    Balayage & ombre
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    Bruidskapsels
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    Extensions
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-xl font-bold">HairsalonX</h3>
              <p className="text-slate-400 text-sm mt-1">© 2025 HairsalonX. Alle rechten voorbehouden.</p>
            </div>
            <div className="flex gap-6">
              <a href="https://instagram.com/hairsalonx" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                Instagram
              </a>
              <a href="https://facebook.com/hairsalonx" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                Facebook
              </a>
              <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
