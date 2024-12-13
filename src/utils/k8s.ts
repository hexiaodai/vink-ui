import { NamespaceName } from "@/clients/ts/types/types"


export const formatOSFamily = (family?: string): string => {
    if (!family) {
        return ''
    }
    let result = family.charAt(0).toUpperCase() + family.slice(1)
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
