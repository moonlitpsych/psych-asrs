import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: session_id } = await params
    const body = await request.json()
    const {
      question_number,
      question_text,
      response_value,
      response_text
    } = body

    // Validate required fields
    if (
      !question_number ||
      !question_text ||
      response_value === undefined ||
      !response_text
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getServiceSupabase()

    // First verify the session exists and is active
    const { data: session, error: sessionError } = await supabase
      .from('questionnaire_sessions')
      .select('id, status')
      .eq('unique_id', session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (session.status === 'completed' || session.status === 'expired') {
      return NextResponse.json(
        { error: `Session is ${session.status}` },
        { status: 400 }
      )
    }

    // Upsert the response (update if exists, insert if not)
    const { data: response, error } = await supabase
      .from('questionnaire_responses')
      .upsert({
        session_id: session.id,
        question_number,
        question_text,
        response_value,
        response_text,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'session_id,question_number'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving response:', error)
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      response
    })
  } catch (error) {
    console.error('Error in save response endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: session_id } = await params
    const supabase = getServiceSupabase()

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('questionnaire_sessions')
      .select('id')
      .eq('unique_id', session_id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get all responses for this session
    const { data: responses, error } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('session_id', session.id)
      .order('question_number')

    if (error) {
      console.error('Error getting responses:', error)
      return NextResponse.json(
        { error: 'Failed to get responses' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      responses: responses || [],
      count: responses?.length || 0
    })
  } catch (error) {
    console.error('Error getting responses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}