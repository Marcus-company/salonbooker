'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import InstagramGallery from '@/components/instagram/InstagramGallery';

interface Service {
  id: string;
  name: string;
  duration: string;
  price: string;
}

interface Staff {
  id: string;
  name: string;
}

export default function LandingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data: salonData } = await supabase
      .from('salons')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (salonData?.id) {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonData.id)
        .eq('is_active', true);
      setServices(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-slate-900">✨ HairsalonX</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#diensten" className="text-slate-600 hover:text-slate-900">Diensten</a>
              <a href="#over-ons" className="text-slate-600 hover:text-slate-900">Over ons</a>
              <a href="#contact" className="text-slate-600 hover:text-slate-900">Contact</a>
              <Link
                href="/afspraak"
                className="bg-slate-900 text-white px-6 py-2 rounded-full hover:bg-slate-800 transition-colors"
              >
                Afspraak maken
              </Link>
            </div>
            <Link
              href="/afspraak"
              className="md:hidden bg-slate-900 text-white px-4 py-2 rounded-full text-sm"
            >
              Afspraak
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
                Jouw haar verdient de{' '}
                <span className="text-blue-600">beste verzorging</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0">
                Professionele kappers in het hart van Roermond. Boek nu je afspraak 
                en ervaar de perfecte combinatie van stijl en verzorging.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/afspraak"
                  className="inline-flex items-center justify-center bg-slate-900 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-slate-800 transition-colors shadow-lg"
                >
                  Direct boeken →
                </Link>
                <a
                  href="#diensten"
                  className="inline-flex items-center justify-center bg-white text-slate-900 border-2 border-slate-200 px-8 py-4 rounded-full text-lg font-semibold hover:border-slate-400 transition-colors"
                >
                  Bekijk diensten
                </a>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Online boeken
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Gratis annuleren
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> 5★ reviews
                </span>
              </div>
            </div>

            {/* Quick Booking Widget */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Direct een afspraak maken</h2>
              <QuickBookingWidget />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="diensten" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Onze diensten</h2>
            <p className="mt-4 text-lg text-slate-600">Professionele behandelingen voor elk haartype</p>
          </div>

          {loading ? (
            <div className="text-center py-12">Laden...</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.length > 0 ? (
                services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))
              ) : (
                <>
                  <ServiceCardStatic
                    name="Knippen dames"
                    duration="45 min"
                    price="€35,00"
                    description="Inclusief wassen, knippen en stylen"
                  />
                  <ServiceCardStatic
                    name="Knippen heren"
                    duration="30 min"
                    price="€25,00"
                    description="Professionele herenknipbeurt"
                  />
                  <ServiceCardStatic
                    name="Kleuren"
                    duration="90 min"
                    price="€65,00"
                    description="Volledige kleurbehandeling"
                  />
                  <ServiceCardStatic
                    name="Highlights"
                    duration="120 min"
                    price="€85,00"
                    description="Prachtige highlights of balayage"
                  />
                  <ServiceCardStatic
                    name="Krullen"
                    duration="60 min"
                    price="€45,00"
                    description="Permanent of steiltang"
                  />
                  <ServiceCardStatic
                    name="Keratine"
                    duration="150 min"
                    price="€120,00"
                    description="Glad en sterk haar"
                  />
                </>
              )}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              href="/afspraak"
              className="inline-flex items-center bg-slate-900 text-white px-8 py-4 rounded-full font-semibold hover:bg-slate-800 transition-colors"
            >
              Bekijk alle diensten →
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📱"
              title="Online boeken"
              description="Boek je afspraak 24/7 via onze website. Simpel, snel en altijd beschikbaar."
            />
            <FeatureCard
              icon="⏰"
              title="Herinneringen"
              description="Ontv automatisch een herinnering via email of SMS voor je afspraak."
            />
            <FeatureCard
              icon="✨"
              title="Professioneel"
              description="Onze stylisten volgen de laatste trends en technieken voor het beste resultaat."
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Wat klanten zeggen</h2>
            <p className="mt-4 text-lg text-slate-600">4.9★ gemiddeld uit 200+ reviews</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              name="Sarah de Jong"
              rating={5}
              text="Geweldige service! Mijn haar ziet er fantastisch uit. De online boeking werkt super makkelijk."
            />
            <TestimonialCard
              name="Mark van den Berg"
              rating={5}
              text="Eindelijk een kapsalon die begrijpt wat ik wil. Professioneel en vriendelijk personeel."
            />
            <TestimonialCard
              name="Emma Bakker"
              rating={5}
              text="De herinnering via SMS is handig. Nooit meer een afspraak vergeten! Echt een aanrader."
            />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="over-ons" className="py-16 md:py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">Over HairsalonX</h2>
              <p className="mt-6 text-lg text-slate-300">
                Al meer dan 10 jaar de vertrouwde kapsalon in Roermond. Wij geloven dat goed haar 
                zorgt voor zelfvertrouwen. Daarom gaan wij voor niets minder dan perfectie.
              </p>
              <p className="mt-4 text-lg text-slate-300">
                Ons team van ervaren stylisten volgt regelmatig trainingen om op de hoogte te blijven 
                van de nieuwste trends en technieken.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-6">
                <Stat number="10+" label="Jaar ervaring" />
                <Stat number="2000+" label="Tevreden klanten" />
                <Stat number="5" label="Professionele stylisten" />
              </div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">Openingstijden</h3>
              <div className="space-y-3">
                <OpeningTime day="Maandag" hours="Gesloten" />
                <OpeningTime day="Dinsdag" hours="09:00 - 18:00" />
                <OpeningTime day="Woensdag" hours="09:00 - 18:00" />
                <OpeningTime day="Donderdag" hours="09:00 - 20:00" />
                <OpeningTime day="Vrijdag" hours="09:00 - 20:00" />
                <OpeningTime day="Zaterdag" hours="09:00 - 17:00" />
                <OpeningTime day="Zondag" hours="Gesloten" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Gallery */}
      <InstagramGallery />

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Contact</h2>
            <p className="mt-4 text-lg text-slate-600">Kom langs of neem contact op</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <ContactCard
              icon="📍"
              title="Adres"
              content={[
                'Hoofdstraat 123',
                '6041 AB Roermond',
                'Nederland'
              ]}
            />
            <ContactCard
              icon="📞"
              title="Telefoon"
              content={['06-12345678', 'Ma-Za: 09:00 - 18:00']}
            />
            <ContactCard
              icon="✉️"
              title="Email"
              content={['info@hairsalonx.nl', 'Reactie binnen 24u']}
            />
          </div>

          {/* Google Maps */}
          <div className="mt-12 bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-6 md:p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Waar vind je ons</h3>
                <p className="text-slate-600 mb-4">
                  Bezoek onze salon in het centrum van Roermond. 
                  Gratis parkeergelegenheid beschikbaar.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📍</span>
                    <div>
                      <p className="font-medium text-slate-900">HairsalonX</p>
                      <p className="text-slate-600">Hoofdstraat 123</p>
                      <p className="text-slate-600">6041 AB Roermond</p>
                    </div>
                  </div>
                  <Link
                    href="https://maps.google.com/?q=Hoofdstraat+123+6041+AB+Roermond"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Route plannen in Google Maps →
                  </Link>
                </div>
              </div>              
              <div className="h-64 md:h-auto min-h-[300px] bg-slate-100 relative">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2482.927123456789!2d6.001234567890123!3d51.19512345678901!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTHCsDExJzQyLjQiTiA2wrAwMCcwNi4wIkU!5e0!3m2!1snl!2snl!4v1234567890123!5m2!1snl!2snl"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                  title="Salon locatie"
                />
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900">
              Klaar voor een nieuwe look?
            </h3>
            <p className="mt-4 text-lg text-slate-600">
              Boek nu je afspraak en ervaar het verschil
            </p>
            <Link
              href="/afspraak"
              className="inline-flex items-center bg-slate-900 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-slate-800 transition-colors mt-8"
            >
              Afspraak maken →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white text-lg font-semibold mb-4">✨ HairsalonX</h4>
              <p className="text-sm">Professionele kapsalon in het hart van Roermond.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Snelle links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/afspraak" className="hover:text-white">Afspraak maken</Link></li>
                <li><a href="#diensten" className="hover:text-white">Diensten</a></li>
                <li><a href="#over-ons" className="hover:text-white">Over ons</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>Hoofdstraat 123</li>
                <li>6041 AB Roermond</li>
                <li>06-12345678</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Volg ons</h4>
              <div className="flex gap-4">
                <a href="#" className="hover:text-white">Instagram</a>
                <a href="#" className="hover:text-white">Facebook</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-sm text-center">
            © 2026 HairsalonX. Alle rechten voorbehouden.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Quick Booking Widget Component
function QuickBookingWidget() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data: salonData } = await supabase
      .from('salons')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (salonData?.id) {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('salon_id', salonData.id)
        .eq('is_active', true)
        .limit(5);
      setServices(data || []);
    }
  };

  const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

  const handleSubmit = () => {
    if (selectedService && date && time) {
      window.location.href = `/afspraak?service=${selectedService}&date=${date}&time=${time}`;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Behandeling</label>
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
        >
          <option value="">Kies een behandeling</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Datum</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Tijd</label>
        <div className="grid grid-cols-3 gap-2">
          {timeSlots.map((t) => (
            <button
              key={t}
              onClick={() => setTime(t)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                time === t
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedService || !date || !time}
        className="w-full py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Afspraak maken
      </button>

      <p className="text-xs text-slate-500 text-center">
        Gratis annuleren tot 24 uur van tevoren
      </p>
    </div>
  );
}

// Service Card from DB
function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold text-slate-900">{service.name}</h3>
      <p className="text-slate-500 mt-1">{service.duration}</p>
      <p className="text-2xl font-bold text-slate-900 mt-4">{service.price}</p>
      <Link
        href="/afspraak"
        className="mt-4 block w-full text-center py-2 bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
      >
        Boeken
      </Link>
    </div>
  );
}

// Static Service Card
function ServiceCardStatic({
  name,
  duration,
  price,
  description,
}: {
  name: string;
  duration: string;
  price: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-100 p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold text-slate-900">{name}</h3>
      <p className="text-slate-500 mt-1">{duration} • {description}</p>
      <p className="text-2xl font-bold text-slate-900 mt-4">{price}</p>
      <Link
        href="/afspraak"
        className="mt-4 block w-full text-center py-2 bg-slate-100 text-slate-900 rounded-lg hover:bg-slate-200 transition-colors"
      >
        Boeken
      </Link>
    </div>
  );
}

// Feature Card
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="text-center p-6">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}

// Testimonial Card
function TestimonialCard({ name, rating, text }: { name: string; rating: number; text: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-6">
      <div className="flex gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <span key={i} className="text-yellow-400">★</span>
        ))}
      </div>
      <p className="text-slate-700 mb-4">"{text}"</p>
      <p className="font-semibold text-slate-900">{name}</p>
    </div>
  );
}

// Stat Component
function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-white">{number}</div>
      <div className="text-sm text-slate-400 mt-1">{label}</div>
    </div>
  );
}

// Opening Time
function OpeningTime({ day, hours }: { day: string; hours: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-700 last:border-0">
      <span className="text-slate-300">{day}</span>
      <span className="text-white font-medium">{hours}</span>
    </div>
  );
}

// Contact Card
function ContactCard({ icon, title, content }: { icon: string; title: string; content: string[] }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-slate-900 mb-4">{title}</h3>
      {content.map((line, i) => (
        <p key={i} className="text-slate-600">{line}</p>
      ))}
    </div>
  );
}
