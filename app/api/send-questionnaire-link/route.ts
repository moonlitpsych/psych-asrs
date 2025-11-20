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
      clinician_email
    } = body

    // Validate required fields
    if (!patient_name || !patient_email || !clinician_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Create session in database
    const { data: session, error: sessionError } = await supabase
      .from('questionnaire_sessions')
      .insert({
        unique_id,
        patient_name,
        patient_email,
        patient_dob,
        phone_number,
        clinician_email,
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

    // Send email with questionnaire link
    const emailResult = await sendQuestionnaireInvitation(
      patient_email,
      patient_name,
      questionnaire_link,
      expires_at.toISOString()
    )

    // Log email attempt
    await supabase.from('email_logs').insert({
      session_id,
      recipient_email: patient_email,
      email_type: 'questionnaire_invitation',
      subject: 'Your ADHD Assessment Questionnaire',
      status: emailResult.success ? 'sent' : 'failed',
      error_message: emailResult.error
    })

    if (!emailResult.success) {
      // Session was created but email failed
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

    return NextResponse.json({
      success: true,
      session_id,
      unique_id,
      questionnaire_link,
      email_sent: true,
      message_id: emailResult.messageId
    })
  } catch (error) {
    console.error('Error sending questionnaire email:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}