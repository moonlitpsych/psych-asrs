import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { submitASRSToIntakeQ, getIntakeQClientByEmail, isIntakeQConfigured } from '@/lib/intakeq/client'
import { calculateASRSScores } from '@/lib/scoring'
import { QuestionResponse } from '@/types/questionnaire'

export async function POST(request: NextRequest) {
  try {
    // Check if IntakeQ is configured
    if (!isIntakeQConfigured()) {
      return NextResponse.json(
        { error: 'IntakeQ integration not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { sessionId, intakeqClientId } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    // Get session data from database
    const supabase = getServiceSupabase()

    const { data: session, error: sessionError } = await supabase
      .from('questionnaire_sessions')
      .select('*')
      .eq('unique_id', sessionId)
      .single()

    if (sessionError || !session) {
      console.error('Session not found:', sessionError)
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get responses for this session
    const { data: responses, error: responsesError } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('session_id', session.id)
      .order('question_number', { ascending: true })

    if (responsesError || !responses || responses.length === 0) {
      console.error('Responses not found:', responsesError)
      return NextResponse.json(
        { error: 'No responses found for session' },
        { status: 404 }
      )
    }

    // Calculate scores
    const questionResponses: QuestionResponse[] = responses.map(r => ({
      question_number: r.question_number,
      question_text: r.question_text,
      response_value: r.response_value,
      response_text: r.response_text
    }))

    const scores = calculateASRSScores(questionResponses)

    // Determine IntakeQ client ID
    let clientId = intakeqClientId

    // If no client ID provided, try to find by email
    if (!clientId && session.patient_email) {
      console.log(`Looking up IntakeQ client by email: ${session.patient_email}`)
      const intakeqClient = await getIntakeQClientByEmail(session.patient_email)

      if (intakeqClient) {
        clientId = intakeqClient.ClientId
        console.log(`Found IntakeQ client: ${clientId}`)

        // Store IntakeQ client ID in session metadata for future use
        await supabase
          .from('questionnaire_sessions')
          .update({
            metadata: {
              ...(session.metadata || {}),
              intakeq_client_id: clientId
            }
          })
          .eq('id', session.id)
      } else {
        console.log('No IntakeQ client found for email:', session.patient_email)
        return NextResponse.json(
          {
            error: 'Patient not found in IntakeQ',
            message: 'Please ensure patient exists in IntakeQ before submitting results'
          },
          { status: 404 }
        )
      }
    }

    if (!clientId) {
      return NextResponse.json(
        { error: 'IntakeQ client ID not found' },
        { status: 400 }
      )
    }

    // Submit to IntakeQ
    console.log(`Submitting ASRS results to IntakeQ for client ${clientId}`)
    const submissionResult = await submitASRSToIntakeQ(
      clientId,
      session.patient_name,
      scores,
      questionResponses,
      sessionId
    )

    if (submissionResult.success) {
      // Update session with IntakeQ note ID
      await supabase
        .from('questionnaire_sessions')
        .update({
          metadata: {
            ...(session.metadata || {}),
            intakeq_note_id: submissionResult.noteId,
            intakeq_submitted_at: submissionResult.timestamp
          }
        })
        .eq('id', session.id)

      // Also update the results table
      await supabase
        .from('questionnaire_results')
        .update({
          metadata: {
            intakeq_note_id: submissionResult.noteId,
            intakeq_submitted_at: submissionResult.timestamp
          }
        })
        .eq('session_id', session.id)

      return NextResponse.json({
        success: true,
        message: 'ASRS results successfully submitted to IntakeQ',
        noteId: submissionResult.noteId,
        clientId: submissionResult.clientId,
        timestamp: submissionResult.timestamp
      })
    } else {
      console.error('Failed to submit to IntakeQ:', submissionResult.error)
      return NextResponse.json(
        {
          success: false,
          error: submissionResult.error || 'Failed to submit to IntakeQ'
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in IntakeQ submission endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

// GET endpoint to check submission status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()

    const { data: session, error } = await supabase
      .from('questionnaire_sessions')
      .select('metadata')
      .eq('unique_id', sessionId)
      .single()

    if (error || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const metadata = session.metadata as any || {}

    return NextResponse.json({
      submitted: !!metadata.intakeq_note_id,
      noteId: metadata.intakeq_note_id,
      submittedAt: metadata.intakeq_submitted_at,
      clientId: metadata.intakeq_client_id
    })
  } catch (error: any) {
    console.error('Error checking IntakeQ submission status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}