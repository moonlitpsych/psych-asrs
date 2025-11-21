'use client'

import { useState, useEffect } from 'react'
import { ASRS_QUESTIONS, TOTAL_QUESTIONS } from '@/lib/questionnaire-data'
import { RESPONSE_OPTIONS, QuestionResponse } from '@/types/questionnaire'
import { calculateASRSScores } from '@/lib/scoring'

interface QuestionnaireFormProps {
  sessionId: string
  patientName: string
  onComplete?: (responses: QuestionResponse[]) => void
}

export default function QuestionnaireForm({ sessionId, patientName, onComplete }: QuestionnaireFormProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<QuestionResponse[]>([])
  const [selectedValue, setSelectedValue] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRevisiting, setIsRevisiting] = useState(false)

  const question = ASRS_QUESTIONS[currentQuestion]
  const progress = ((currentQuestion + 1) / TOTAL_QUESTIONS) * 100

  useEffect(() => {
    // Reset selected value when changing questions
    // Don't reset isRevisiting here - it's managed by navigation
    setSelectedValue(null)
  }, [currentQuestion])

  useEffect(() => {
    // Keyboard navigation
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '5') {
        const value = parseInt(e.key) - 1
        setSelectedValue(value)
        handleResponse(value)
      } else if (e.key === 'Enter' && selectedValue !== null) {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedValue, currentQuestion])

  const handleResponse = (value: number) => {
    setSelectedValue(value)
    setIsRevisiting(false) // User made a fresh selection, not revisiting

    // Auto-advance after 400ms
    setTimeout(() => {
      handleNext(value)
    }, 400)
  }

  const handleNext = async (value: number = selectedValue!) => {
    if (value === null) return

    const response: QuestionResponse = {
      question_number: question.id,
      question_text: question.text,
      response_value: value,
      response_text: RESPONSE_OPTIONS[value].label
    }

    const newResponses = [...responses, response]
    setResponses(newResponses)

    // Save response to database
    await saveResponse(sessionId, response)

    if (currentQuestion < TOTAL_QUESTIONS - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setIsRevisiting(false) // Moving forward, not revisiting
    } else {
      // All questions answered, complete the assessment
      await completeAssessment(newResponses)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      // Remove the last response if going back
      setResponses(responses.slice(0, -1))
      setIsRevisiting(true) // User is going back to a previous question
    }
  }

  const saveResponse = async (sessionId: string, response: QuestionResponse) => {
    try {
      await fetch(`/api/sessions/${sessionId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response)
      })
    } catch (error) {
      console.error('Failed to save response:', error)
    }
  }

  const completeAssessment = async (allResponses: QuestionResponse[]) => {
    setIsSubmitting(true)

    try {
      // Calculate scores
      const scores = calculateASRSScores(allResponses)

      // Save results to database
      await fetch(`/api/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: allResponses,
          scores
        })
      })

      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete(allResponses)
      }
    } catch (error) {
      console.error('Failed to complete assessment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitting) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moonlit-coral mx-auto mb-4"></div>
          <p className="text-gray-600">Submitting your responses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-moonlit-coral transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 text-center text-sm text-gray-600">
          Question {currentQuestion + 1} of {TOTAL_QUESTIONS}
          {question.part === 'A' ? ' (Part A)' : ' (Part B)'}
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-2">
          <span className="inline-block px-3 py-1 bg-moonlit-coral text-white text-sm font-semibold rounded-full">
            Question {question.id}
          </span>
        </div>

        <h2 className="text-xl font-medium text-gray-800 mb-8">
          {question.text}
        </h2>

        {/* Response Options */}
        <div className="space-y-3">
          {RESPONSE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleResponse(option.value)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-moonlit-coral hover:bg-moonlit-cream ${
                selectedValue === option.value
                  ? 'border-moonlit-coral bg-moonlit-cream'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 ${
                      selectedValue === option.value
                        ? 'border-moonlit-coral bg-moonlit-coral'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedValue === option.value && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-grow">
                  <span className="text-gray-800">{option.label}</span>
                  <span className="ml-2 text-sm text-gray-500">({option.key})</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Back
          </button>

          {selectedValue !== null && isRevisiting && (
            <button
              onClick={() => handleNext()}
              className="px-6 py-2 bg-moonlit-coral text-white rounded-full hover:bg-moonlit-coral-hover font-medium transition"
            >
              {currentQuestion === TOTAL_QUESTIONS - 1 ? 'Complete' : 'Next →'}
            </button>
          )}
        </div>

        {/* Keyboard hint */}
        <div className="text-center mt-4 text-sm text-gray-500">
          Press 1-5 to select, Enter to continue
        </div>

        {/* Part A Complete Message */}
        {currentQuestion === 5 && (
          <div className="text-center mt-6 text-moonlit-coral font-semibold">
            Part A Complete - Continue to Part B
          </div>
        )}
      </div>
    </div>
  )
}