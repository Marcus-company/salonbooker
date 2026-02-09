'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  total_bookings: number
  last_visit: string
  created_at: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  category: 'welcome' | 'reminder' | 'promotion' | 'winback'
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welkom nieuwe klant',
    subject: 'Welkom bij HairsalonX!',
    body: `Beste {{name}},

Welkom bij HairsalonX! We zijn blij dat je voor ons hebt gekozen.

Je eerste afspraak staat gepland. We zien je graag binnenkort!

Met vriendelijke groet,
Team HairsalonX`,
    category: 'welcome',
  },
  {
    id: 'reminder',
    name: 'Afspraak herinnering',
    subject: 'Herinnering: je afspraak morgen',
    body: `Beste {{name}},

Dit is een herinnering voor je afspraak morgen om {{time}}.

Service: {{service}}
Datum: {{date}}
Tijd: {{time}}

Tot morgen!

Met vriendelijke groet,
Team HairsalonX`,
    category: 'reminder',
  },
  {
    id: 'promotion',
    name: 'Zomer aanbieding',
    subject: 'Speciale zomerkorting! 20% korting',
    body: `Beste {{name}},

Geniet van onze zomeraanbieding! 

🌞 20% korting op alle kleurbehandelingen
🌞 Geldig t/m 31 augustus
🌞 Boek nu je afspraak

Bel 06-12345678 of boek online.

Met vriendelijke groet,
Team HairsalonX`,
    category: 'promotion',
  },
  {
    id: 'winback',
    name: 'We missen je',
    subject: 'We missen je bij HairsalonX!',
    body: `Beste {{name}},

We hebben je even niet gezien! Je laatste bezoek was op {{last_visit}}.

Als returning customer krijg je 15% korting op je volgende afspraak.

Boek nu en gebruik code: COMEBACK15

Met vriendelijke groet,
Team HairsalonX`,
    category: 'winback',
  },
]

export default function MarketingPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>(defaultTemplates[0])
  const [customSubject, setCustomSubject] = useState('')
  const [customBody, setCustomBody] = useState('')
  const [segment, setSegment] = useState<'all' | 'new' | 'returning' | 'inactive'>('all')
  const [previewCustomer, setPreviewCustomer] = useState<Customer | null>(null)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ success: number; failed: number } | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    setCustomSubject(selectedTemplate.subject)
    setCustomBody(selectedTemplate.body)
  }, [selectedTemplate])

  const fetchCustomers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching customers:', error)
    } else {
      setCustomers(data || [])
      if (data && data.length > 0) {
        setPreviewCustomer(data[0])
      }
    }
    setLoading(false)
  }

  const getFilteredCustomers = () => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    switch (segment) {
      case 'new':
        return customers.filter(c => new Date(c.created_at) > thirtyDaysAgo)
      case 'returning':
        return customers.filter(c => c.total_bookings > 1)
      case 'inactive':
        return customers.filter(c => !c.last_visit || new Date(c.last_visit) < ninetyDaysAgo)
      default:
        return customers
    }
  }

  const getSegmentLabel = () => {
    switch (segment) {
      case 'new': return 'Nieuwe klanten (< 30 dagen)'
      case 'returning': return 'Terugkerende klanten'
      case 'inactive': return 'Inactieve klanten (> 90 dagen)'
      default: return 'Alle klanten'
    }
  }

  const interpolateTemplate = (template: string, customer: Customer) => {
    return template
      .replace(/{{name}}/g, customer.name)
      .replace(/{{email}}/g, customer.email)
      .replace(/{{phone}}/g, customer.phone || '')
      .replace(/{{last_visit}}/g, customer.last_visit ? new Date(customer.last_visit).toLocaleDateString('nl-NL') : 'onbekend')
      .replace(/{{total_bookings}}/g, customer.total_bookings.toString())
  }

  const handleSendCampaign = async () => {
    const targetCustomers = getFilteredCustomers()
    if (targetCustomers.length === 0) {
      alert('Geen klanten in dit segment')
      return
    }

    if (!confirm(`Campagne versturen naar ${targetCustomers.length} klanten?`)) {
      return
    }

    setSending(true)
    setSendResult(null)

    let success = 0
    let failed = 0

    for (const customer of targetCustomers) {
      try {
        const response = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: customer.email,
            subject: interpolateTemplate(customSubject, customer),
            html: interpolateTemplate(customBody, customer).replace(/\n/g, '<br>'),
          }),
        })

        if (response.ok) {
          success++
        } else {
          failed++
        }
      } catch (error) {
        console.error('Error sending email:', error)
        failed++
      }
    }

    setSendResult({ success, failed })
    setSending(false)
  }

  const filteredCustomers = getFilteredCustomers()

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <LoadingSpinner size="lg" text="Klanten laden..." />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Marketing</h1>
        <p className="text-slate-600 text-sm md:text-base">E-mail campagnes naar klanten</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Campaign Builder */}
        <div className="space-y-6">
          {/* Template Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">1. Kies template</h2>
            <div className="grid grid-cols-2 gap-3">
              {defaultTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedTemplate.id === template.id
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium text-slate-900">{template.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{template.category}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Segment Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">2. Kies segment</h2>
            <div className="grid grid-cols-2 gap-3">
              {(['all', 'new', 'returning', 'inactive'] as const).map((seg) => (
                <button
                  key={seg}
                  onClick={() => setSegment(seg)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    segment === seg
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-medium text-slate-900">
                    {seg === 'all' ? 'Alle klanten' : seg === 'new' ? 'Nieuwe klanten' : seg === 'returning' ? 'Terugkerend' : 'Inactief'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {seg === 'all' ? customers.length : seg === 'new' ? customers.filter(c => new Date(c.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length : seg === 'returning' ? customers.filter(c => c.total_bookings > 1).length : customers.filter(c => !c.last_visit || new Date(c.last_visit) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)).length} klanten
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Email Editor */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">3. Bewerk e-mail</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Onderwerp</label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bericht</label>
                <textarea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Gebruik {'{{name}}'}, {'{{email}}'}, {'{{last_visit}}'} voor personalisatie
                </p>
              </div>
            </div>
          </div>

          {/* Send Button */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">4. Versturen</h2>
                <p className="text-sm text-slate-600">
                  {filteredCustomers.length} klanten in segment &quot;{getSegmentLabel()}&quot;
                </p>
              </div>
            </div>

            {sendResult && (
              <div className={`mb-4 p-3 rounded-lg ${sendResult.failed === 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                <p className="font-medium">
                  ✅ {sendResult.success} verstuurd
                  {sendResult.failed > 0 && ` • ❌ ${sendResult.failed} mislukt`}
                </p>
              </div>
            )}

            <button
              onClick={handleSendCampaign}
              disabled={sending || filteredCustomers.length === 0}
              className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {sending ? 'Bezig met versturen...' : `Verstuur naar ${filteredCustomers.length} klanten`}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Preview</h2>
            
            {/* Customer selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Bekijk als klant</label>
              <select
                value={previewCustomer?.id || ''}
                onChange={(e) => {
                  const customer = customers.find(c => c.id === e.target.value)
                  setPreviewCustomer(customer || null)
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Email preview */}
            {previewCustomer && (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-100 p-3 border-b border-slate-200">
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Aan:</span> {previewCustomer.name} &lt;{previewCustomer.email}&gt;
                  </p>
                  <p className="text-sm text-slate-600">
                    <span className="font-medium">Onderwerp:</span> {interpolateTemplate(customSubject, previewCustomer)}
                  </p>
                </div>
                <div className="p-4 bg-white">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: interpolateTemplate(customBody, previewCustomer).replace(/\n/g, '<br>')
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 md:p-6">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Tips</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Personaliseer met {'{{name}}'} voor betere open rates</li>
              <li>Houd onderwerp kort en pakkend</li>
              <li>Test eerst met een klein segment</li>
              <li>Vermijd spam-trigger woorden (GRATIS, ACTIE)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
