import { Resend } from 'resend'
import { ScoringResult } from './scoring'

// Helper functions for questionnaire details
function getQuestionnaireTitle(type: string): string {
  switch (type) {
    case 'PHQ9':
      return 'Patient Health Questionnaire (PHQ-9)'
    case 'GAD7':
      return 'Generalized Anxiety Disorder Scale (GAD-7)'
    case 'ASRS':
    default:
      return 'Adult ADHD Self-Report Scale (ASRS)'
  }
}

function getQuestionnaireDescription(type: string): string {
  switch (type) {
    case 'PHQ9':
      return 'This questionnaire helps evaluate symptoms of depression.'
    case 'GAD7':
      return 'This questionnaire helps evaluate symptoms of anxiety.'
    case 'ASRS':
    default:
      return 'This questionnaire helps evaluate symptoms related to ADHD in adults.'
  }
}

function getQuestionCount(type: string): string {
  switch (type) {
    case 'PHQ9':
      return '9 questions'
    case 'GAD7':
      return '7 questions'
    case 'ASRS':
    default:
      return '18 questions'
  }
}

// Initialize Resend client
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('Resend API key not configured')
  }

  return new Resend(apiKey)
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send questionnaire link to patient via email
 */
export async function sendQuestionnaireInvitation(
  patientEmail: string,
  patientName: string,
  questionnaireLink: string,
  expiresAt: string,
  questionnaireType: string = 'ASRS'
): Promise<SendEmailResult> {
  try {
    const resend = getResendClient()
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@yourdomain.com'

    const expiryDate = new Date(expiresAt).toLocaleString()

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
            .content { padding: 30px; }
            .button-container { text-align: center; margin: 30px 0; }
            .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 30px; font-size: 16px; font-weight: 600; }
            .button:hover { opacity: 0.9; }
            .info-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; background: #f8f9fa; }
            .link-text { color: #667eea; word-break: break-all; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${getQuestionnaireTitle(questionnaireType)}</h1>
            </div>

            <div class="content">
              <p>Dear ${patientName},</p>

              <p>Your healthcare provider has requested that you complete the ${getQuestionnaireTitle(questionnaireType)} assessment. ${getQuestionnaireDescription(questionnaireType)}</p>

              <div class="info-box">
                <strong>What to expect:</strong>
                <ul style="margin: 10px 0;">
                  <li>${getQuestionCount(questionnaireType)} about your recent experiences</li>
                  <li>Takes approximately 5-10 minutes to complete</li>
                  <li>Your responses are automatically saved as you progress</li>
                  <li>Results will be shared with your healthcare provider</li>
                </ul>
              </div>

              <div class="button-container">
                <a href="${questionnaireLink}" class="button">Start Assessment</a>
              </div>

              <p style="text-align: center; color: #666; font-size: 14px;">
                Or copy and paste this link into your browser:<br>
                <span class="link-text">${questionnaireLink}</span>
              </p>

              <div class="info-box" style="background: #fff5f5; border-color: #e53e3e;">
                <strong>Important:</strong> This link will expire on <strong>${expiryDate}</strong>. Please complete the assessment before then.
              </div>

              <p style="margin-top: 30px;">
                <strong>Privacy Notice:</strong> Your responses are confidential and will only be shared with your healthcare provider. All data is encrypted and stored securely in compliance with HIPAA regulations.
              </p>
            </div>

            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>If you have questions about this assessment, please contact your healthcare provider.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const result = await resend.emails.send({
      from: fromEmail,
      to: patientEmail,
      subject: `Your ${questionnaireType === 'ASRS' ? 'ADHD' : questionnaireType === 'PHQ9' ? 'Depression' : 'Anxiety'} Assessment Questionnaire`,
      html: emailHtml
    })

    return {
      success: true,
      messageId: result.data?.id
    }
  } catch (error: any) {
    console.error('Email send error:', error)
    return {
      success: false,
      error: error.message || 'Failed to send email'
    }
  }
}

/**
 * Send assessment completion notification to clinician
 */
export async function sendCompletionNotification(
  clinicianEmail: string,
  patientName: string,
  patientEmail: string,
  scores: ScoringResult,
  sessionId: string
): Promise<SendEmailResult> {
  try {
    const resend = getResendClient()
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@yourdomain.com'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const dashboardLink = `${appUrl}/dashboard`

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
            .content { background: #f7f9fc; padding: 20px; border-radius: 0 0 10px 10px; }
            .score-card { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .score-value { font-size: 24px; font-weight: bold; color: #667eea; }
            .alert { background: #fff5f5; border-left: 4px solid #e53e3e; padding: 15px; margin: 15px 0; border-radius: 4px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">ASRS Assessment Completed</h2>
            </div>
            <div class="content">
              <p>A patient has completed their ASRS assessment.</p>

              <div class="score-card">
                <strong>Patient Information:</strong><br>
                Name: ${patientName}<br>
                Email: ${patientEmail}<br>
                Completed: ${new Date().toLocaleString()}
              </div>

              <div class="score-card">
                <strong>Assessment Results:</strong><br>
                <div style="margin-top: 10px;">
                  Part A Score: <span class="score-value">${scores.partAScore}/6</span>
                  ${scores.partAPositive ? '<span style="color: #e53e3e; margin-left: 10px;">⚠️ Positive</span>' : '<span style="color: #38a169; margin-left: 10px;">✓ Negative</span>'}<br>
                  Total Score: <span class="score-value">${scores.totalScore}/72</span><br>
                  Severity: <strong style="text-transform: capitalize;">${scores.severity}</strong>
                </div>
              </div>

              ${scores.partAPositive ? `
                <div class="alert">
                  <strong>⚠️ Clinical Alert:</strong><br>
                  Part A screening is positive for ADHD. This patient scores ${scores.partAScore}/6 on the screening questions,
                  which is above the threshold of 4. Further evaluation is recommended.
                </div>
              ` : ''}

              <p><strong>Clinical Interpretation:</strong></p>
              <p style="background: white; padding: 15px; border-radius: 8px;">
                ${scores.partAPositive ?
                  'Part A Score indicates symptoms highly consistent with ADHD in adults.' :
                  'Part A Score is below the threshold for ADHD screening.'
                }
                Total score of ${scores.totalScore} suggests ${scores.severity} ADHD symptoms.
                <em>Note: This screening tool is not a diagnostic instrument. A comprehensive evaluation is required for diagnosis.</em>
              </p>

              <div style="text-align: center;">
                <a href="${dashboardLink}" class="button">View in Dashboard</a>
              </div>

              <div class="footer">
                <p>Session ID: ${sessionId}</p>
                <p>This is an automated notification from the ASRS Assessment Tool. Please do not reply to this email.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const result = await resend.emails.send({
      from: fromEmail,
      to: clinicianEmail,
      subject: `ASRS Assessment Completed - ${patientName}`,
      html: emailHtml
    })

    return {
      success: true,
      messageId: result.data?.id
    }
  } catch (error: any) {
    console.error('Email send error:', error)
    return {
      success: false,
      error: error.message || 'Failed to send email'
    }
  }
}

/**
 * Send patient confirmation email
 */
export async function sendPatientConfirmation(
  patientEmail: string,
  patientName: string,
  scores: ScoringResult
): Promise<SendEmailResult> {
  try {
    const resend = getResendClient()
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@yourdomain.com'

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
            .content { background: #f7f9fc; padding: 20px; border-radius: 0 0 10px 10px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">Thank You for Completing the ASRS Assessment</h2>
            </div>
            <div class="content">
              <p>Dear ${patientName},</p>

              <p>Thank you for completing the Adult ADHD Self-Report Scale (ASRS) assessment. Your responses have been recorded and sent to your healthcare provider for review.</p>

              <p><strong>Your Assessment Summary:</strong></p>
              <ul>
                <li>Part A Score: ${scores.partAScore}/6</li>
                <li>Total Score: ${scores.totalScore}/72</li>
                <li>Symptom Level: ${scores.severity}</li>
              </ul>

              <p><strong>What Happens Next:</strong></p>
              <p>Your healthcare provider will review these results and discuss them with you during your next appointment. They may use this information as part of a comprehensive evaluation.</p>

              <p><strong>Important Note:</strong></p>
              <p style="font-style: italic;">The ASRS is a screening tool and not a diagnostic instrument. Only a qualified healthcare professional can make an ADHD diagnosis based on a complete clinical evaluation.</p>

              <p>If you have any questions about your assessment or need to schedule a follow-up appointment, please contact your healthcare provider's office.</p>

              <p>Best regards,<br>Your Healthcare Team</p>

              <div class="footer">
                <p>This is an automated email. Please do not reply directly to this message.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const result = await resend.emails.send({
      from: fromEmail,
      to: patientEmail,
      subject: 'ASRS Assessment Completed - Thank You',
      html: emailHtml
    })

    return {
      success: true,
      messageId: result.data?.id
    }
  } catch (error: any) {
    console.error('Patient email send error:', error)
    return {
      success: false,
      error: error.message || 'Failed to send patient email'
    }
  }
}