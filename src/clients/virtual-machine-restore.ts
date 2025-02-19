import { NotificationInstance } from "antd/lib/notification/interface"
import { defaultTimeout, resourceClient, resourceWatchClient } from "./clients"
import { NamespaceName, ResourceType } from "./ts/types/types"
import { getErrorMessage, isAbortedError, resourceSort } from "@/utils/utils"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"
import { namespaceNameKey } from "@/utils/k8s"
import { ListOptions } from "./ts/management/resource/v1alpha1/resource"

export interface VirtualMachineRestore {
    apiVersion: string
    kind: string
    metadata: {
        name?: string
        namespace?: string
        generateName?: string
        creationTimestamp?: string
        annotations?: {
            [key: string]: string
        }
    }
    spec?: {
        target: {
            apiGroup: string
            kind: string
            name: string
        }
        virtualMachineSnapshotName: string
    }
    status?: {
        complete: boolean
        conditions?: {
            status: string
            type: string
        }[]
    }
}

export const listVirtualMachineRestores = async (setVirtualMachineRestores?: React.Dispatch<React.SetStateAction<VirtualMachineRestore[] | undefined>>, opts?: ListOptions, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<VirtualMachineRestore[]> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.list({
            resourceType: ResourceType.VIRTUAL_MACHINE_RESTORE,
            options: ListOptions.create(opts)
        })
        let items: VirtualMachineRestore[] = []
        result.response.items.forEach((item: string) => {
            items.push(JSON.parse(item) as VirtualMachineRestore)
        })
        setVirtualMachineRestores?.(items.length > 0 ? items : undefined)
        return items
    } catch (err) {
        notification?.error({ message: `Failed to list VirtualMachineRestore`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const deleteRestore = async (ns: NamespaceName, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        await resourceClient.delete({
            resourceType: ResourceType.VIRTUAL_MACHINE_RESTORE,
            namespaceName: ns
        })
    } catch (err) {
        notification?.error({ message: `Failed to delete VirtualMachineRestore [Name: ${ns.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const createRestore = async (restore: VirtualMachineRestore, setRestore?: React.Dispatch<React.SetStateAction<VirtualMachineRestore | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<VirtualMachineRestore> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.create({
            resourceType: ResourceType.VIRTUAL_MACHINE_RESTORE,
            data: JSON.stringify(restore)
        })
        const output = JSON.parse(result.response.data) as VirtualMachineRestore
        setRestore?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to create VirtualMachineRestore [Namespace: ${restore.metadata!.namespace}, Name: ${restore.metadata!.name || restore.metadata!.generateName}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}


export const watchVirtualMachineRestores = async (setVirtualMachineRestores: React.Dispatch<React.SetStateAction<VirtualMachineRestore[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, opts?: WatchOptions, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const map = new Map<string, VirtualMachineRestore>()

            const call = resourceWatchClient.watch({
                resourceType: ResourceType.VIRTUAL_MACHINE_RESTORE,
                options: WatchOptions.create(opts)
            }, { abort: abortSignal })

            let timeoutId: NodeJS.Timeout | null = null
            const updateVirtualMachineRestores = () => {
                if (map.size === 0 && timeoutId === null) {
                    timeoutId = setTimeout(() => {
                        const items = resourceSort(Array.from(map.values()))
                        setVirtualMachineRestores(items.length > 0 ? items : undefined)
                        timeoutId = null
                    }, defaultTimeout)
                } else {
                    const items = resourceSort(Array.from(map.values()))
                    setVirtualMachineRestores(items.length > 0 ? items : undefined)
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
                            const restore = JSON.parse(data) as VirtualMachineRestore
                            map.set(namespaceNameKey(restore), restore)
                        })
                        break
                    }
                    case EventType.DELETED: {
                        response.items.forEach((data) => {
                            const restore = JSON.parse(data) as VirtualMachineRestore
                            map.delete(namespaceNameKey(restore))
                        })
                        break
                    }
                }
                updateVirtualMachineRestores()
            })

            call.responses.onError((err: Error) => {
                if (isAbortedError(err)) {
                    resolve()
                } else {
                    reject(new Error(`Error in watch stream for VirtualMachineRestore: ${err.message}`))
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch VirtualMachineRestore`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}
