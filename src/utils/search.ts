import { FieldSelector } from "@/clients/ts/types/types"

export const mergeFieldSelectors = (newFields: FieldSelector[], oldFields: FieldSelector[]) => {
    const fieldMap = new Map(oldFields.map(field => [field.fieldPath, field]))

    for (const field of newFields) {
        fieldMap.set(field.fieldPath, field)
    }

    newFields = Array.from(fieldMap.values()).filter(
        field => field.fieldPath && field.values && field.values.length > 0 && (field.values[0] !== undefined || field.values[0] !== null)
        // field => field.fieldPath && field.values && field.values.length > 0 && field.values[0] && field.values[0].length > 0
    )

    return newFields
}

export const getNamespaceFieldSelector = (namespace: string): FieldSelector | undefined => {
    if (namespace && namespace.length > 0) {
        return { fieldPath: 'metadata.namespace', values: [namespace], operator: '=' }
    }
    return undefined
}

export const replaceDots = (input: string): string => {
    return input.replace(/\./g, '\\.')
}
