// import { CustomResourceDefinition } from "@/clients/ts/apiextensions/v1alpha1/custom_resource_definition"
import { ColumnsState } from "@ant-design/pro-components"
import { formatMemory, namespaceName, namespaceNameKey } from "./k8s"
import { ListOptions } from "@/clients/ts/types/list_options"
import { NamespaceName } from "@/clients/ts/types/namespace_name"
import { ResourceType } from '@/clients/ts/types/types'

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
    const result = JSON.parse(str || "{}")
    return result || {}
}

// export function parseSpec(crd: CustomResourceDefinition) {
//     return jsonParse(crd.spec)
// }

// export function parseStatus(crd: CustomResourceDefinition) {
//     return jsonParse(crd.status)
// }

/**
 * Converts a timestamp (bigint or ISO string) to a string representation in "YYYY-MM-DD HH:mm:ss" format.
 * @param timestamp - The bigint timestamp (assumed to be in milliseconds) or an ISO string.
 * @returns The string representation of the date and time in "YYYY-MM-DD HH:mm:ss" format.
 */
export function formatTimestamp(timestamp?: bigint | string): string {
    let date: Date;

    if (typeof timestamp === 'string') {
        date = new Date(timestamp) // 处理 ISO 字符串
    } else {
        date = new Date(Number(timestamp) * 1e3) // 处理 bigint
    }

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

export const dataSource = (data: Map<string, any>): any[] | undefined => {
    let items = Array.from(data.values())
    if (items.length == 0) {
        return undefined
    }
    return items.sort((a: any, b: any) => {
        return new Date(b.metadata.creationTimestamp).getTime() - new Date(a.metadata.creationTimestamp).getTime()
    })
}

export const generateMessage = (items: any[] | NamespaceName[], successMessage: string, multipleMessage: string) => {
    const namespaceNames = items.map(item => namespaceNameKey(item))

    const displayedNames = namespaceNames.slice(0, 3).join(", ")
    const remainingCount = namespaceNames.length - 3

    if (remainingCount > 0) {
        return multipleMessage
            .replace("{names}", displayedNames)
            .replace("{count}", namespaceNames.length.toString())
    } else {
        return successMessage.replace("{names}", displayedNames)
    }
}

export const capacity = (rootDisk: any) => {
    const [value, uint] = formatMemory(rootDisk.spec.pvc.resources.requests.storage)
    return `${value} ${uint}`
}

export const openConsole = (vm: any) => {
    const isRunning = vm.status.printableStatus as string === "Running"
    if (!isRunning) {
        return
    }

    const url = `/console?namespace=${vm.metadata.namespace}&name=${vm.metadata.name}`
    const width = screen.width - 400
    const height = screen.height - 250
    const left = 0
    const top = 0

    window.open(url, `${vm.metadata.namespace}/${vm.metadata.name}`, `toolbars=0, width=${width}, height=${height}, left=${left}, top=${top}`)
}

export const getNamespaceName = (params: URLSearchParams) => {
    return { namespace: params.get("namespace") || "", name: params.get("name") || "" }
}

export const updateNestedValue = (keypath: string[], newInfo: any, oriInfo: any, removeEmptyString: boolean = false) => {
    const value = keypath.reduce((acc, key) => acc && acc[key], newInfo)
    keypath.reduce((acc, key, index) => {
        if (index === keypath.length - 1) {
            if (removeEmptyString && (value === "" || value === null || value === undefined)) {
                delete acc[key]
            } else {
                acc[key] = value
            }
        } else {
            if (acc[key] === undefined || acc[key] === null) {
                acc[key] = {}
            }
        }
        return acc[key]
    }, oriInfo)
}

// export const namespaceNameKey = (obj: any) => {
//     if (obj.metadata && typeof obj.metadata.namespace === 'string' && typeof obj.metadata.name === 'string') {
//         return `${obj.metadata.namespace}/${obj.metadata.name}`
//     } else if (typeof obj.namespace === 'string' && typeof obj.name === 'string') {
//         return `${obj.namespace}/${obj.name}`
//     } else if (typeof obj.metadata.name === 'string') {
//         return obj.metadata.name
//     } else if (typeof obj.name === 'string') {
//         return obj.name
//     }
//     return ""
// }

export const generateKubeovnNetworkAnnon = (multus: NamespaceName | any, name: string) => {
    let prefix = ""
    if (multus.metadata && typeof multus.metadata.namespace === 'string' && typeof multus.metadata.name === 'string') {
        prefix = `${multus.metadata.name}.${multus.metadata.namespace}`
    } else if (typeof multus.namespace === 'string' && typeof multus.name === 'string') {
        prefix = `${multus.name}.${multus.namespace}`
    }
    return `${prefix}.ovn.kubernetes.io/${name}`
}

// export const generateKubeovnNetworkAnnonByNs = (ns: NamespaceName, name: string) => {
//     const prefix = `${ns.name}.${ns.namespace}.ovn.kubernetes.io`
//     return `${prefix}/${name}`
// }

export const getProvider = (multusCR: any) => {
    const kubeovn = "kube-ovn"
    const config = JSON.parse(multusCR.spec.config)
    if (config.type == kubeovn) {
        return config.provider
    }
    if (!config.plugins) {
        return
    }
    for (let i = 0; i < config.plugins.length; i++) {
        const plugin = config.plugins[i]
        if (plugin.type == kubeovn) {
            return plugin.provider
        }
    }
    return
}

export const getErrorMessage = (err: unknown): string => {
    if (typeof err === 'string') {
        return err
    } else if (err instanceof Error) {
        return err.message
    } else {
        return JSON.stringify(err)
    }
}

export const resourceTypeName = new Map<ResourceType, string>([
    [ResourceType.VIRTUAL_MACHINE, "VirtualMachine"],
    [ResourceType.VIRTUAL_MACHINE_INSTANCE, "VirtualMachineInstance"],
    [ResourceType.VIRTUAL_MACHINE_SUMMARY, "VirtualMachineSummary"],
    [ResourceType.DATA_VOLUME, "DataVolume"],
    [ResourceType.NODE, "Node"],
    [ResourceType.NAMESPACE, "Namespace"],
    [ResourceType.MULTUS, "Multus"],
    [ResourceType.SUBNET, "Subnet"],
    [ResourceType.VPC, "VPC"],
    [ResourceType.IPPOOL, "IPPool"],
    [ResourceType.STORAGE_CLASS, "StorageClass"],
    [ResourceType.IPS, "IPs"]
])

export const arraysAreEqual = (a: any[], b: any[]) => {
    const sortedA = [...a].sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y)))
    const sortedB = [...b].sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y)))
    return JSON.stringify(sortedA) === JSON.stringify(sortedB)
}

export const filterNullish = <T>(array: (T | null | undefined)[]): T[] => {
    return array.filter((item): item is T => item != null)
}
