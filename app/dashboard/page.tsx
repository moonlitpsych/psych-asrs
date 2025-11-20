'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'

interface SessionSummary {
  id: string
  unique_id: string
  patient_name: string
  patient_email: string
  patient_dob?: string
  phone_number?: string
  status: string
  created_at: string
  started_at?: string
  completed_at?: string
  expires_at: string
  clinician_email: string
  part_a_score?: number
  part_a_positive?: boolean
  total_score?: number
  severity?: string
  clinician_notified?: boolean
  responses_count: number
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'expired'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')

  useEffect(() => {
    // Check if already authenticated
    const authenticated = sessionStorage.getItem('dashboard_authenticated')
    if (authenticated === 'true') {
      setIsAuthenticated(true)
      loadSessions()
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === process.env.NEXT_PUBLIC_DASHBOARD_PASSWORD || password === 'admin') {
      setIsAuthenticated(true)
      sessionStorage.setItem('dashboard_authenticated', 'true')
      loadSessions()
    } else {
      alert('Incorrect password')
    }
  }

  const loadSessions = async () => {
    try {
      setLoading(true)
      console.log('Loading sessions from API...')

      // Fetch sessions from API endpoint
      const response = await fetch('/api/dashboard/sessions')
      const data = await response.json()

      console.log('API response:', data)

      if (!response.ok) {
        console.error('Error loading sessions:', data.error)
        return
      }

      if (data.sessions) {
        console.log('Loaded sessions:', data.sessions)
        setSessions(data.sessions)
      } else {
        setSessions([])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendReminderEmail = async (session: SessionSummary) => {
    const response = await fetch('/api/send-questionnaire-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_name: session.patient_name,
        patient_email: session.patient_email,
        phone_number: session.phone_number,
        clinician_email: session.clinician_email
      })
    })

    if (response.ok) {
      alert('Reminder email sent successfully')
    } else {
      alert('Failed to send reminder email')
    }
  }

  const exportToCSV = () => {
    const headers = ['Patient Name', 'Email', 'Status', 'Part A Score', 'Total Score', 'Severity', 'Created', 'Completed']
    const rows = filteredSessions.map(s => [
      s.patient_name,
      s.patient_email,
      s.status,
      s.part_a_score?.toString() || '',
      s.total_score?.toString() || '',
      s.severity || '',
      new Date(s.created_at).toLocaleDateString(),
      s.completed_at ? new Date(s.completed_at).toLocaleDateString() : ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ASRS_Dashboard_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredSessions = sessions
    .filter(s => filter === 'all' || s.status === filter)
    .filter(s =>
      searchTerm === '' ||
      s.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.patient_email.toLowerCase().includes(searchTerm.toLowerCase())
    )

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Dashboard Login</h2>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter dashboard password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="w-full py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">ASRS Assessment Dashboard</h1>

          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{sessions.length}</div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {sessions.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {sessions.filter(s => s.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">
                {sessions.filter(s => s.part_a_positive === true).length}
              </div>
              <div className="text-sm text-gray-600">Positive Screenings</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
            >
              <option value="all">All Sessions</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
            </select>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Export CSV
            </button>
            <button
              onClick={loadSessions}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Patient</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Status</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Part A</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Total</th>
                  <th className="text-center p-3 text-sm font-semibold text-gray-700">Severity</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Created</th>
                  <th className="text-left p-3 text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session) => (
                  <tr key={session.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="text-sm font-medium text-gray-900">{session.patient_name}</div>
                      <div className="text-xs text-gray-500">{session.patient_email}</div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        session.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        session.status === 'expired' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {session.part_a_score !== null && session.part_a_score !== undefined ? (
                        <span className={session.part_a_positive ? 'text-red-600 font-bold' : ''}>
                          {session.part_a_score}/6
                          {session.part_a_positive && ' ⚠️'}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-3 text-center">
                      {session.total_score !== null && session.total_score !== undefined ?
                        `${session.total_score}/72` : '-'}
                    </td>
                    <td className="p-3 text-center">
                      {session.severity ? (
                        <span className="capitalize">{session.severity}</span>
                      ) : '-'}
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {formatDate(session.created_at)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(`/questionnaire/${session.unique_id}`, '_blank')}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
                        </button>
                        {session.status === 'pending' && (
                          <button
                            onClick={() => sendReminderEmail(session)}
                            className="text-purple-600 hover:text-purple-800 text-sm"
                          >
                            Resend Email
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSessions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No sessions found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  )
}