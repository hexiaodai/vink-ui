// import { osFamilyLabel, diskTypeLabel } from '@/utils/k8s.ts'
import { instances } from "@/clients/ts/label/labels.gen.ts"

export type Filter = {
    key: string
    operator: string
    value: string
}

export const LabelsSelector = (filters: Filter[]): string => {
    const labels = filters.map((filter) => {
        return `${filter.key}${filter.operator}${filter.value}`
    })
    return labels.join(',')
}

export const LabelsSelectorString = (filters: string[]): string => {
    const labels = filters.map((filter) => {
        return `${filter}`
    })
    return labels.join(',')
}

export const FieldSelector = (filter: Filter): string => {
    return `${filter.key}${filter.operator}${filter.value}`
}

export const NameFieldSelector = (name: string): string => {
    if (name.length === 0) {
        return ''
    }
    return FieldSelector({
        key: 'metadata.name',
        operator: '=',
        value: name
    })
}

export const virtualMachineOSLabelSelector = (name: string): string => {
    if (name.length === 0) {
        return ''
    }
    return LabelsSelector([{
        key: instances.VinkVirtualmachineOs.name,
        operator: '=',
        value: name
    }])
}

export const dataVolumeTypeLabelSelector = (name: string) => {
    if (name.length === 0) {
        return ''
    }
    return LabelsSelector([{
        key: instances.VinkDatavolumeType.name,
        operator: '=',
        value: name
    }])
}

export const fieldSelector = (params: { keyword?: string }) => {
    return (params.keyword && params.keyword.length > 0) ? `metadata.name=${params.keyword}` : ""
}

export const simpleFieldSelector2 = (params?: { namespace?: string, keyword?: string }) => {
    if (!params) {
        return []
    }
    let selector: string[] = []
    if (params.namespace && params.namespace.length > 0) {
        selector.push(`metadata.namespace=${params.namespace}`)
    }
    if (params.keyword && params.keyword.length > 0) {
        selector.push(`status.virtualMachine.status.printableStatus*=${params.keyword}`)
        // selector.push(`metadata.name*=${params.keyword}`)
    }
    if (selector.length == 0) {
        return []
    }
    return [selector.join(",")]
}

export interface fieldSelector {
    fieldPath: string
    value?: string
    operator?: '=' | '!=' | '^=' | '$=' | '*='
}

export const simpleFieldSelector = (fields: fieldSelector[]) => {
    const uniqueFields = fields.reduce((acc, field) => {
        acc[field.fieldPath] = field
        return acc
    }, {} as { [key: string]: fieldSelector })

    const result = Object.values(uniqueFields)
        .map(({ fieldPath, value, operator }) => {
            let op = operator || ''
            return (value && value.length > 0) ? `${fieldPath}${op}${value}` : null
        })
        .filter(Boolean)
        .join(',')

    if (result.length > 0) {
        return [result]
    }
    return []
}

export const getNamespaceFieldSelector = (namespace: string): fieldSelector => {
    return { fieldPath: 'metadata.namespace', value: namespace, operator: '=' }
}
