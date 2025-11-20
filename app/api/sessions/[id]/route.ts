import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'
import { isSessionExpired } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: unique_id } = await params
    const supabase = getServiceSupabase()

    // Get session from database
    const { data: session, error } = await supabase
      .from('questionnaire_sessions')
      .select('*')
      .eq('unique_id', unique_id)
      .single()

    if (error || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if session has expired
    if (isSessionExpired(session.expires_at)) {
      // Update status to expired
      await supabase
        .from('questionnaire_sessions')
        .update({ status: 'expired' })
        .eq('id', session.id)

      return NextResponse.json(
        { error: 'Session has expired' },
        { status: 410 } // 410 Gone
      )
    }

    // Check if session is already completed
    if (session.status === 'completed') {
      return NextResponse.json(
        { error: 'Session already completed' },
        { status: 400 }
      )
    }

    // Update status to in_progress if it's pending
    if (session.status === 'pending') {
      await supabase
        .from('questionnaire_sessions')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', session.id)
    }

    // Get existing responses if any
    const { data: responses } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('session_id', session.id)
      .order('question_number')

    return NextResponse.json({
      session,
      responses: responses || [],
      questions_answered: responses?.length || 0
    })
  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}