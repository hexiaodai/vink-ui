import { NotificationInstance } from "antd/lib/notification/interface"
import { ListOptions } from "./ts/management/resource/v1alpha1/resource"
import { components } from "./ts/openapi/openapi-schema"
import { defaultTimeout, resourceClient, resourceWatchClient } from "./clients"
import { NamespaceName, ResourceType } from "./ts/types/types"
import { getErrorMessage, isAbortedError } from "@/utils/utils"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"
import { namespaceNameKey } from "@/utils/k8s"

export type IPPool = components["schemas"]["v1IPPool"]

export const listIPPools = async (setIPPools?: React.Dispatch<React.SetStateAction<IPPool[] | undefined>>, opts?: ListOptions, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<IPPool[]> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.list({
            resourceType: ResourceType.IPPOOL,
            options: ListOptions.create(opts)
        })
        let items: IPPool[] = []
        result.response.items.forEach((item: string) => {
            items.push(JSON.parse(item) as IPPool)
        })
        setIPPools?.(items.length > 0 ? items : undefined)
        return items
    } catch (err) {
        notification?.error({ message: `Failed to list ippool`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const deleteIPPools = async (ippools: IPPool[], setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        const completed: IPPool[] = []
        const failed: { ippool: IPPool; error: any }[] = []

        await Promise.all(ippools.map(async (ippool) => {
            const namespace = ippool.metadata!.namespace
            const name = ippool.metadata!.name

            try {
                await resourceClient.delete({
                    namespaceName: { namespace, name },
                    resourceType: ResourceType.IPPOOL
                }).response
                completed.push(ippool)
            } catch (err: any) {
                failed.push({ ippool, error: err })
            }
        }))

        if (failed.length > 0) {
            const errorMessages = failed.map(({ ippool, error }) => `Namespace: ${ippool.metadata!.namespace ?? "unknown"}, Name: ${ippool.metadata!.name ?? "unknown"}, Error: ${error.message}`).join("\n")
            throw new Error(`Failed to delete the following ippools:\n${errorMessages}`)
        }
    } catch (err) {
        notification?.error({ message: `Failed to delete ippools:`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const deleteIPPool = async (ns: NamespaceName, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        await resourceClient.delete({
            resourceType: ResourceType.IPPOOL,
            namespaceName: ns
        })
    } catch (err) {
        notification?.error({ message: `Failed to delete ippool [Namespace: ${ns.namespace}, Name: ${ns.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const watchIPPools = async (setIPPools: React.Dispatch<React.SetStateAction<IPPool[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, opts?: WatchOptions, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const map = new Map<string, IPPool>()

            const call = resourceWatchClient.watch({
                resourceType: ResourceType.IPPOOL,
                options: WatchOptions.create(opts)
            }, { abort: abortSignal })

            let timeoutId: NodeJS.Timeout | null = null
            const updateIPPools = () => {
                if (map.size === 0 && timeoutId === null) {
                    timeoutId = setTimeout(() => {
                        const items = Array.from(map.values())
                        setIPPools(items.length > 0 ? items : undefined)
                        timeoutId = null
                    }, defaultTimeout)
                } else {
                    const items = Array.from(map.values())
                    setIPPools(items.length > 0 ? items : undefined)
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
                            const ippool = JSON.parse(data) as IPPool
                            map.set(namespaceNameKey(ippool), ippool)
                        })
                        break
                    }
                    case EventType.DELETED: {
                        response.items.forEach((data) => {
                            const ippool = JSON.parse(data) as IPPool
                            map.delete(namespaceNameKey(ippool))
                        })
                        break
                    }
                }
                updateIPPools()
            })

            call.responses.onError((err: Error) => {
                if (isAbortedError(err)) {
                    resolve()
                } else {
                    reject(new Error(`Error in watch stream for IPPool: ${err.message}`))
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch IPPool`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}

export const watchIPPool = async (ns: NamespaceName, setIPPool: React.Dispatch<React.SetStateAction<IPPool | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const call = resourceWatchClient.watch({
                resourceType: ResourceType.IPPOOL,
                options: WatchOptions.create({
                    fieldSelectorGroup: {
                        operator: "&&",
                        fieldSelectors: [
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
                        setIPPool(JSON.parse(response.items[0]) as IPPool)
                        break
                    }
                    case EventType.DELETED: {
                        setIPPool(undefined)
                        break
                    }
                }
            })

            call.responses.onError((err: Error) => {
                if (!isAbortedError(err)) {
                    reject(new Error(`Error in watch stream for IPPool: ${err.message}`))
                } else {
                    resolve()
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch IPPool`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}

export const createIPPool = async (ippool: IPPool, setIPPool?: React.Dispatch<React.SetStateAction<IPPool | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<IPPool> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.create({
            resourceType: ResourceType.IPPOOL,
            data: JSON.stringify(ippool)
        })
        const output = JSON.parse(result.response.data) as IPPool
        setIPPool?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to create ip pool [Namespace: ${ippool.metadata!.namespace}, Name: ${ippool.metadata!.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const updateIPPool = async (ippool: IPPool, setIPPool?: React.Dispatch<React.SetStateAction<IPPool | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<IPPool> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.update({
            resourceType: ResourceType.IPPOOL,
            data: JSON.stringify(ippool)
        })
        const temp = JSON.parse(result.response.data) as IPPool
        setIPPool?.(temp)
        return temp
    } catch (err) {
        notification?.error({ message: `Failed to update ip pool [Name: ${ippool.metadata!.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}
