'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getAvailableQuestionnaires } from '@/lib/questionnaires'

export default function Home() {
  const [showSendForm, setShowSendForm] = useState(false)
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_email: '',
    patient_dob: '',
    phone_number: '',
    clinician_email: process.env.NEXT_PUBLIC_CLINICIAN_EMAIL || '',
    send_method: 'email' as 'email' | 'sms' | 'both',
    questionnaire_type: 'ASRS' // New field
  })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  // Get available questionnaires
  const questionnaires = getAvailableQuestionnaires()

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedToClipboard(true)
      setTimeout(() => setCopiedToClipboard(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const formatSmsMessage = (patientName: string, questionnaireType: string, link: string) => {
    const qName = questionnaires.find(q => q.code === questionnaireType)?.name || 'assessment'
    return `Hi ${patientName}, your provider has requested you complete the ${qName}. Please click the link below to begin (takes 5-10 min):

${link}

This link expires in 48 hours. Reply STOP to opt out.`
  }

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
        setCopiedToClipboard(false)
        if (formData.send_method === 'email') {
          setFormData({
            patient_name: '',
            patient_email: '',
            patient_dob: '',
            phone_number: '',
            clinician_email: formData.clinician_email,
            send_method: 'email',
            questionnaire_type: 'ASRS'
          })
        }
      }
    } catch (error) {
      setResult({ error: 'Failed to send questionnaire link' })
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="min-h-screen bg-moonlit-cream">
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-moonlit-navy mb-4">
            Psychiatric Assessment Platform
          </h1>
          <p className="text-xl text-moonlit-gray">
            Digital screening tools for mental health assessment
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
              className="block w-full py-3 bg-moonlit-coral text-white text-center rounded-full hover:bg-moonlit-coral-hover transition font-medium"
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
              Send psychiatric screening assessments to patients via email or SMS.
            </p>
            <button
              onClick={() => setShowSendForm(!showSendForm)}
              className="w-full py-3 bg-moonlit-coral text-white rounded-full hover:bg-moonlit-coral-hover transition font-medium"
            >
              {showSendForm ? 'Hide Form' : 'Send New Assessment'}
            </button>
          </div>
        </div>

        {showSendForm && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Send Assessment Link</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Questionnaire Type Selection - NEW */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assessment Type *
                </label>
                <select
                  value={formData.questionnaire_type}
                  onChange={(e) => setFormData({ ...formData, questionnaire_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-moonlit-coral"
                >
                  {questionnaires.map(q => (
                    <option key={q.code} value={q.code}>
                      {q.name} ({q.totalQuestions} questions)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {questionnaires.find(q => q.code === formData.questionnaire_type)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send Method *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="send_method"
                      value="email"
                      checked={formData.send_method === 'email'}
                      onChange={(e) => setFormData({ ...formData, send_method: e.target.value as any })}
                      className="mr-2"
                    />
                    <span>Email Only</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="send_method"
                      value="sms"
                      checked={formData.send_method === 'sms'}
                      onChange={(e) => setFormData({ ...formData, send_method: e.target.value as any })}
                      className="mr-2"
                    />
                    <span>SMS/Text Only</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="send_method"
                      value="both"
                      checked={formData.send_method === 'both'}
                      onChange={(e) => setFormData({ ...formData, send_method: e.target.value as any })}
                      className="mr-2"
                    />
                    <span>Both Email & SMS</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.patient_name}
                  onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-moonlit-coral"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Email {formData.send_method !== 'sms' && '*'}
                </label>
                <input
                  type="email"
                  required={formData.send_method !== 'sms'}
                  value={formData.patient_email}
                  onChange={(e) => setFormData({ ...formData, patient_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-moonlit-coral"
                  placeholder={formData.send_method === 'sms' ? 'Optional for SMS only' : 'patient@example.com'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number {(formData.send_method === 'sms' || formData.send_method === 'both') && '*'}
                </label>
                <input
                  type="tel"
                  required={formData.send_method === 'sms' || formData.send_method === 'both'}
                  placeholder="(555) 123-4567"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-moonlit-coral"
                />
                {(formData.send_method === 'sms' || formData.send_method === 'both') && (
                  <p className="text-xs text-gray-500 mt-1">Required for SMS delivery</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.patient_dob}
                  onChange={(e) => setFormData({ ...formData, patient_dob: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-moonlit-coral"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-moonlit-coral"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 bg-moonlit-coral text-white rounded-full hover:bg-moonlit-coral-hover disabled:opacity-50 font-medium transition"
              >
                {sending ? 'Processing...' :
                  formData.send_method === 'email' ? 'Send Assessment Link via Email' :
                    formData.send_method === 'sms' ? 'Generate SMS Link' :
                      'Send via Email & Generate SMS'}
              </button>
            </form>

            {result && (
              <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-50 text-green-800' :
                  result.warning ? 'bg-yellow-50 text-yellow-800' :
                    'bg-red-50 text-red-800'
                }`}>
                {result.success && (
                  <>
                    {formData.send_method === 'email' ? (
                      <>
                        <p className="font-semibold">✓ Assessment email sent successfully!</p>
                        <p className="text-sm mt-2">The patient will receive the {formData.questionnaire_type} questionnaire link at {formData.patient_email}</p>
                        <p className="text-sm">Link: {result.questionnaire_link}</p>
                      </>
                    ) : formData.send_method === 'sms' ? (
                      <>
                        <p className="font-semibold">📱 SMS Message Ready!</p>
                        <p className="text-sm mt-2 mb-3">Copy the message below and send it to {formData.phone_number}:</p>
                        <div className="bg-white p-3 rounded border border-green-200 text-sm font-mono whitespace-pre-wrap">
                          {formatSmsMessage(formData.patient_name, formData.questionnaire_type, result.questionnaire_link)}
                        </div>
                        <button
                          onClick={() => copyToClipboard(formatSmsMessage(formData.patient_name, formData.questionnaire_type, result.questionnaire_link))}
                          className="mt-3 px-4 py-2 bg-moonlit-coral text-white rounded-full hover:bg-moonlit-coral-hover text-sm font-medium transition"
                        >
                          {copiedToClipboard ? '✓ Copied!' : '📋 Copy SMS Message'}
                        </button>
                        <p className="text-xs mt-2 italic">Tip: You can send this via your phone's native messaging app or any SMS service.</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold">✓ Email sent & SMS ready!</p>
                        <p className="text-sm mt-2">Email sent to: {formData.patient_email}</p>
                        <p className="text-sm mt-2 mb-3">Copy this SMS for {formData.phone_number}:</p>
                        <div className="bg-white p-3 rounded border border-green-200 text-sm font-mono whitespace-pre-wrap">
                          {formatSmsMessage(formData.patient_name, formData.questionnaire_type, result.questionnaire_link)}
                        </div>
                        <button
                          onClick={() => copyToClipboard(formatSmsMessage(formData.patient_name, formData.questionnaire_type, result.questionnaire_link))}
                          className="mt-3 px-4 py-2 bg-moonlit-coral text-white rounded-full hover:bg-moonlit-coral-hover text-sm font-medium transition"
                        >
                          {copiedToClipboard ? '✓ Copied!' : '📋 Copy SMS Message'}
                        </button>
                      </>
                    )}
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
          <p>Supporting ASRS, PHQ-9, and GAD-7 screening tools</p>
        </div>
      </div>
    </main>
  )
}