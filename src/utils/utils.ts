// import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { ColumnsState } from "@ant-design/pro-components"
import { formatMemory, namespaceName, namespaceNameKey } from "./k8s"
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
    if (items.length > 0) {
        return items
    }
    return undefined
}

export const generateMessage = (crds: any[], successMessage: string, multipleMessage: string) => {
    const names: string[] = []
    crds.forEach(crd => {
        names.push(namespaceNameKey(crd))
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

// export const emptyOptions = (): ListOptions => {
//     return {
//         fieldSelector: "",
//         labelSelector: "",
//         limit: 0,
//         continue: "",
//         namespaceNames: [],
//         namespace: "",
//         watch: false,
//     }
// }

// export const capacity = (rootDisk: CustomResourceDefinition) => {
//     const spec = jsonParse(rootDisk.spec)
//     const [value, uint] = formatMemory(spec.pvc?.resources?.requests?.storage)
//     return `${value} ${uint}`
// }

// export const capacity = (rootDisk: any) => {
//     const spec = jsonParse(rootDisk.spec)
//     const [value, uint] = formatMemory(spec.pvc.resources.requests.storage)
//     return `${value} ${uint}`
// }

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

export const generateKubeovnNetworkAnnon = (multusCR: any, name: string) => {
    const md = multusCR.metadata
    const prefix = `${md.name}.${md.namespace}.ovn.kubernetes.io`
    return `${prefix}/${name}`
}


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
