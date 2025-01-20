import { NotificationInstance } from "antd/lib/notification/interface"
import { defaultTimeout, resourceClient, resourceWatchClient } from "./clients"
import { components } from "./ts/openapi/openapi-schema"
import { NamespaceName, ResourceType } from "./ts/types/types"
import { getErrorMessage, isAbortedError, resourceSort } from "@/utils/utils"
import { ListOptions } from "./ts/management/resource/v1alpha1/resource"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"
import { namespaceNameKey } from "@/utils/k8s"

export type Multus = components["schemas"]["v1NetworkAttachmentDefinition"]

export const getMultus = async (ns: NamespaceName, setMultus?: React.Dispatch<React.SetStateAction<Multus | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<Multus> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.get({
            resourceType: ResourceType.MULTUS,
            namespaceName: ns
        })
        const output = JSON.parse(result.response.data) as Multus
        setMultus?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to get data NetworkAttachmentDefinition [Namespace: ${ns.namespace}, Name: ${ns.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const listMultus = async (setMultus?: React.Dispatch<React.SetStateAction<Multus[] | undefined>>, opts?: ListOptions, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<Multus[]> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.list({
            resourceType: ResourceType.MULTUS,
            options: ListOptions.create(opts)
        })
        let items: Multus[] = []
        result.response.items.forEach((item: string) => {
            items.push(JSON.parse(item) as Multus)
        })
        setMultus?.(items.length > 0 ? items : undefined)
        return items
    } catch (err) {
        notification?.error({ message: `Failed to list multus`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const deleteMultuses = async (multuses: Multus[], setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        const completed: Multus[] = []
        const failed: { multus: Multus; error: any }[] = []

        await Promise.all(multuses.map(async (multus) => {
            const namespace = multus.metadata!.namespace
            const name = multus.metadata!.name

            try {
                await resourceClient.delete({
                    namespaceName: { namespace, name },
                    resourceType: ResourceType.SUBNET
                }).response
                completed.push(multus)
            } catch (err: any) {
                failed.push({ multus, error: err })
            }
        }))

        if (failed.length > 0) {
            const errorMessages = failed.map(({ multus, error }) => `Namespace: ${multus.metadata!.namespace ?? "unknown"}, Name: ${multus.metadata!.name ?? "unknown"}, Error: ${error.message}`).join("\n")
            throw new Error(`Failed to delete the following multuses:\n${errorMessages}`)
        }
    } catch (err) {
        notification?.error({ message: `Failed to delete multuses:`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const deleteMultus = async (ns: NamespaceName, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        await resourceClient.delete({
            resourceType: ResourceType.MULTUS,
            namespaceName: ns
        })
    } catch (err) {
        notification?.error({ message: `Failed to delete multus [Namespace: ${ns.namespace}, Name: ${ns.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const watchMultuses = async (setMultuses: React.Dispatch<React.SetStateAction<Multus[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, opts?: WatchOptions, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const map = new Map<string, Multus>()

            const call = resourceWatchClient.watch({
                resourceType: ResourceType.MULTUS,
                options: WatchOptions.create(opts)
            }, { abort: abortSignal })

            let timeoutId: NodeJS.Timeout | null = null
            const updateMultuses = () => {
                if (map.size === 0 && timeoutId === null) {
                    timeoutId = setTimeout(() => {
                        const items = resourceSort(Array.from(map.values()))
                        setMultuses(items.length > 0 ? items : undefined)
                        timeoutId = null
                    }, defaultTimeout)
                } else {
                    const items = resourceSort(Array.from(map.values()))
                    setMultuses(items.length > 0 ? items : undefined)
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
                            const multus = JSON.parse(data) as Multus
                            map.set(namespaceNameKey(multus), multus)
                        })
                        break
                    }
                    case EventType.DELETED: {
                        response.items.forEach((data) => {
                            const multus = JSON.parse(data) as Multus
                            map.delete(namespaceNameKey(multus))
                        })
                        break
                    }
                }
                updateMultuses()
            })

            call.responses.onError((err: Error) => {
                if (isAbortedError(err)) {
                    resolve()
                } else {
                    reject(new Error(`Error in watch stream for Multus: ${err.message}`))
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch Multus`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}

export const watchMultus = async (ns: NamespaceName, setMultus: React.Dispatch<React.SetStateAction<Multus | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const call = resourceWatchClient.watch({
                resourceType: ResourceType.MULTUS,
                options: WatchOptions.create({
                    fieldSelectorGroup: {
                        operator: "&&",
                        fieldSelectors: [
                            { fieldPath: "metadata.name", operator: "=", values: [ns.name] },
                            { fieldPath: "metadata.namespace", operator: "=", values: [ns.namespace] }
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
                        setMultus(JSON.parse(response.items[0]) as Multus)
                        break
                    }
                    case EventType.DELETED: {
                        setMultus(undefined)
                        break
                    }
                }
            })

            call.responses.onError((err: Error) => {
                if (!isAbortedError(err)) {
                    reject(new Error(`Error in watch stream for Multus: ${err.message}`))
                } else {
                    resolve()
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch Multus`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}

export const createMultus = async (multus: Multus, setMultus?: React.Dispatch<React.SetStateAction<Multus | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<Multus> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.create({
            resourceType: ResourceType.MULTUS,
            data: JSON.stringify(multus)
        })
        const output = JSON.parse(result.response.data) as Multus
        setMultus?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to create multus [Namespace: ${multus.metadata!.namespace}, Name: ${multus.metadata!.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const updateMultus = async (multus: Multus, setMultus?: React.Dispatch<React.SetStateAction<Multus | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<Multus> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.update({
            resourceType: ResourceType.MULTUS,
            data: JSON.stringify(multus)
        })
        const temp = JSON.parse(result.response.data) as Multus
        setMultus?.(temp)
        return temp
    } catch (err) {
        notification?.error({ message: `Failed to update multus [Namespace: ${multus.metadata!.namespace}, Name: ${multus.metadata!.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}
