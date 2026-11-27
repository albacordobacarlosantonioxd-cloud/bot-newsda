const emojiPattern = /[\u{1F000}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2300}-\u{23FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{E0020}-\u{E007F}\u{200D}\u{20E3}]/gu

export function stripEmojis(value) {
    return typeof value === 'string' ? value.replace(emojiPattern, '') : value
}

export function sanitizeMessagePayload(value) {
    if (typeof value === 'string') return stripEmojis(value)
    if (!value || typeof value !== 'object' || Buffer.isBuffer(value) || value instanceof Uint8Array || value instanceof Blob) return value
    if (Array.isArray(value)) return value.map(sanitizeMessagePayload)
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeMessagePayload(item)]))
}