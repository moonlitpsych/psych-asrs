export interface QuestionnaireSession {
  id: string
  unique_id: string
  patient_name: string
  patient_email: string
  patient_dob?: string
  phone_number?: string
  created_at: string
  started_at?: string
  completed_at?: string
  expires_at: string
  status: 'pending' | 'in_progress' | 'completed' | 'expired'
  clinician_email: string
  metadata?: Record<string, any>
}

export interface QuestionResponse {
  question_number: number
  question_text: string
  response_value: number // 0-4 scale
  response_text: string // "Never", "Rarely", etc.
}

export interface QuestionnaireResult {
  session_id: string
  part_a_score: number
  part_a_positive: boolean
  total_score: number
  severity: 'minimal' | 'mild' | 'moderate' | 'severe'
  clinician_notified: boolean
  notification_sent_at?: string
}

export interface ASRSQuestion {
  id: number
  text: string
  part: 'A' | 'B'
}

export const RESPONSE_OPTIONS = [
  { value: 0, label: 'Never', key: '1' },
  { value: 1, label: 'Rarely', key: '2' },
  { value: 2, label: 'Sometimes', key: '3' },
  { value: 3, label: 'Often', key: '4' },
  { value: 4, label: 'Very Often', key: '5' }
] as const

export type ResponseValue = 0 | 1 | 2 | 3 | 4