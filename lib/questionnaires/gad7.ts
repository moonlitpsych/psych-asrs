import { QuestionnaireDefinition, QuestionResponse } from '@/types/questionnaire'

export const GAD7_QUESTIONS = [
    {
        id: 1,
        text: "Feeling nervous, anxious or on edge",
        part: 'A' as const
    },
    {
        id: 2,
        text: "Not being able to stop or control worrying",
        part: 'A' as const
    },
    {
        id: 3,
        text: "Worrying too much about different things",
        part: 'A' as const
    },
    {
        id: 4,
        text: "Trouble relaxing",
        part: 'A' as const
    },
    {
        id: 5,
        text: "Being so restless that it is hard to sit still",
        part: 'A' as const
    },
    {
        id: 6,
        text: "Becoming easily annoyed or irritable",
        part: 'A' as const
    },
    {
        id: 7,
        text: "Feeling afraid as if something awful might happen",
        part: 'A' as const
    }
]

// GAD-7 uses same 0-3 scale as PHQ-9
export const GAD7_RESPONSE_OPTIONS = [
    { value: 0, label: 'Not at all', key: '1' },
    { value: 1, label: 'Several days', key: '2' },
    { value: 2, label: 'More than half the days', key: '3' },
    { value: 3, label: 'Nearly every day', key: '4' }
]

export interface GAD7Result {
    totalScore: number
    severity: 'minimal' | 'mild' | 'moderate' | 'severe'
    interpretation: string
}

export function calculateGAD7Scores(responses: QuestionResponse[]): GAD7Result {
    // Calculate total score
    const totalScore = responses.reduce((sum, response) => sum + response.response_value, 0)

    // Determine severity based on GAD-7 scoring guidelines
    let severity: 'minimal' | 'mild' | 'moderate' | 'severe'
    if (totalScore < 5) {
        severity = 'minimal'
    } else if (totalScore < 10) {
        severity = 'mild'
    } else if (totalScore < 15) {
        severity = 'moderate'
    } else {
        severity = 'severe'
    }

    // Generate interpretation
    let interpretation = `Total GAD-7 score of ${totalScore} indicates ${severity} anxiety symptoms. `

    switch (severity) {
        case 'minimal':
            interpretation += 'No anxiety disorder likely.'
            break
        case 'mild':
            interpretation += 'Probable anxiety disorder. Consider watchful waiting and repeat GAD-7 at follow-up.'
            break
        case 'moderate':
            interpretation += 'Probable anxiety disorder. Consider active treatment with psychotherapy and/or pharmacotherapy.'
            break
        case 'severe':
            interpretation += 'Probable anxiety disorder warranting active treatment with psychotherapy and/or pharmacotherapy.'
            break
    }

    // Add functional assessment note
    if (totalScore >= 10) {
        interpretation += ' Score of 10 or greater suggests possible generalized anxiety disorder; further evaluation recommended.'
    }

    interpretation += ' Note: This is a screening tool, not a diagnostic instrument.'

    return {
        totalScore,
        severity,
        interpretation
    }
}

export const GAD7_DEFINITION: QuestionnaireDefinition = {
    code: 'GAD7',
    name: 'Generalized Anxiety Disorder-7',
    description: 'Screens for anxiety severity over the past 2 weeks',
    instructions: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    questions: GAD7_QUESTIONS,
    responseOptions: GAD7_RESPONSE_OPTIONS,
    totalQuestions: 7,
    scoringFunction: calculateGAD7Scores,
    timeframe: 'past 2 weeks'
}