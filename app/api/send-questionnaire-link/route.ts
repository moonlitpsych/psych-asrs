import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { sendQuestionnaireInvitation } from '@/lib/email'
import { generateUniqueId, calculateExpiryDate } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      patient_name,
      patient_email,
      patient_dob,
      phone_number,
      clinician_email,
      send_method = 'email',
      questionnaire_type = 'ASRS' // New field with default for backward compatibility
    } = body

    // Validate required fields based on send method
    if (!patient_name || !clinician_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check email is provided if sending via email
    if ((send_method === 'email' || send_method === 'both') && !patient_email) {
      return NextResponse.json(
        { error: 'Email is required for email delivery' },
        { status: 400 }
      )
    }

    // Check phone is provided if sending via SMS
    if ((send_method === 'sms' || send_method === 'both') && !phone_number) {
      return NextResponse.json(
        { error: 'Phone number is required for SMS delivery' },
        { status: 400 }
      )
    }

    // Debug: Check key lengths and format
    console.log('=== SUPABASE KEY DEBUG ===')
    console.log('Service key length:', process.env.SUPABASE_SERVICE_KEY?.length)
    console.log('Service key format check:', {
      startsWithSbSecret: process.env.SUPABASE_SERVICE_KEY?.startsWith('sb_secret_'),
      hasUnderscore: process.env.SUPABASE_SERVICE_KEY?.includes('_'),
      keyPreview: process.env.SUPABASE_SERVICE_KEY?.substring(0, 30) + '...'
    })
    console.log('Anon key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length)
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

    // Create the session directly using Supabase
    const supabase = getServiceSupabase()

    // Generate unique ID and expiry date
    const unique_id = generateUniqueId()
    const expires_at = calculateExpiryDate(
      parseInt(process.env.SESSION_EXPIRY_HOURS || '48')
    )

    // Create session in database with questionnaire type
    const { data: session, error: sessionError } = await supabase
      .from('questionnaire_sessions')
      .insert({
        unique_id,
        patient_name,
        patient_email,
        patient_dob,
        phone_number,
        clinician_email,
        questionnaire_type, // Add the questionnaire type
        expires_at: expires_at.toISOString(),
        status: 'pending'
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Generate the questionnaire link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const questionnaire_link = `${baseUrl}/questionnaire/${unique_id}`
    const session_id = session.id

    // Handle email sending if requested
    let emailResult: { success: boolean; messageId?: string; error?: string } = { success: true }
    if (send_method === 'email' || send_method === 'both') {
      emailResult = await sendQuestionnaireInvitation(
        patient_email,
        patient_name,
        questionnaire_link,
        expires_at.toISOString(),
        questionnaire_type // Pass the questionnaire type to email function
      )

      // Log email attempt
      await supabase.from('email_logs').insert({
        session_id,
        recipient_email: patient_email,
        email_type: 'questionnaire_invitation',
        subject: `Your ${questionnaire_type} Assessment Questionnaire`,
        status: emailResult.success ? 'sent' : 'failed',
        error_message: emailResult.error || null
      })

      if (!emailResult.success && send_method === 'email') {
        // Session was created but email failed (only error if email was the only method)
        return NextResponse.json(
          {
            warning: 'Session created but email failed to send',
            error: emailResult.error,
            session_id,
            questionnaire_link,
            manual_send_required: true
          },
          { status: 207 } // Multi-Status
        )
      }
    }

    return NextResponse.json({
      success: true,
      session_id,
      unique_id,
      questionnaire_link,
      questionnaire_type,
      email_sent: send_method !== 'sms' ? emailResult.success : false,
      sms_ready: send_method === 'sms' || send_method === 'both',
      message_id: emailResult.messageId,
      send_method
    })
  } catch (error) {
    console.error('Error sending questionnaire email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}