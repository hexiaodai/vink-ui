import { isAbortedError } from "@/utils/utils"
import { defaultTimeout, resourceClient, resourceWatchClient } from "./clients"
import { ListOptions } from "./ts/management/resource/v1alpha1/resource"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"
import { components } from "./ts/openapi/openapi-schema"
import { NamespaceName, ResourceType } from "./ts/types/types"
import { namespaceNameKey } from "@/utils/k8s"

export type VirtualMachineSummary = components["schemas"]["v1alpha1VirtualMachineSummary"]

export const getVirtualMachineSummary = async (ns: NamespaceName): Promise<VirtualMachineSummary> => {
    return new Promise((resolve, reject) => {
        const call = resourceClient.get({
            resourceType: ResourceType.VIRTUAL_MACHINE_SUMMARY,
            namespaceName: ns
        })
        call.then((result) => {
            resolve(JSON.parse(result.response.data) as VirtualMachineSummary)
        })
        call.response.catch((err: Error) => {
            reject(new Error(`Failed to get virtual machine summary [Namespace: ${ns.namespace}, Name: ${ns.name}]: ${err.message}`))
        })
    })
}

export const listVirtualMachineSummarys = async (opts?: ListOptions): Promise<VirtualMachineSummary[]> => {
    return new Promise((resolve, reject) => {
        const call = resourceClient.list({
            resourceType: ResourceType.VIRTUAL_MACHINE,
            options: ListOptions.create(opts)
        })
        call.then((result) => {
            let items: VirtualMachineSummary[] = []
            result.response.items.forEach((item: string) => {
                items.push(JSON.parse(item) as VirtualMachineSummary)
            })
            resolve(items)
        })
        call.response.catch((err: Error) => {
            reject(new Error(`Failed to list virtual machine: ${err.message}`))
        })
    })
}

export const watchVirtualMachineSummarys = (setVirtualMachineSummarys: React.Dispatch<React.SetStateAction<VirtualMachineSummary[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, opts?: WatchOptions): Promise<void> => {
    return new Promise((resolve, reject) => {
        setLoading(true)

        const map = new Map<string, VirtualMachineSummary>()

        const call = resourceWatchClient.watch({
            resourceType: ResourceType.VIRTUAL_MACHINE_SUMMARY,
            options: WatchOptions.create(opts)
        }, { abort: abortSignal })

        let timeoutId: NodeJS.Timeout | null = null
        const updateVirtualMachineSummarys = () => {
            if (map.size === 0 && timeoutId === null) {
                timeoutId = setTimeout(() => {
                    const items = Array.from(map.values())
                    setVirtualMachineSummarys(items.length > 0 ? items : undefined)
                    timeoutId = null
                }, defaultTimeout)
            } else {
                const items = Array.from(map.values())
                setVirtualMachineSummarys(items.length > 0 ? items : undefined)
                if (timeoutId !== null) {
                    clearTimeout(timeoutId)
                    timeoutId = null
                }
            }
        }

        call.responses.onMessage((response) => {
            switch (response.eventType) {
                case EventType.READY: {
                    setLoading(false)
                    break
                }
                case EventType.ADDED:
                case EventType.MODIFIED: {
                    response.items.forEach((data) => {
                        const vm = JSON.parse(data) as VirtualMachineSummary
                        map.set(namespaceNameKey(vm), vm)
                    })
                    break
                }
                case EventType.DELETED: {
                    response.items.forEach((data) => {
                        const vm = JSON.parse(data) as VirtualMachineSummary
                        map.delete(namespaceNameKey(vm))
                    })
                    break
                }
            }
            updateVirtualMachineSummarys()
        })

        call.responses.onError((err: Error) => {
            setLoading(false)
            if (isAbortedError(err)) {
                resolve()
            } else {
                reject(new Error(`Error in watch stream for VirtualMachineSummary: ${err.message}`))
            }
        })

        call.responses.onComplete(() => {
            setLoading(false)
            resolve()
        })
    })
}

export const watchVirtualMachineSummary = (ns: NamespaceName, setVirtualMachineSummary: React.Dispatch<React.SetStateAction<VirtualMachineSummary | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal): Promise<void> => {
    return new Promise((resolve, reject) => {
        setLoading(true)

        const call = resourceWatchClient.watch({
            resourceType: ResourceType.VIRTUAL_MACHINE_SUMMARY,
            options: WatchOptions.create({
                fieldSelectorGroup: {
                    operator: "&&",
                    fieldSelectors: [
                        { fieldPath: "metadata.namespace", operator: "=", values: [ns.namespace] },
                        { fieldPath: "metadata.name", operator: "=", values: [ns.name] }
                    ]
                }
            })
        }, { abort: abortSignal })

        call.responses.onMessage((response) => {
            switch (response.eventType) {
                case EventType.READY: {
                    setLoading(false)
                    break
                }
                case EventType.ADDED:
                case EventType.MODIFIED: {
                    if (response.items.length === 0) {
                        return
                    }
                    setVirtualMachineSummary(JSON.parse(response.items[0]) as VirtualMachineSummary)
                    break
                }
                case EventType.DELETED: {
                    setVirtualMachineSummary(undefined)
                    break
                }
            }
        })

        call.responses.onError((err: Error) => {
            setLoading(false)
            if (isAbortedError(err)) {
                resolve()
            } else {
                reject(new Error(`Error in watch stream for VirtualMachineSummary: ${err.message}`))
            }
        })

        call.responses.onComplete(() => {
            setLoading(false)
            resolve()
        })
    })
}
