import type { ListOptions as APIListOptions } from '@kubevm.io/vink/common/common.pb'
import { osFamilyLabel, diskTypeLabel } from '@/utils/k8s.ts'

export type ListOptions = {
    namespace?: string
    opts?: APIListOptions
}

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

export const OSFamilyLabelSelector = (name: string): string => {
    if (name.length === 0) {
        return ''
    }
    return LabelsSelector([{
        key: osFamilyLabel,
        operator: '=',
        value: name
    }])
}

export const DiskLabelSelector = (name: string): string => {
    if (name.length === 0) {
        return ''
    }
    return LabelsSelector([{
        key: diskTypeLabel,
        operator: '=',
        value: name
    }])
}

