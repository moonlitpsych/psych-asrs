import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { calculateASRSScores } from '@/lib/scoring'
import { QuestionResponse } from '@/types/questionnaire'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: session_id } = await params
    const body = await request.json()
    const { responses, scores: providedScores } = body

    const supabase = getServiceSupabase()

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('questionnaire_sessions')
      .select('*')
      .eq('unique_id', session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'Session already completed' },
        { status: 400 }
      )
    }

    // Calculate scores if not provided
    let scores = providedScores
    if (!scores && responses) {
      scores = calculateASRSScores(responses)
    }

    // If we still don't have scores, get responses from database
    if (!scores) {
      const { data: dbResponses } = await supabase
        .from('questionnaire_responses')
        .select('*')
        .eq('session_id', session.id)
        .order('question_number')

      if (!dbResponses || dbResponses.length === 0) {
        return NextResponse.json(
          { error: 'No responses found for session' },
          { status: 400 }
        )
      }

      const formattedResponses: QuestionResponse[] = dbResponses.map(r => ({
        question_number: r.question_number,
        question_text: r.question_text,
        response_value: r.response_value,
        response_text: r.response_text
      }))

      scores = calculateASRSScores(formattedResponses)
    }

    // Begin transaction-like operations
    // Update session status
    const { error: updateError } = await supabase
      .from('questionnaire_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', session.id)

    if (updateError) {
      throw updateError
    }

    // Save results
    const { data: result, error: resultError } = await supabase
      .from('questionnaire_results')
      .insert({
        session_id: session.id,
        part_a_score: scores.partAScore,
        part_a_positive: scores.partAPositive,
        total_score: scores.totalScore,
        severity: scores.severity,
        clinician_notified: false
      })
      .select()
      .single()

    if (resultError) {
      // Try to rollback session update
      await supabase
        .from('questionnaire_sessions')
        .update({ status: 'in_progress', completed_at: null })
        .eq('id', session.id)

      throw resultError
    }

    // Trigger email notification (we'll implement this next)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          unique_id: session.unique_id,
          patient_name: session.patient_name,
          patient_email: session.patient_email,
          clinician_email: session.clinician_email,
          scores
        })
      })
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError)
      // Don't fail the completion if email fails
    }

    return NextResponse.json({
      success: true,
      session_id: session.id,
      result: result,
      scores
    })
  } catch (error) {
    console.error('Error completing assessment:', error)
    return NextResponse.json(
      { error: 'Failed to complete assessment' },
      { status: 500 }
    )
  }
}