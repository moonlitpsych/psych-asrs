import { QuestionnaireDefinition } from '@/types/questionnaire'
import { ASRS_DEFINITION } from './asrs'
import { PHQ9_DEFINITION } from './phq9'
import { GAD7_DEFINITION } from './gad7'

// Registry of all available questionnaires
export const QUESTIONNAIRE_REGISTRY: Record<string, QuestionnaireDefinition> = {
    ASRS: ASRS_DEFINITION,
    PHQ9: PHQ9_DEFINITION,
    GAD7: GAD7_DEFINITION
}

// Helper function to get questionnaire by code
export function getQuestionnaireDefinition(code: string): QuestionnaireDefinition | null {
    return QUESTIONNAIRE_REGISTRY[code] || null
}

// Get list of all available questionnaires for dropdown
export function getAvailableQuestionnaires() {
    return Object.values(QUESTIONNAIRE_REGISTRY).map(q => ({
        code: q.code,
        name: q.name,
        description: q.description,
        totalQuestions: q.totalQuestions
    }))
}

// Universal scoring function that delegates to the right questionnaire
export function scoreQuestionnaire(code: string, responses: any[]): any {
    const definition = getQuestionnaireDefinition(code)
    if (!definition || !definition.scoringFunction) {
        throw new Error(`No scoring function found for questionnaire: ${code}`)
    }
    return definition.scoringFunction(responses)
}