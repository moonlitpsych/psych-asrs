'use client'

import { QuestionResponse } from '@/types/questionnaire'
import { useState } from 'react'
import { getQuestionnaireDefinition } from '@/lib/questionnaires'

interface ResultsDisplayProps {
  patientName: string
  patientEmail: string
  patientDob?: string
  assessmentDate: string
  responses: QuestionResponse[]
  scores: any // Flexible for different scoring types
  questionnaireType: string
}

export default function ResultsDisplay({
  patientName,
  patientEmail,
  patientDob,
  assessmentDate,
  responses,
  scores,
  questionnaireType = 'ASRS'
}: ResultsDisplayProps) {
  const [showDetailed, setShowDetailed] = useState(false)
  const [copied, setCopied] = useState(false)

  const questionnaireDef = getQuestionnaireDefinition(questionnaireType)

  const copyToClipboard = () => {
    const emailContent = formatResultsForEmail()
    navigator.clipboard.writeText(emailContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatResultsForEmail = () => {
    let email = `${questionnaireDef?.name || questionnaireType} ASSESSMENT RESULTS\n`
    email += `========================\n\n`
    email += `Patient: ${patientName}\n`
    email += `Date: ${assessmentDate}\n\n`

    email += `SCORES\n`
    email += `------\n`

    // Format scores based on questionnaire type
    if (questionnaireType === 'ASRS') {
      email += `Part A Score: ${scores.partAScore}/6 ${scores.partAPositive ? '(Positive)' : '(Negative)'}\n`
      email += `Total Score: ${scores.totalScore}/72\n`
      email += `Severity: ${scores.severity}\n`
    } else if (questionnaireType === 'PHQ9') {
      email += `Total Score: ${scores.totalScore}/27\n`
      email += `Severity: ${scores.severity}\n`
      if (scores.criticalItemFlagged) {
        email += `⚠️ CRITICAL: Suicidal ideation endorsed\n`
      }
    } else if (questionnaireType === 'GAD7') {
      email += `Total Score: ${scores.totalScore}/21\n`
      email += `Severity: ${scores.severity}\n`
    }

    email += `\nCLINICAL INTERPRETATION\n`
    email += `-----------------------\n`
    email += (scores.interpretation || 'No interpretation available') + '\n\n'

    email += `INDIVIDUAL RESPONSES\n`
    email += `--------------------\n`
    responses.forEach((r) => {
      email += `Q${r.question_number}: ${r.response_text} (${r.response_value})\n`
    })

    return email
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
    a.download = `${questionnaireType}_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
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
            <p><strong>Assessment Type:</strong> {questionnaireDef?.name || questionnaireType}</p>
          </div>
        </div>

        {/* Scores - Different display based on questionnaire type */}
        {questionnaireType === 'ASRS' && (
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
        )}

        {(questionnaireType === 'PHQ9' || questionnaireType === 'GAD7') && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Assessment Score</h3>
            <div className="text-3xl font-bold text-primary mb-2">
              {scores.totalScore}/{questionnaireType === 'PHQ9' ? '27' : '21'}
            </div>
            <p className="text-sm text-gray-600">
              Severity: <span className="font-semibold capitalize">{scores.severity}</span>
            </p>
            {scores.criticalItemFlagged && (
              <p className="text-sm text-red-600 font-semibold mt-2">
                ⚠️ CRITICAL: Patient endorsed suicidal ideation
              </p>
            )}
          </div>
        )}

        {/* Clinical Interpretation */}
        <div className={`border rounded-lg p-4 mb-6 ${scores.criticalItemFlagged ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
          <h3 className="font-semibold text-gray-700 mb-2">Clinical Interpretation</h3>
          <p className="text-sm text-gray-700">{scores.interpretation || 'Please consult with your healthcare provider for interpretation of these results.'}</p>
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