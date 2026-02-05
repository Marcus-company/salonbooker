'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Staff {
  id: string
  name: string
  email: string
  phone?: string
  role: 'admin' | 'staff'
  bio?: string
  photo_url?: string
  is_active: boolean
  created_at: string
}

export default function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff' as 'admin' | 'staff',
    bio: '',
    is_active: true,
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching staff:', error)
    } else {
      setStaff(data || [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingStaff) {
      // Update existing
      const { error } = await supabase
        .from('staff')
        .update(formData)
        .eq('id', editingStaff.id)

      if (error) {
        console.error('Error updating staff:', error)
      }
    } else {
      // Create new
      const { error } = await supabase
        .from('staff')
        .insert([formData])

      if (error) {
        console.error('Error creating staff:', error)
      }
    }

    setShowAddModal(false)
    setEditingStaff(null)
    setFormData({ name: '', email: '', phone: '', role: 'staff', bio: '', is_active: true })
    fetchStaff()
  }

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('staff')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (!error) {
      fetchStaff()
    }
  }

  const startEdit = (member: Staff) => {
    setEditingStaff(member)
    setFormData({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      bio: member.bio || '',
      is_active: member.is_active,
    })
    setShowAddModal(true)
  }

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner size="lg" text="Medewerkers laden..." />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Medewerkers</h1>
          <p className="text-slate-600">Beheer salon personeel</p>
        </div>
        <button 
          onClick={() => {
            setEditingStaff(null)
            setFormData({ name: '', email: '', phone: '', role: 'staff', bio: '', is_active: true })
            setShowAddModal(true)
          }}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          + Nieuwe medewerker
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">Totaal</p>
          <p className="text-2xl font-bold text-slate-900">{staff.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">Actief</p>
          <p className="text-2xl font-bold text-green-600">{staff.filter(s => s.is_active).length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-sm text-slate-500">Admins</p>
          <p className="text-2xl font-bold text-purple-600">{staff.filter(s => s.role === 'admin').length}</p>
        </div>
      </div>

      {/* Staff grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <div key={member.id} className={`bg-white rounded-xl shadow-sm border ${member.is_active ? 'border-slate-200' : 'border-slate-200 opacity-60'} p-6`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{member.name}</h3>
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    member.role === 'admin' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {member.role === 'admin' ? 'Admin' : 'Medewerker'}
                  </span>
                </div>
              </div>
              {!member.is_active && (
                <span className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded">Inactief</span>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-slate-600">📧 {member.email}</p>
              {member.phone && <p className="text-slate-600">📞 {member.phone}</p>}
            </div>

            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => startEdit(member)}
                className="flex-1 px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Bewerk
              </button>
              <button 
                onClick={() => toggleActive(member.id, member.is_active)}
                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                  member.is_active 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {member.is_active ? 'Deactiveer' : 'Activeer'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {editingStaff ? 'Medewerker bewerken' : 'Nieuwe medewerker'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Naam</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefoon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'staff' })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                >
                  <option value="staff">Medewerker</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
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
                  {editingStaff ? 'Opslaan' : 'Toevoegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
