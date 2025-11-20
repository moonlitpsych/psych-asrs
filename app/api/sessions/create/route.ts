import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { generateUniqueId, calculateExpiryDate } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    // Debug: Check if service key is loaded
    console.log('Service key exists:', !!process.env.SUPABASE_SERVICE_KEY)
    console.log('Service key starts with:', process.env.SUPABASE_SERVICE_KEY?.substring(0, 10))

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

    const supabase = getServiceSupabase()

    // Generate unique ID and expiry date
    const unique_id = generateUniqueId()
    const expires_at = calculateExpiryDate(
      parseInt(process.env.SESSION_EXPIRY_HOURS || '48')
    )

    // Create session in database
    const { data: session, error } = await supabase
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

    if (error) {
      console.error('Error creating session:', error)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Generate the questionnaire link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const questionnaireLink = `${baseUrl}/questionnaire/${unique_id}`

    return NextResponse.json({
      success: true,
      session_id: session.id,
      unique_id: session.unique_id,
      questionnaire_link: questionnaireLink,
      expires_at: session.expires_at
    })
  } catch (error) {
    console.error('Error in create session endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}