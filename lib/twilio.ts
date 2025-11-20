import twilio from 'twilio'

// Initialize Twilio client
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured')
  }

  return twilio(accountSid, authToken)
}

export interface SendSMSResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send SMS message via Twilio
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<SendSMSResult> {
  try {
    const client = getTwilioClient()
    const from = process.env.TWILIO_PHONE_NUMBER

    if (!from) {
      throw new Error('Twilio phone number not configured')
    }

    // Ensure phone number is in E.164 format
    const formattedTo = formatPhoneNumber(to)

    const response = await client.messages.create({
      body: message,
      from,
      to: formattedTo
    })

    return {
      success: true,
      messageId: response.sid
    }
  } catch (error: any) {
    console.error('Twilio SMS error:', error)
    return {
      success: false,
      error: error.message || 'Failed to send SMS'
    }
  }
}

/**
 * Send questionnaire link via SMS
 */
export async function sendQuestionnaireLink(
  phoneNumber: string,
  patientName: string,
  questionnaireLink: string
): Promise<SendSMSResult> {
  const message = `Hi ${patientName}, please complete your ASRS assessment by clicking this link: ${questionnaireLink}

This link will expire in 48 hours.`

  return sendSMS(phoneNumber, message)
}

/**
 * Format phone number to E.164 format
 * Assumes US numbers if no country code provided
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')

  // If it's a 10-digit US number, add +1
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  }

  // If it already has country code
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`
  }

  // If it already starts with +, return as is
  if (phone.startsWith('+')) {
    return phone
  }

  // Otherwise, assume it needs +1 for US
  return `+1${cleaned}`
}