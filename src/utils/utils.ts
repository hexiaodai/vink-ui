import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { ColumnsState } from "@ant-design/pro-components"
import { namespaceName } from "./k8s"
import { ListOptions } from "@/apis/types/list_options"

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

export const calcScroll = (obj: Record<string, ColumnsState>) => {
    let count = 0
    Object.keys(obj).forEach((key) => {
        if (obj[key].show) {
            count++
        }
    })
    return count * 150
}

export const dataSource = (data: Map<string, CustomResourceDefinition>): CustomResourceDefinition[] | undefined => {
    let items = Array.from(data.values())
    if (items.length > 0) {
        return items
    }
    return undefined
}

export const generateMessage = (crds: CustomResourceDefinition[], successMessage: string, multipleMessage: string) => {
    const names: string[] = []
    crds.forEach(crd => {
        names.push(namespaceName(crd.metadata))
    })

    const displayedNames = names.slice(0, 3).join("、")
    const remainingCount = names.length - 3

    if (remainingCount > 0) {
        return multipleMessage
            .replace("{names}", displayedNames)
            .replace("{count}", names.length.toString())
    } else {
        return successMessage.replace("{names}", displayedNames)
    }
}

export const emptyOptions = (): ListOptions => {
    return {
        fieldSelector: "",
        labelSelector: "",
        limit: 0,
        continue: "",
        namespaceNames: [],
        watch: false,
    }
}