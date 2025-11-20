import { QuestionResponse } from '@/types/questionnaire'

export interface ScoringResult {
  partAScore: number
  partAPositive: boolean
  totalScore: number
  severity: 'minimal' | 'mild' | 'moderate' | 'severe'
}

/**
 * Calculate ASRS scores based on official guidelines
 * Part A (Questions 1-6):
 * - Questions 1-4: Count if response >= 3 (Often or Very Often)
 * - Questions 5-6: Count if response >= 4 (Very Often only)
 * - Score >= 4 indicates symptoms highly consistent with ADHD
 *
 * Total Score: Sum of all 18 responses (0-72 scale)
 * - < 17: Minimal symptoms
 * - 17-23: Mild symptoms
 * - 24-35: Moderate symptoms
 * - > 35: Severe symptoms
 */
export function calculateASRSScores(responses: QuestionResponse[]): ScoringResult {
  let partAScore = 0
  let totalScore = 0

  responses.forEach((response) => {
    const value = response.response_value
    totalScore += value

    // Part A scoring (Questions 1-6)
    if (response.question_number <= 6) {
      if (response.question_number <= 4 && value >= 3) {
        partAScore++
      } else if (response.question_number >= 5 && response.question_number <= 6 && value >= 4) {
        partAScore++
      }
    }
  })

  // Determine if Part A is positive for ADHD screening
  const partAPositive = partAScore >= 4

  // Determine severity based on total score
  let severity: 'minimal' | 'mild' | 'moderate' | 'severe'
  if (totalScore < 17) {
    severity = 'minimal'
  } else if (totalScore >= 17 && totalScore <= 23) {
    severity = 'mild'
  } else if (totalScore >= 24 && totalScore <= 35) {
    severity = 'moderate'
  } else {
    severity = 'severe'
  }

  return {
    partAScore,
    partAPositive,
    totalScore,
    severity
  }
}

/**
 * Generate a clinical interpretation text based on scores
 */
export function generateInterpretation(result: ScoringResult): string {
  let interpretation = ''

  if (result.partAPositive) {
    interpretation += 'Part A Score indicates symptoms highly consistent with ADHD in adults. '
  } else {
    interpretation += 'Part A Score is below the threshold for ADHD screening. '
  }

  interpretation += `Total score of ${result.totalScore} suggests ${result.severity} ADHD symptoms. `

  interpretation += 'Note: This screening tool is not a diagnostic instrument. A comprehensive evaluation by a qualified healthcare provider is required for diagnosis.'

  return interpretation
}

/**
 * Format results for email notification
 */
export function formatResultsForEmail(
  patientName: string,
  result: ScoringResult,
  responses: QuestionResponse[]
): string {
  const responseLabels = ['Never', 'Rarely', 'Sometimes', 'Often', 'Very Often']

  let email = `ASRS ASSESSMENT RESULTS\n`
  email += `========================\n\n`
  email += `Patient: ${patientName}\n`
  email += `Date: ${new Date().toLocaleDateString()}\n\n`

  email += `SCORES\n`
  email += `------\n`
  email += `Part A Score: ${result.partAScore}/6 ${result.partAPositive ? '(Positive)' : '(Negative)'}\n`
  email += `Total Score: ${result.totalScore}/72\n`
  email += `Severity: ${result.severity.charAt(0).toUpperCase() + result.severity.slice(1)}\n\n`

  email += `CLINICAL INTERPRETATION\n`
  email += `-----------------------\n`
  email += generateInterpretation(result) + '\n\n'

  email += `INDIVIDUAL RESPONSES\n`
  email += `--------------------\n`
  responses.forEach((r) => {
    email += `Q${r.question_number}: ${responseLabels[r.response_value]} (${r.response_value})\n`
  })

  return email
}