import { ScoringResult } from '@/lib/scoring'
import { QuestionResponse } from '@/types/questionnaire'
import {
  IntakeQClient,
  IntakeQNote,
  IntakeQApiResponse,
  IntakeQRateLimit,
  ASRSNoteContent,
  IntakeQSubmissionResult
} from './types'

// Configuration from environment
const INTAKEQ_API = process.env.INTAKEQ_API_URL || 'https://intakeq.com/api/v1'
const API_KEY = process.env.INTAKEQ_API_KEY
const PRACTITIONER_ID = process.env.INTAKEQ_PRACTITIONER_ID

// Rate limiting state (in-memory for now, could be Redis in production)
let rateLimiter: IntakeQRateLimit = {
  requests: 0,
  resetTime: Date.now() + 60000, // 1 minute window
  dailyRequests: 0,
  dailyResetTime: Date.now() + 86400000 // 24 hour window
}

/**
 * Check and enforce IntakeQ API rate limits
 * Limits: 10 requests per minute, 500 per day
 */
async function checkRateLimit(): Promise<void> {
  const now = Date.now()

  // Reset counters if time windows have passed
  if (now > rateLimiter.resetTime) {
    rateLimiter.requests = 0
    rateLimiter.resetTime = now + 60000
  }

  if (now > rateLimiter.dailyResetTime) {
    rateLimiter.dailyRequests = 0
    rateLimiter.dailyResetTime = now + 86400000
  }

  // Check daily limit
  if (rateLimiter.dailyRequests >= 500) {
    const waitTime = rateLimiter.dailyResetTime - now
    throw new Error(`Daily API limit reached. Resets in ${Math.ceil(waitTime / 1000 / 60)} minutes`)
  }

  // Check minute limit
  if (rateLimiter.requests >= 10) {
    const waitTime = rateLimiter.resetTime - now
    console.log(`Rate limit reached, waiting ${waitTime}ms`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
    return checkRateLimit() // Recursive check after waiting
  }

  // Increment counters
  rateLimiter.requests++
  rateLimiter.dailyRequests++
}

/**
 * Make authenticated request to IntakeQ API
 */
async function makeIntakeQRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<IntakeQApiResponse<T>> {
  if (!API_KEY) {
    throw new Error('IntakeQ API key not configured')
  }

  // Enforce rate limits
  await checkRateLimit()

  const url = `${INTAKEQ_API}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Auth-Key': API_KEY,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    // Handle non-200 responses
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`IntakeQ API error: ${response.status} - ${errorText}`)

      return {
        success: false,
        error: `IntakeQ API error: ${response.status}`,
        message: errorText
      }
    }

    const data = await response.json()
    return {
      success: true,
      data
    }
  } catch (error: any) {
    console.error('IntakeQ API request failed:', error)
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Format ASRS assessment results for IntakeQ treatment note
 */
function formatASRSForIntakeQ(
  scores: ScoringResult,
  responses: QuestionResponse[],
  sessionId: string
): ASRSNoteContent {
  const clinicalSignificance = scores.partAPositive
    ? 'Positive screening for adult ADHD - further clinical evaluation recommended'
    : 'Negative screening for adult ADHD'

  const interpretationNote = generateClinicalInterpretation(scores)

  // Map severity to IntakeQ format
  const severityMap: Record<string, 'None/Minimal' | 'Mild' | 'Moderate' | 'Severe'> = {
    'minimal': 'None/Minimal',
    'mild': 'Mild',
    'moderate': 'Moderate',
    'severe': 'Severe'
  }

  return {
    assessmentType: 'ASRS 1.1',
    assessmentDate: new Date().toISOString(),
    scores: {
      partA: `${scores.partAScore}/6`,
      partAPositive: scores.partAPositive,
      total: `${scores.totalScore}/72`,
      severity: severityMap[scores.severity.toLowerCase()] || 'None/Minimal'
    },
    clinicalSignificance,
    responses: responses.map(r => ({
      q: r.question_number,
      text: r.question_text,
      response: r.response_text,
      value: r.response_value
    })),
    interpretationNote,
    sessionId,
    timestamp: new Date().toISOString()
  }
}

/**
 * Generate professional clinical interpretation note
 */
function generateClinicalInterpretation(scores: ScoringResult): string {
  let interpretation = `Patient completed the Adult ADHD Self-Report Scale (ASRS) Version 1.1. `

  // Part A interpretation
  interpretation += `Part A screening ${scores.partAPositive ? 'POSITIVE' : 'NEGATIVE'} `
  interpretation += `(Score: ${scores.partAScore}/6). `

  if (scores.partAPositive) {
    interpretation += `This indicates symptoms highly consistent with ADHD in adults. `
  } else {
    interpretation += `This suggests symptoms are not consistent with ADHD screening criteria. `
  }

  // Total score interpretation
  interpretation += `Total symptom severity score: ${scores.totalScore}/72 (${scores.severity}). `

  // Severity-specific notes
  switch (scores.severity.toLowerCase()) {
    case 'severe':
      interpretation += `Severe symptom level suggests significant functional impairment. `
      interpretation += `Comprehensive clinical evaluation strongly recommended. `
      break
    case 'moderate':
      interpretation += `Moderate symptom level may indicate functional difficulties. `
      interpretation += `Clinical evaluation recommended to assess need for intervention. `
      break
    case 'mild':
      interpretation += `Mild symptom level present. `
      interpretation += `Monitor symptoms and consider evaluation if functional impairment increases. `
      break
    default:
      interpretation += `Minimal to no ADHD symptoms reported. `
      interpretation += `No immediate intervention indicated based on screening results. `
  }

  // Standard disclaimer
  interpretation += `NOTE: The ASRS is a screening tool and not diagnostic. `
  interpretation += `Comprehensive clinical assessment required for ADHD diagnosis.`

  return interpretation
}

/**
 * Submit ASRS assessment results to IntakeQ as a treatment note
 */
export async function submitASRSToIntakeQ(
  clientId: string | number,
  patientName: string,
  scores: ScoringResult,
  responses: QuestionResponse[],
  sessionId: string
): Promise<IntakeQSubmissionResult> {
  try {
    const noteContent = formatASRSForIntakeQ(scores, responses, sessionId)

    const note: Partial<IntakeQNote> = {
      ClientId: clientId,
      NoteName: `ASRS Assessment - ${new Date().toLocaleDateString()}`,
      Date: new Date().toISOString(),
      PractitionerId: PRACTITIONER_ID,
      Status: 'locked', // Auto-lock for completed assessments
      Content: noteContent,
      ExternalId: sessionId // Link back to our system
    }

    const result = await makeIntakeQRequest<IntakeQNote>('/notes', {
      method: 'POST',
      body: JSON.stringify(note)
    })

    if (result.success && result.data) {
      console.log(`ASRS results submitted to IntakeQ. Note ID: ${result.data.Id}`)
      return {
        success: true,
        noteId: result.data.Id,
        clientId: typeof clientId === 'string' ? parseInt(clientId) : clientId,
        timestamp: new Date().toISOString()
      }
    } else {
      console.error('Failed to submit ASRS to IntakeQ:', result.error)
      return {
        success: false,
        error: result.error || 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }
  } catch (error: any) {
    console.error('Error submitting ASRS to IntakeQ:', error)
    return {
      success: false,
      error: error.message || 'Failed to submit assessment',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Get IntakeQ client by email address
 */
export async function getIntakeQClientByEmail(email: string): Promise<IntakeQClient | null> {
  try {
    const result = await makeIntakeQRequest<IntakeQClient[]>(
      `/clients?search=${encodeURIComponent(email)}&includeProfile=true`
    )

    if (result.success && result.data && result.data.length > 0) {
      return result.data[0] // Return first match
    }

    return null
  } catch (error) {
    console.error('Error fetching IntakeQ client:', error)
    return null
  }
}

/**
 * Get IntakeQ client by ID
 */
export async function getIntakeQClientById(clientId: string | number): Promise<IntakeQClient | null> {
  try {
    const result = await makeIntakeQRequest<IntakeQClient>(
      `/clients/${clientId}?includeProfile=true`
    )

    if (result.success && result.data) {
      return result.data
    }

    return null
  } catch (error) {
    console.error('Error fetching IntakeQ client:', error)
    return null
  }
}

/**
 * Check if IntakeQ integration is properly configured
 */
export function isIntakeQConfigured(): boolean {
  return !!(API_KEY && PRACTITIONER_ID)
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(): IntakeQRateLimit {
  return { ...rateLimiter }
}