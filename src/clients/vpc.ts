import { NotificationInstance } from "antd/lib/notification/interface"
import { ListOptions } from "./ts/management/resource/v1alpha1/resource"
import { components } from "./ts/openapi/openapi-schema"
import { defaultTimeout, resourceClient, resourceWatchClient } from "./clients"
import { NamespaceName, ResourceType } from "./ts/types/types"
import { getErrorMessage, isAbortedError, resourceSort } from "@/utils/utils"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"
import { namespaceNameKey } from "@/utils/k8s"

export type VPC = components["schemas"]["v1Vpc"]

export const listVPCs = async (setVPCs?: React.Dispatch<React.SetStateAction<VPC[] | undefined>>, opts?: ListOptions, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<VPC[]> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.list({
            resourceType: ResourceType.VPC,
            options: ListOptions.create(opts)
        })
        let items: VPC[] = []
        result.response.items.forEach((item: string) => {
            items.push(JSON.parse(item) as VPC)
        })
        setVPCs?.(items.length > 0 ? items : undefined)
        return items
    } catch (err) {
        notification?.error({ message: `Failed to list VPC`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const deleteVPCs = async (vpcs: VPC[], setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        const completed: VPC[] = []
        const failed: { vpc: VPC; error: any }[] = []

        await Promise.all(vpcs.map(async (vpc) => {
            const namespace = vpc.metadata!.namespace
            const name = vpc.metadata!.name

            try {
                await resourceClient.delete({
                    namespaceName: { namespace, name },
                    resourceType: ResourceType.VPC
                }).response
                completed.push(vpc)
            } catch (err: any) {
                failed.push({ vpc, error: err })
            }
        }))

        if (failed.length > 0) {
            const errorMessages = failed.map(({ vpc, error }) => `Name: ${vpc.metadata!.name ?? "unknown"}, Error: ${error.message}`).join("\n")
            throw new Error(`Failed to delete the following VPCs:\n${errorMessages}`)
        }
    } catch (err) {
        notification?.error({ message: `Failed to delete VPCs:`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const deleteVPC = async (ns: NamespaceName, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        await resourceClient.delete({
            resourceType: ResourceType.VPC,
            namespaceName: ns
        })
    } catch (err) {
        notification?.error({ message: `Failed to delete VPC [Name: ${ns.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const watchVPCs = async (setVPCs: React.Dispatch<React.SetStateAction<VPC[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, opts?: WatchOptions, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const map = new Map<string, VPC>()

            const call = resourceWatchClient.watch({
                resourceType: ResourceType.VPC,
                options: WatchOptions.create(opts)
            }, { abort: abortSignal })

            let timeoutId: NodeJS.Timeout | null = null
            const updateVPCs = () => {
                if (map.size === 0 && timeoutId === null) {
                    timeoutId = setTimeout(() => {
                        const items = resourceSort(Array.from(map.values()))
                        setVPCs(items.length > 0 ? items : undefined)
                        timeoutId = null
                    }, defaultTimeout)
                } else {
                    const items = resourceSort(Array.from(map.values()))
                    setVPCs(items.length > 0 ? items : undefined)
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
                            const vpc = JSON.parse(data) as VPC
                            map.set(namespaceNameKey(vpc), vpc)
                        })
                        break
                    }
                    case EventType.DELETED: {
                        response.items.forEach((data) => {
                            const vpc = JSON.parse(data) as VPC
                            map.delete(namespaceNameKey(vpc))
                        })
                        break
                    }
                }
                updateVPCs()
            })

            call.responses.onError((err: Error) => {
                if (isAbortedError(err)) {
                    resolve()
                } else {
                    reject(new Error(`Error in watch stream for VPC: ${err.message}`))
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch VPC`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}

export const watchVPC = async (ns: NamespaceName, setVPC: React.Dispatch<React.SetStateAction<VPC | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const call = resourceWatchClient.watch({
                resourceType: ResourceType.VPC,
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
                        setVPC(JSON.parse(response.items[0]) as VPC)
                        break
                    }
                    case EventType.DELETED: {
                        setVPC(undefined)
                        break
                    }
                }
            })

            call.responses.onError((err: Error) => {
                if (!isAbortedError(err)) {
                    reject(new Error(`Error in watch stream for VPC: ${err.message}`))
                } else {
                    resolve()
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch VPC`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}

export const createVPC = async (vpc: VPC, setVPC?: React.Dispatch<React.SetStateAction<VPC | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<VPC> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.create({
            resourceType: ResourceType.VPC,
            data: JSON.stringify(vpc)
        })
        const output = JSON.parse(result.response.data) as VPC
        setVPC?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to create VPC [Name: ${vpc.metadata!.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const updateVPC = async (vpc: VPC, setVPC?: React.Dispatch<React.SetStateAction<VPC | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<VPC> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.update({
            resourceType: ResourceType.VPC,
            data: JSON.stringify(vpc)
        })
        const temp = JSON.parse(result.response.data) as VPC
        setVPC?.(temp)
        return temp
    } catch (err) {
        notification?.error({ message: `Failed to update VPC [Name: ${vpc.metadata!.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}
