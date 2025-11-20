import { nanoid } from 'nanoid'

/**
 * Generate a unique ID for questionnaire sessions
 * Using nanoid for URL-safe, short IDs
 */
export function generateUniqueId(length: number = 10): string {
  return nanoid(length)
}

/**
 * Calculate expiration date based on hours from now
 */
export function calculateExpiryDate(hours: number = 48): Date {
  const date = new Date()
  date.setHours(date.getHours() + hours)
  return date
}

/**
 * Format a date for display
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Check if a session has expired
 */
export function isSessionExpired(expiresAt: string | Date): boolean {
  return new Date(expiresAt) < new Date()
}