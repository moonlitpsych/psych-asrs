'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import QuestionnaireForm from '@/components/QuestionnaireForm'
import ResultsDisplay from '@/components/ResultsDisplay'
import { QuestionnaireSession, QuestionResponse } from '@/types/questionnaire'
import { calculateASRSScores } from '@/lib/scoring'

export default function QuestionnairePage() {
  const params = useParams()
  const sessionId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<QuestionnaireSession | null>(null)
  const [existingResponses, setExistingResponses] = useState<QuestionResponse[]>([])
  const [completed, setCompleted] = useState(false)
  const [results, setResults] = useState<any>(null)

  useEffect(() => {
    loadSession()
  }, [sessionId])

  const loadSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`)

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 404) {
          setError('Session not found. Please check your link.')
        } else if (response.status === 410) {
          setError('This session has expired. Please contact your healthcare provider for a new link.')
        } else if (data.error === 'Session already completed') {
          // Try to load the completed results
          await loadCompletedResults()
          return
        } else {
          setError(data.error || 'Failed to load session')
        }
        setLoading(false)
        return
      }

      const data = await response.json()
      setSession(data.session)
      setExistingResponses(data.responses || [])
      setLoading(false)
    } catch (err) {
      console.error('Error loading session:', err)
      setError('Failed to load questionnaire. Please try again.')
      setLoading(false)
    }
  }

  const loadCompletedResults = async () => {
    try {
      // Get session data and responses
      const sessionResponse = await fetch(`/api/sessions/${sessionId}`)
      const sessionData = await sessionResponse.json()

      const responsesResponse = await fetch(`/api/sessions/${sessionId}/responses`)
      const responsesData = await responsesResponse.json()

      if (responsesData.responses && responsesData.responses.length > 0) {
        const scores = calculateASRSScores(responsesData.responses)
        setSession(sessionData.session)
        setResults({
          responses: responsesData.responses,
          scores
        })
        setCompleted(true)
      } else {
        setError('Session completed but no responses found.')
      }
    } catch (err) {
      console.error('Error loading completed results:', err)
      setError('Failed to load completed assessment results.')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (responses: QuestionResponse[]) => {
    const scores = calculateASRSScores(responses)

    // Save completion status to database
    try {
      const response = await fetch(`/api/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses, scores })
      })

      if (!response.ok) {
        console.error('Failed to save completion status')
      } else {
        console.log('Assessment completed and saved successfully')
      }
    } catch (error) {
      console.error('Error saving completion:', error)
    }

    setResults({ responses, scores })
    setCompleted(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading questionnaire...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Unable to Load Questionnaire</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            If you need assistance, please contact your healthcare provider.
          </p>
        </div>
      </div>
    )
  }

  if (completed && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">ASRS Assessment Results</h1>
          </div>
          <ResultsDisplay
            patientName={session?.patient_name || ''}
            patientEmail={session?.patient_email || ''}
            patientDob={session?.patient_dob}
            assessmentDate={new Date().toLocaleDateString()}
            responses={results.responses}
            scores={results.scores}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Adult ADHD Self-Report Scale</h1>
          <p className="text-gray-600 mt-2">ASRS Version 1.1</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Welcome, {session?.patient_name}
            </h2>
            <p className="text-gray-600">
              This questionnaire contains 18 questions about how you have felt and conducted yourself over the past 6 months.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Your responses will be automatically saved as you progress.
            </p>
          </div>
        </div>

        <QuestionnaireForm
          sessionId={sessionId}
          patientName={session?.patient_name || ''}
          onComplete={handleComplete}
        />
      </div>
    </div>
  )
}