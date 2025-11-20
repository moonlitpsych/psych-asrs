import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { sendCompletionNotification, sendPatientConfirmation } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      session_id,
      unique_id,
      patient_name,
      patient_email,
      clinician_email,
      scores
    } = body

    // Validate required fields
    if (!session_id || !patient_name || !patient_email || !clinician_email || !scores) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()
    const results = {
      clinician: { sent: false, error: null as string | null },
      patient: { sent: false, error: null as string | null }
    }

    // Send notification to clinician
    const clinicianResult = await sendCompletionNotification(
      clinician_email,
      patient_name,
      patient_email,
      scores,
      unique_id || session_id
    )

    results.clinician.sent = clinicianResult.success
    results.clinician.error = clinicianResult.error || null

    // Log clinician email attempt
    await supabase.from('email_logs').insert({
      session_id,
      recipient_email: clinician_email,
      email_type: 'clinician_notification',
      subject: `ASRS Assessment Completed - ${patient_name}`,
      status: clinicianResult.success ? 'sent' : 'failed',
      error_message: clinicianResult.error
    })

    // Send confirmation to patient
    const patientResult = await sendPatientConfirmation(
      patient_email,
      patient_name,
      scores
    )

    results.patient.sent = patientResult.success
    results.patient.error = patientResult.error || null

    // Log patient email attempt
    await supabase.from('email_logs').insert({
      session_id,
      recipient_email: patient_email,
      email_type: 'patient_confirmation',
      subject: 'ASRS Assessment Completed - Thank You',
      status: patientResult.success ? 'sent' : 'failed',
      error_message: patientResult.error
    })

    // Update the results table to mark clinician as notified
    if (results.clinician.sent) {
      await supabase
        .from('questionnaire_results')
        .update({
          clinician_notified: true,
          notification_sent_at: new Date().toISOString()
        })
        .eq('session_id', session_id)
    }

    // Determine overall success
    const overallSuccess = results.clinician.sent || results.patient.sent

    if (!overallSuccess) {
      return NextResponse.json(
        {
          error: 'Failed to send any notifications',
          details: results
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notifications: results,
      partial: !results.clinician.sent || !results.patient.sent
    })
  } catch (error) {
    console.error('Error sending email notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}