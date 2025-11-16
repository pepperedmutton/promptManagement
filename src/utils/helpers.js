/**
 * Format date to readable string
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted date
 */
export function formatDate(isoString) {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * Get time ago string (e.g., "2 hours ago")
 * @param {string} isoString - ISO date string
 * @returns {string} Relative time string
 */
export function getTimeAgo(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const seconds = Math.floor((now - date) / 1000)

  const intervals = {
    年: 31536000,
    月: 2592000,
    周: 604800,
    天: 86400,
    小时: 3600,
    分钟: 60
  }

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit)
    if (interval >= 1) {
      return `${interval} ${unit}前`
    }
  }

  return '刚刚'
}

/**
 * Truncate text to max length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Generate a random ID
 * @returns {string} Random ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
