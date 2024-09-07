/**
 * Combines multiple class names into a single string.
 * @param  {...string} classes - The class names to combine.
 * @returns {string} - The combined class names.
 */
export function classNames(...classes: (string | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ')
}

export function jsonParse(str?: string) {
    if (!str) return {}
    return JSON.parse(str || "{}")
}

/**
 * Converts a bigint timestamp to a string representation in "YYYY-MM-DD HH:mm:ss" format.
 * @param timestamp - The bigint timestamp (assumed to be in milliseconds).
 * @returns The string representation of the date and time in "YYYY-MM-DD HH:mm:ss" format.
 */
export function formatTimestamp(timestamp?: bigint): string {
    // Convert bigint to number
    const date = new Date(Number(timestamp) * 1e3)

    // Extract date components
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0') // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    // Format to "YYYY-MM-DD HH:mm:ss"
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export const removeTrailingDot = (message: string) => {
    if (message.endsWith('.')) {
        return message.slice(0, -1)
    }
    return message
}

export const allowedError = (err: Error) => {
    if (err.message === "BodyStreamBuffer was aborted") {
        return true
    }
    if (err.message === "signal is aborted without reason") {
        return true
    }
    return false
}