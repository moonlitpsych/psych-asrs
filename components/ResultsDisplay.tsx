'use client'

import { QuestionResponse } from '@/types/questionnaire'
import { ScoringResult, generateInterpretation, formatResultsForEmail } from '@/lib/scoring'
import { useState } from 'react'

interface ResultsDisplayProps {
  patientName: string
  patientEmail: string
  patientDob?: string
  assessmentDate: string
  responses: QuestionResponse[]
  scores: ScoringResult
}

export default function ResultsDisplay({
  patientName,
  patientEmail,
  patientDob,
  assessmentDate,
  responses,
  scores
}: ResultsDisplayProps) {
  const [showDetailed, setShowDetailed] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    const emailContent = formatResultsForEmail(patientName, scores, responses)
    navigator.clipboard.writeText(emailContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadCSV = () => {
    const headers = ['Question', 'Response', 'Score']
    const rows = responses.map(r => [
      `Q${r.question_number}`,
      r.response_text,
      r.response_value.toString()
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ASRS_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Assessment Complete</h2>

        {/* Patient Information */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Patient Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Name:</strong> {patientName}</p>
            <p><strong>Email:</strong> {patientEmail}</p>
            {patientDob && <p><strong>Date of Birth:</strong> {patientDob}</p>}
            <p><strong>Assessment Date:</strong> {assessmentDate}</p>
          </div>
        </div>

        {/* Scores */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-700 mb-3">Part A Score (Screening)</h3>
            <div className="text-3xl font-bold text-primary mb-2">
              {scores.partAScore}/6
            </div>
            <p className={`text-sm ${scores.partAPositive ? 'text-red-600 font-semibold' : 'text-green-600'}`}>
              {scores.partAPositive ? '⚠️ Positive for ADHD screening' : '✓ Below screening threshold'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-700 mb-3">Total Score</h3>
            <div className="text-3xl font-bold text-primary mb-2">
              {scores.totalScore}/72
            </div>
            <p className="text-sm text-gray-600">
              Severity: <span className="font-semibold capitalize">{scores.severity}</span>
            </p>
          </div>
        </div>

        {/* Clinical Interpretation */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">Clinical Interpretation</h3>
          <p className="text-sm text-gray-700">{generateInterpretation(scores)}</p>
        </div>

        {/* Detailed Responses Toggle */}
        <button
          onClick={() => setShowDetailed(!showDetailed)}
          className="mb-4 text-primary hover:text-secondary font-medium"
        >
          {showDetailed ? '▼' : '▶'} {showDetailed ? 'Hide' : 'Show'} Detailed Responses
        </button>

        {/* Detailed Responses Table */}
        {showDetailed && (
          <div className="mb-6 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Question
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                    Response
                  </th>
                  <th className="border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-700">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {responses.map((response, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                      Q{response.question_number}: {response.question_text}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-center text-sm text-gray-600">
                      {response.response_text}
                    </td>
                    <td className="border border-gray-200 px-4 py-2 text-center text-sm text-gray-600">
                      {response.response_value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={copyToClipboard}
            className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:opacity-90"
          >
            {copied ? '✓ Copied!' : 'Copy Report'}
          </button>
          <button
            onClick={downloadCSV}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Download CSV
          </button>
        </div>
      </div>
    </div>
  )
}