import { getErrorMessage, isAbortedError, resourceSort } from "@/utils/utils"
import { defaultTimeout, resourceClient, resourceWatchClient } from "./clients"
import { ListOptions } from "./ts/management/resource/v1alpha1/resource"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"
import { components } from "./ts/openapi/openapi-schema"
import { NamespaceName, ResourceType } from "./ts/types/types"
import { namespaceNameKey } from "@/utils/k8s"
import { NotificationInstance } from "antd/lib/notification/interface"

export type VirtualMachineSummary = components["schemas"]["v1alpha1VirtualMachineSummary"]

export const getVirtualMachineSummary = async (ns: NamespaceName, setVirtualMachineSummary?: React.Dispatch<React.SetStateAction<VirtualMachineSummary | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<VirtualMachineSummary> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.get({
            resourceType: ResourceType.VIRTUAL_MACHINE_SUMMARY,
            namespaceName: ns
        })
        const output = JSON.parse(result.response.data) as VirtualMachineSummary
        setVirtualMachineSummary?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to get virtual machine summary [Namespace: ${ns.namespace}, Name: ${ns.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const listVirtualMachineSummarys = async (setVirtualMachineSummarys?: React.Dispatch<React.SetStateAction<VirtualMachineSummary[] | undefined>>, opts?: ListOptions, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<VirtualMachineSummary[]> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.list({
            resourceType: ResourceType.VIRTUAL_MACHINE,
            options: ListOptions.create(opts)
        })
        let items: VirtualMachineSummary[] = []
        result.response.items.forEach((item: string) => {
            items.push(JSON.parse(item) as VirtualMachineSummary)
        })
        setVirtualMachineSummarys?.(items.length > 0 ? items : undefined)
        return items
    } catch (err) {
        notification?.error({ message: `Failed to list virtual machine`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const watchVirtualMachineSummarys = async (setVirtualMachineSummarys: React.Dispatch<React.SetStateAction<VirtualMachineSummary[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, opts?: WatchOptions, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const map = new Map<string, VirtualMachineSummary>()

            const call = resourceWatchClient.watch({
                resourceType: ResourceType.VIRTUAL_MACHINE_SUMMARY,
                options: WatchOptions.create(opts)
            }, { abort: abortSignal })

            let timeoutId: NodeJS.Timeout | null = null
            const updateVirtualMachineSummarys = () => {
                if (map.size === 0 && timeoutId === null) {
                    timeoutId = setTimeout(() => {
                        const items = resourceSort(Array.from(map.values()))
                        setVirtualMachineSummarys(items.length > 0 ? items : undefined)
                        timeoutId = null
                    }, defaultTimeout)
                } else {
                    const items = resourceSort(Array.from(map.values()))
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
                        resolve()
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
                if (!isAbortedError(err)) {
                    reject(new Error(`Error in watch stream for VirtualMachineSummary: ${err.message}`))
                } else {
                    resolve()
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: "Error in watch stream for VirtualMachineSummary", description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}

export const watchVirtualMachineSummary = async (ns: NamespaceName, setVirtualMachineSummary: React.Dispatch<React.SetStateAction<VirtualMachineSummary | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
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
                        resolve()
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
                if (!isAbortedError(err)) {
                    reject(new Error(`Error in watch stream for VirtualMachineSummary: ${err.message}`))
                } else {
                    resolve()
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: "Error in watch stream for VirtualMachineSummary", description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}
