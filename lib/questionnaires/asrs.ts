import { QuestionnaireDefinition, QuestionResponse } from '@/types/questionnaire'
import { ASRS_QUESTIONS } from '../questionnaire-data'
import { RESPONSE_OPTIONS } from '@/types/questionnaire'

export interface ASRSResult {
    partAScore: number
    partAPositive: boolean
    totalScore: number
    severity: 'minimal' | 'mild' | 'moderate' | 'severe'
    interpretation: string
}

export function calculateASRSScores(responses: QuestionResponse[]): ASRSResult {
    let partAScore = 0
    let totalScore = 0

    responses.forEach((response) => {
        const value = response.response_value
        totalScore += value

        // Part A scoring (Questions 1-6)
        if (response.question_number <= 6) {
            if (response.question_number <= 4 && value >= 3) {
                partAScore++
            } else if (response.question_number >= 5 && response.question_number <= 6 && value >= 4) {
                partAScore++
            }
        }
    })

    // Determine if Part A is positive for ADHD screening
    const partAPositive = partAScore >= 4

    // Determine severity based on total score
    let severity: 'minimal' | 'mild' | 'moderate' | 'severe'
    if (totalScore < 17) {
        severity = 'minimal'
    } else if (totalScore >= 17 && totalScore <= 23) {
        severity = 'mild'
    } else if (totalScore >= 24 && totalScore <= 35) {
        severity = 'moderate'
    } else {
        severity = 'severe'
    }

    // Generate interpretation
    let interpretation = ''
    if (partAPositive) {
        interpretation += 'Part A Score indicates symptoms highly consistent with ADHD in adults. '
    } else {
        interpretation += 'Part A Score is below the threshold for ADHD screening. '
    }

    interpretation += `Total score of ${totalScore} suggests ${severity} ADHD symptoms. `
    interpretation += 'Note: This screening tool is not a diagnostic instrument. A comprehensive evaluation by a qualified healthcare provider is required for diagnosis.'

    return {
        partAScore,
        partAPositive,
        totalScore,
        severity,
        interpretation
    }
}

export const ASRS_DEFINITION: QuestionnaireDefinition = {
    code: 'ASRS',
    name: 'Adult ADHD Self-Report Scale',
    description: 'ASRS Version 1.1 - Screens for adult ADHD symptoms',
    instructions: 'Please answer the questions below, rating yourself on each of the criteria shown using the scale on the right side of the page. As you answer each question, select the box that best describes how you have felt and conducted yourself over the past 6 months.',
    questions: ASRS_QUESTIONS,
    responseOptions: RESPONSE_OPTIONS,
    totalQuestions: 18,
    scoringFunction: calculateASRSScores,
    timeframe: 'past 6 months'
}