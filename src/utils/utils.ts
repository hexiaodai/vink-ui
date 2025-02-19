// import { CustomResourceDefinition } from "@/clients/ts/apiextensions/v1alpha1/custom_resource_definition"
import { ColumnsState } from "@ant-design/pro-components"
import { formatMemory, namespaceNameKey } from "./k8s"
import { NamespaceName, ResourceType } from '@/clients/ts/types/types'
import { VirtualMachine } from "@/clients/virtual-machine"
import { Multus } from "@/clients/multus"
import { KubeResource } from "@/clients/clients"

/**
 * Combines multiple class names into a single string.
 * @param  {...string} classes - The class names to combine.
 * @returns {string} - The combined class names.
 */
export function classNames(...classes: (string | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ')
}

/**
 * Converts a timestamp (bigint or ISO string) to a string representation in "YYYY-MM-DD HH:mm:ss" format.
 * @param timestamp - The bigint timestamp (assumed to be in milliseconds) or an ISO string.
 * @returns The string representation of the date and time in "YYYY-MM-DD HH:mm:ss" format.
 */
export function formatTimestamp(timestamp: bigint | string): string {
    let date: Date

    if (typeof timestamp === 'string') {
        date = new Date(timestamp)
    } else {
        date = new Date(Number(timestamp) * 1e3)
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

export const isAbortedError = (err: Error) => {
    if (err.message.toLowerCase().includes("aborted")) {
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

export const resourceSort = (items: any[]): any[] => {
    if (!items || items.length == 0) {
        return items
    }
    return items.sort((a: any, b: any) => {
        return new Date(b.metadata.creationTimestamp).getTime() - new Date(a.metadata.creationTimestamp).getTime()
    })
}

export const eventSort = (items: any[]): any[] => {
    if (!items || items.length == 0) {
        return items
    }
    return items.sort((a: any, b: any) => {
        return new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
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

export const openConsole = (vm: VirtualMachine) => {
    const status = vm.status?.printableStatus
    if (!status || status !== "Running") {
        return
    }

    const namespace = vm.metadata!.namespace
    const name = vm.metadata!.name

    const url = `/console.html?namespace=${namespace}&name=${name}`
    const width = screen.width - 400
    const height = screen.height - 250
    const left = 0
    const top = 0

    window.open(url, `${namespace}/${name}`, `toolbars=0, width=${width}, height=${height}, left=${left}, top=${top}`)
}

export const getNamespaceName = (params: URLSearchParams) => {
    return { namespace: params.get("namespace") || "", name: params.get("name") || "" }
}

export const getNamespaceName2 = (params: URLSearchParams): NamespaceName | undefined => {
    const ns = params.get("namespace") || ""
    const name = params.get("name")
    if (!name) {
        return
    }
    return { namespace: ns, name: name }
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

export const generateKubeovnNetworkAnnon = (multus: NamespaceName | any, name: string) => {
    let prefix = ""
    if (multus.metadata && typeof multus.metadata.namespace === 'string' && typeof multus.metadata.name === 'string') {
        prefix = `${multus.metadata.name}.${multus.metadata.namespace}`
    } else if (typeof multus.namespace === 'string' && typeof multus.name === 'string') {
        prefix = `${multus.name}.${multus.namespace}`
    }
    return `${prefix}.ovn.kubernetes.io/${name}`
}

export const getProvider = (multus: Multus): string => {
    if (!multus.spec?.config) {
        return ""
    }

    const kubeovn = "kube-ovn"
    const config = JSON.parse(multus.spec.config)
    if (config.type == kubeovn) {
        return config.provider as string
    }
    if (!config.plugins) {
        return ""
    }
    for (let i = 0; i < config.plugins.length; i++) {
        const plugin = config.plugins[i]
        if (plugin.type == kubeovn) {
            return plugin.provider as string
        }
    }
    return ""
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

export const calculateAge = (creationTimestamp: string): string => {
    const now = new Date()

    const createdAt = new Date(creationTimestamp)

    const timeDiff = now.getTime() - createdAt.getTime()

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)

    if (days > 0) {
        return `${days}d`
    } else if (hours > 0) {
        return `${hours}h`
    } else if (minutes > 0) {
        return `${minutes}m`
    } else {
        return `${seconds}s`
    }
}

export const calculateResourceAge = <T extends KubeResource>(cr: T): string => {
    const creationTimestamp = cr.metadata?.creationTimestamp

    const now = new Date()

    const createdAt = new Date(creationTimestamp)

    const timeDiff = now.getTime() - createdAt.getTime()

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)

    if (days > 0) {
        return `${days}d`
    } else if (hours > 0) {
        return `${hours}h`
    } else if (minutes > 0) {
        return `${minutes}m`
    } else {
        return `${seconds}s`
    }
}

// export const addNewOption = (
//     inputValue: number | undefined,
//     options: { label: string; value: number }[],
//     setOptions: React.Dispatch<React.SetStateAction<{ label: string, value: number }[]>>,
//     fieldName: "cpu" | "memory"
// ) => {
//     if (!inputValue || !formRef.current) {
//         return
//     }
//     const unit = fieldName === "cpu" ? "Core" : "Gi"
//     if (!options.some(opt => opt.value === inputValue)) {
//         const newOption = { label: `${inputValue} ${unit}`, value: inputValue }
//         setOptions([...options, newOption])
//         formRef.current.setFieldsValue({ [fieldName]: inputValue })
//     }
// }

export const containsErrorKeywords = (str: string): boolean => {
    const keywords = new Set(["err", "crash", "backoff"])
    const lowerStr = str.toLowerCase()
    return Array.from(keywords).some(keyword => lowerStr.includes(keyword))
}

export const containsProcessing = (str: string): boolean => {
    return str.toLowerCase().endsWith("ing")
}

export const roundToDecimals = (num: number, decimals: number): number => {
    const factor = Math.pow(10, decimals)
    const n = Math.round(num * factor) / factor
    return Number.isNaN(n) ? 0 : n
}

export const getProgressColor = (value: number) => {
    if (value < 50) return '#52c41a'
    if (value < 70) return '#faad14'
    return '#f5222d'
}

export const bytesToHumanReadable = (bytes: number): string => {
    const gb = 1e9
    const tb = 1e12

    if (bytes >= tb) {
        return (bytes / tb).toFixed(2) + ' TB'
    } else if (bytes >= gb) {
        return (bytes / gb).toFixed(2) + ' GB'
    } else {
        return (bytes / 1e6).toFixed(2) + ' MB'
    }
}

export const replaceSpacesWithHyphen = (str: string): string => {
    return str.replace(/\s+/g, '-')
}
