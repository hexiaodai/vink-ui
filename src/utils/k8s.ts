import type { DataVolume } from "@/clients/ts/management/datavolume/v1alpha1/datavolume.pb"
import { ObjectMeta } from "@/clients/ts/types/object_meta"
import { NamespaceName } from "@/clients/ts/types/types"

const group = 'vink.io'

export const osFamilyLabel = group + '/os-family'
export const osVersionLabel = group + '/os-version'
export const descriptionLabel = group + '/description'
export const diskTypeLabel = group + '/disk'

export const defaultNamespace = 'default'

export const getOperatingSystem = (dv?: DataVolume): { family: string, version: string } => {
    const info = { family: 'linux', version: '' }
    if (!dv || !dv.dataVolume?.metadata?.labels) {
        return info
    }
    const labels = dv.dataVolume.metadata.labels
    if (labels[osFamilyLabel]) {
        info.family = labels[osFamilyLabel].toLowerCase()
    }
    if (labels[osVersionLabel]) {
        info.version = labels[osVersionLabel].toLowerCase()
    }
    return info
}

export const GetDescription = (labels: { [key: string]: string }): string => {
    return labels[descriptionLabel]
}

export const formatOSFamily = (family?: string): string => {
    if (!family) {
        return ''
    }
    // 首字母大写
    let result = family.charAt(0).toUpperCase() + family.slice(1)
    // 如果末尾是 "os"，则改成 "OS"
    if (result.endsWith('os')) {
        result = `${result.slice(0, -2)}OS`
    }
    return result
}

export const formatMemory = (value?: string): [string, string] => {
    if (!value) {
        return ['', '']
    }
    const match = value.match(/^(\d+)(\w+)$/)
    if (match) {
        return [match[1], match[2]]
    }
    return ['', '']
}

export const formatMemoryString = (str?: string): string => {
    const [value, uint] = formatMemory(str)
    return `${value} ${uint}`
}

export const namespaceName = <T extends ObjectMeta>(obj?: T) => {
    if (!obj) return ""
    return `${obj.namespace}/${obj.name}`
}

export const namespaceNameKey = (obj: any) => {
    let output = ""
    if (obj.metadata && typeof obj.metadata.namespace === 'string' && typeof obj.metadata.name === 'string') {
        output = `${obj.metadata.namespace}/${obj.metadata.name}`
    } else if (typeof obj.namespace === 'string' && typeof obj.name === 'string') {
        output = `${obj.namespace}/${obj.name}`
    } else if (typeof obj.name === 'string') {
        output = obj.name
    } else if (obj.metadata && typeof obj.metadata.name === 'string') {
        output = obj.metadata.name
    }
    return output.startsWith("/") ? output.slice(1) : output
}

export const extractNamespaceAndName = (crd: any) => {
    return { namespace: crd.metadata.namespace, name: crd.metadata.name }
}

export const parseNamespaceNameKey = (input: string): NamespaceName => {
    const parts = input.split("/")
    if (parts.length !== 2) {
        return { namespace: "", name: input }
    }

    const [namespace, name] = parts
    return { namespace, name }
}
