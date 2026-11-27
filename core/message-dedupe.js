const recentMessages = new Map()
const dedupeWindowMs = 60_000
const maxTrackedMessages = 5000

export function isDuplicateMessage(message, now = Date.now()) {
    const id = message?.key?.id
    if (!id) return false

    const chat = message.key.remoteJid || message.chat || ''
    const sender = message.key.participant || message.sender || ''
    const key = `${chat}:${sender}:${id}`
    const previous = recentMessages.get(key)

    if (previous !== undefined && now - previous < dedupeWindowMs) return true

    recentMessages.set(key, now)
    if (recentMessages.size > maxTrackedMessages) {
        for (const [messageKey, timestamp] of recentMessages) {
            if (now - timestamp >= dedupeWindowMs) recentMessages.delete(messageKey)
        }
        while (recentMessages.size > maxTrackedMessages) {
            recentMessages.delete(recentMessages.keys().next().value)
        }
    }

    return false
}