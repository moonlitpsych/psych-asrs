import { QuestionnaireDefinition, QuestionResponse } from '@/types/questionnaire'

export const PHQ9_QUESTIONS = [
    {
        id: 1,
        text: "Little interest or pleasure in doing things",
        part: 'A' as const
    },
    {
        id: 2,
        text: "Feeling down, depressed, or hopeless",
        part: 'A' as const
    },
    {
        id: 3,
        text: "Trouble falling or staying asleep, or sleeping too much",
        part: 'A' as const
    },
    {
        id: 4,
        text: "Feeling tired or having little energy",
        part: 'A' as const
    },
    {
        id: 5,
        text: "Poor appetite or overeating",
        part: 'A' as const
    },
    {
        id: 6,
        text: "Feeling bad about yourself - or that you are a failure or have let yourself or your family down",
        part: 'A' as const
    },
    {
        id: 7,
        text: "Trouble concentrating on things, such as reading the newspaper or watching television",
        part: 'A' as const
    },
    {
        id: 8,
        text: "Moving or speaking so slowly that other people could have noticed? Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual",
        part: 'A' as const
    },
    {
        id: 9,
        text: "Thoughts that you would be better off dead or of hurting yourself in some way",
        part: 'A' as const
    }
]

// PHQ-9 uses 0-3 scale instead of 0-4
export const PHQ9_RESPONSE_OPTIONS = [
    { value: 0, label: 'Not at all', key: '1' },
    { value: 1, label: 'Several days', key: '2' },
    { value: 2, label: 'More than half the days', key: '3' },
    { value: 3, label: 'Nearly every day', key: '4' }
]

export interface PHQ9Result {
    totalScore: number
    severity: 'none' | 'mild' | 'moderate' | 'moderately severe' | 'severe'
    criticalItemFlagged: boolean // Question 9 is a critical item
    interpretation: string
}

export function calculatePHQ9Scores(responses: QuestionResponse[]): PHQ9Result {
    // Calculate total score
    const totalScore = responses.reduce((sum, response) => sum + response.response_value, 0)

    // Check if question 9 (suicidal ideation) is positive
    const question9Response = responses.find(r => r.question_number === 9)
    const criticalItemFlagged = question9Response ? question9Response.response_value > 0 : false

    // Determine severity based on PHQ-9 scoring guidelines
    let severity: 'none' | 'mild' | 'moderate' | 'moderately severe' | 'severe'
    if (totalScore < 5) {
        severity = 'none'
    } else if (totalScore < 10) {
        severity = 'mild'
    } else if (totalScore < 15) {
        severity = 'moderate'
    } else if (totalScore < 20) {
        severity = 'moderately severe'
    } else {
        severity = 'severe'
    }

    // Generate interpretation
    let interpretation = `Total PHQ-9 score of ${totalScore} indicates ${severity} depression symptoms. `

    if (criticalItemFlagged) {
        interpretation += '⚠️ CRITICAL: Patient endorsed suicidal ideation (Question 9). Immediate clinical evaluation recommended. '
    }

    switch (severity) {
        case 'none':
            interpretation += 'No treatment typically needed.'
            break
        case 'mild':
            interpretation += 'Watchful waiting; repeat PHQ-9 at follow-up.'
            break
        case 'moderate':
            interpretation += 'Treatment plan considering counseling, follow-up and/or pharmacotherapy.'
            break
        case 'moderately severe':
        case 'severe':
            interpretation += 'Active treatment with pharmacotherapy and/or psychotherapy recommended.'
            break
    }

    interpretation += ' Note: This is a screening tool, not a diagnostic instrument.'

    return {
        totalScore,
        severity,
        criticalItemFlagged,
        interpretation
    }
}

export const PHQ9_DEFINITION: QuestionnaireDefinition = {
    code: 'PHQ9',
    name: 'Patient Health Questionnaire-9',
    description: 'Screens for depression severity over the past 2 weeks',
    instructions: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    questions: PHQ9_QUESTIONS,
    responseOptions: PHQ9_RESPONSE_OPTIONS,
    totalQuestions: 9,
    scoringFunction: calculatePHQ9Scores,
    timeframe: 'past 2 weeks'
}