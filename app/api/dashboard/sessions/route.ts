import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()

    // Query sessions with joined results
    const { data, error } = await supabase
      .from('questionnaire_sessions')
      .select(`
        *,
        questionnaire_results (
          part_a_score,
          part_a_positive,
          total_score,
          severity,
          clinician_notified
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to load sessions', details: error },
        { status: 500 }
      )
    }

    // Transform the data to match the expected structure
    const transformedData = (data || []).map(session => {
      const result = Array.isArray(session.questionnaire_results)
        ? session.questionnaire_results[0]
        : session.questionnaire_results

      return {
        ...session,
        part_a_score: result?.part_a_score ?? null,
        part_a_positive: result?.part_a_positive ?? null,
        total_score: result?.total_score ?? null,
        severity: result?.severity ?? null,
        clinician_notified: result?.clinician_notified ?? null,
        responses_count: session.status === 'completed' ? 18 : 0
      }
    })

    return NextResponse.json({
      sessions: transformedData,
      success: true
    })
  } catch (error: any) {
    console.error('Error loading dashboard sessions:', error)
    return NextResponse.json(
      { error: 'Failed to load sessions', details: error.message },
      { status: 500 }
    )
  }
}