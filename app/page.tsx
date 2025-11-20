'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [showSendForm, setShowSendForm] = useState(false)
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_email: '',
    patient_dob: '',
    phone_number: '',
    clinician_email: process.env.NEXT_PUBLIC_CLINICIAN_EMAIL || ''
  })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setResult(null)

    try {
      const response = await fetch('/api/send-questionnaire-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        // Reset form on success
        setFormData({
          patient_name: '',
          patient_email: '',
          patient_dob: '',
          phone_number: '',
          clinician_email: formData.clinician_email
        })
      }
    } catch (error) {
      setResult({ error: 'Failed to send questionnaire link' })
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            ASRS Assessment Tool
          </h1>
          <p className="text-xl text-gray-600">
            Adult ADHD Self-Report Scale Digital Assessment Platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-gray-800">Provider Dashboard</h2>
            </div>
            <p className="text-gray-600 mb-6">
              View all patient assessments, track completion status, and access detailed results.
            </p>
            <Link
              href="/dashboard"
              className="block w-full py-3 bg-gradient-to-r from-primary to-secondary text-white text-center rounded-lg hover:opacity-90 transition"
            >
              Open Dashboard
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">✉️</div>
              <h2 className="text-2xl font-bold text-gray-800">Send Assessment</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Send a new ASRS assessment link to a patient via email.
            </p>
            <button
              onClick={() => setShowSendForm(!showSendForm)}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:opacity-90 transition"
            >
              {showSendForm ? 'Hide Form' : 'Send New Assessment'}
            </button>
          </div>
        </div>

        {showSendForm && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Send Assessment Link</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.patient_email}
                  onChange={(e) => setFormData({ ...formData, patient_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (optional)
                </label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.patient_dob}
                  onChange={(e) => setFormData({ ...formData, patient_dob: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinician Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.clinician_email}
                  onChange={(e) => setFormData({ ...formData, clinician_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Assessment Link via Email'}
              </button>
            </form>

            {result && (
              <div className={`mt-6 p-4 rounded-lg ${
                result.success ? 'bg-green-50 text-green-800' :
                result.warning ? 'bg-yellow-50 text-yellow-800' :
                'bg-red-50 text-red-800'
              }`}>
                {result.success && (
                  <>
                    <p className="font-semibold">✓ Assessment email sent successfully!</p>
                    <p className="text-sm mt-2">The patient will receive the questionnaire link at {formData.patient_email}</p>
                    <p className="text-sm">Link: {result.questionnaire_link}</p>
                  </>
                )}
                {result.warning && (
                  <>
                    <p className="font-semibold">⚠️ {result.warning}</p>
                    <p className="text-sm mt-2">Manual link: {result.questionnaire_link}</p>
                    <p className="text-sm">Please email this link to the patient manually.</p>
                  </>
                )}
                {result.error && (
                  <p className="font-semibold">✗ {result.error}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>HIPAA-compliant assessment platform</p>
          <p>All data is encrypted and securely stored</p>
        </div>
      </div>
    </main>
  )
}