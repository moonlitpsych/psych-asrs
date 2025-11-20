import { NextRequest, NextResponse } from 'next/server'
import { getServiceSupabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase()

    // Get all sessions
    const { data: sessions, error } = await supabase
      .from('questionnaire_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch sessions',
        details: error
      }, { status: 500 })
    }

    // Format the sessions for easier reading
    const formattedSessions = sessions?.map(s => ({
      unique_id: s.unique_id,
      patient_name: s.patient_name,
      status: s.status,
      created_at: s.created_at,
      questionnaire_link: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/questionnaire/${s.unique_id}`
    }))

    return NextResponse.json({
      count: sessions?.length || 0,
      sessions: formattedSessions || [],
      message: sessions?.length ? 'Sessions found' : 'No sessions in database'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Internal error',
      details: String(error)
    }, { status: 500 })
  }
}