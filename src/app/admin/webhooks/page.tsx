'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

const EVENT_OPTIONS = [
  { value: 'booking.created', label: 'Afspraak aangemaakt' },
  { value: 'booking.updated', label: 'Afspraak gewijzigd' },
  { value: 'booking.cancelled', label: 'Afspraak geannuleerd' },
  { value: '*', label: 'Alle events' }
]

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null)
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: ['booking.created', 'booking.updated', 'booking.cancelled']
  })

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/webhooks')
      if (response.ok) {
        const data = await response.json()
        setWebhooks(data.webhooks || [])
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error)
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const url = editingWebhook 
      ? `/api/webhooks/${editingWebhook.id}`
      : '/api/webhooks'
    
    const method = editingWebhook ? 'PATCH' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowAddModal(false)
        setEditingWebhook(null)
        setFormData({ name: '', url: '', events: ['booking.created', 'booking.updated', 'booking.cancelled'] })
        fetchWebhooks()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save webhook')
      }
    } catch (error) {
      console.error('Error saving webhook:', error)
      alert('Failed to save webhook')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze webhook wilt verwijderen?')) return

    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchWebhooks()
      } else {
        alert('Failed to delete webhook')
      }
    } catch (error) {
      console.error('Error deleting webhook:', error)
    }
  }

  const handleTest = async (id: string) => {
    setTestingWebhook(id)
    try {
      const response = await fetch(`/api/webhooks/test/${id}`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Webhook test succesvol!')
      } else {
        const error = await response.json()
        alert(`Test mislukt: ${error.error}`)
      }
    } catch (error) {
      alert('Test failed')
    }
    setTestingWebhook(null)
  }

  const toggleActive = async (webhook: Webhook) => {
    try {
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !webhook.is_active })
      })

      if (response.ok) {
        fetchWebhooks()
      }
    } catch (error) {
      console.error('Error toggling webhook:', error)
    }
  }

  const startEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook)
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events
    })
    setShowAddModal(true)
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <LoadingSpinner size="lg" text="Webhooks laden..." />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Webhooks</h1>
          <p className="text-slate-600 text-sm md:text-base">Beheer webhook integraties voor externe systemen</p>
        </div>
        <button 
          onClick={() => {
            setEditingWebhook(null)
            setFormData({ name: '', url: '', events: ['booking.created', 'booking.updated', 'booking.cancelled'] })
            setShowAddModal(true)
          }}
          className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          + Nieuwe webhook
        </button>
      </div>

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-slate-500 mb-4">Nog geen webhooks geconfigureerd</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Webhook toevoegen
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div 
              key={webhook.id} 
              className={`bg-white rounded-xl shadow-sm border ${webhook.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'} p-4 md:p-6`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">{webhook.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      webhook.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {webhook.is_active ? 'Actief' : 'Inactief'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-2 font-mono break-all">{webhook.url}</p>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <span 
                        key={event}
                        className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTest(webhook.id)}
                    disabled={testingWebhook === webhook.id}
                    className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                  >
                    {testingWebhook === webhook.id ? 'Testen...' : 'Test'}
                  </button>
                  <button
                    onClick={() => toggleActive(webhook)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      webhook.is_active
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {webhook.is_active ? 'Deactiveer' : 'Activeer'}
                  </button>
                  <button
                    onClick={() => startEdit(webhook)}
                    className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Bewerk
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Verwijder
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                {editingWebhook ? 'Webhook bewerken' : 'Nieuwe webhook'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Naam
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="Bijv. Booking Sync"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="https://example.com/webhook"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Events
                  </label>
                  <div className="space-y-2">
                    {EVENT_OPTIONS.map((option) => (
                      <label key={option.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.events.includes(option.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                events: [...formData.events, option.value]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                events: formData.events.filter(e => e !== option.value)
                              })
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Annuleer
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    {editingWebhook ? 'Opslaan' : 'Toevoegen'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
