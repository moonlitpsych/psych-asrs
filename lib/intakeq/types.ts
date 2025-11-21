// IntakeQ API Type Definitions

export interface IntakeQClient {
  Id: string
  ClientName: string
  ClientEmail: string
  ClientPhone?: string
  DateOfBirth?: string
  ClientId: number
  ExternalClientId?: string
  DateCreated: number // Unix timestamp
  LastActivity?: number
  CustomFields?: CustomField[]
}

export interface CustomField {
  FieldId: string
  FieldName: string
  Value: string
}

export interface IntakeQNote {
  Id?: string
  ClientId: number | string
  ClientName?: string
  ClientEmail?: string
  NoteName: string
  Date: string // ISO string
  PractitionerId?: string
  PractitionerName?: string
  Status: 'draft' | 'locked'
  Content: any // Can be structured JSON
  ExternalId?: string // Link back to our system
}

export interface IntakeQWebhook {
  Type: 'Client Created' | 'Appointment Booked' | 'Intake Submitted' | 'Note Locked'
  ClientId?: number
  IntakeId?: string
  NoteId?: string
  AppointmentId?: string
  ExternalPracticeId?: string
  ExternalClientId?: string
}

export interface IntakeQApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface IntakeQRateLimit {
  requests: number
  resetTime: number
  dailyRequests: number
  dailyResetTime: number
}

export interface IntakeQConfig {
  apiUrl: string
  apiKey: string
  practitionerId?: string
  locationId?: string
  webhookSecret?: string
}

// ASRS-specific IntakeQ formats
export interface ASRSNoteContent {
  assessmentType: 'ASRS 1.1'
  assessmentDate: string
  scores: {
    partA: string // "5/6"
    partAPositive: boolean
    total: string // "42/72"
    severity: 'None/Minimal' | 'Mild' | 'Moderate' | 'Severe'
  }
  clinicalSignificance: string
  responses: Array<{
    q: number
    text: string
    response: string
    value: number
  }>
  interpretationNote: string
  sessionId: string // Our system's session ID
  timestamp: string
}

export interface IntakeQSubmissionResult {
  success: boolean
  noteId?: string
  clientId?: number
  error?: string
  timestamp: string
}