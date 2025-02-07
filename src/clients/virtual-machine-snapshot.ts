import { NotificationInstance } from "antd/lib/notification/interface"
import { defaultTimeout, resourceClient, resourceWatchClient } from "./clients"
import { NamespaceName, ResourceType } from "./ts/types/types"
import { getErrorMessage, isAbortedError, resourceSort } from "@/utils/utils"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"
import { namespaceNameKey } from "@/utils/k8s"

export interface VirtualMachineSnapshot {
    apiVersion: string
    kind: string
    metadata: {
        name?: string
        namespace?: string
        generateName?: string
        creationTimestamp?: string
    }
    spec?: {
        source: {
            apiGroup: string
            kind: string
            name: string
        }
    }
    status?: {
        conditions?: {
            status: string
            type: string
        }[]
    }
}

export const watchVirtualMachineSnapshots = async (setVirtualMachineSnapshots: React.Dispatch<React.SetStateAction<VirtualMachineSnapshot[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, opts?: WatchOptions, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const map = new Map<string, VirtualMachineSnapshot>()

            const call = resourceWatchClient.watch({
                resourceType: ResourceType.VIRTUAL_MACHINE_SNAPSHOT,
                options: WatchOptions.create(opts)
            }, { abort: abortSignal })

            let timeoutId: NodeJS.Timeout | null = null
            const updateVirtualMachineSnapshots = () => {
                if (map.size === 0 && timeoutId === null) {
                    timeoutId = setTimeout(() => {
                        const items = resourceSort(Array.from(map.values()))
                        setVirtualMachineSnapshots(items.length > 0 ? items : undefined)
                        timeoutId = null
                    }, defaultTimeout)
                } else {
                    const items = resourceSort(Array.from(map.values()))
                    setVirtualMachineSnapshots(items.length > 0 ? items : undefined)
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
                            const snapshot = JSON.parse(data) as VirtualMachineSnapshot
                            map.set(namespaceNameKey(snapshot), snapshot)
                        })
                        break
                    }
                    case EventType.DELETED: {
                        response.items.forEach((data) => {
                            const snapshot = JSON.parse(data) as VirtualMachineSnapshot
                            map.delete(namespaceNameKey(snapshot))
                        })
                        break
                    }
                }
                updateVirtualMachineSnapshots()
            })

            call.responses.onError((err: Error) => {
                if (isAbortedError(err)) {
                    resolve()
                } else {
                    reject(new Error(`Error in watch stream for VirtualMachineSnapshot: ${err.message}`))
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch VirtualMachineSnapshot`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}

export const deleteSnapshot = async (ns: NamespaceName, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        await resourceClient.delete({
            resourceType: ResourceType.VIRTUAL_MACHINE_SNAPSHOT,
            namespaceName: ns
        })
    } catch (err) {
        notification?.error({ message: `Failed to delete VirtualMachineSnapshot [Name: ${ns.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const createSnapshot = async (snapshot: VirtualMachineSnapshot, setSnapshot?: React.Dispatch<React.SetStateAction<VirtualMachineSnapshot | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<VirtualMachineSnapshot> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.create({
            resourceType: ResourceType.VIRTUAL_MACHINE_SNAPSHOT,
            data: JSON.stringify(snapshot)
        })
        const output = JSON.parse(result.response.data) as VirtualMachineSnapshot
        setSnapshot?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to create VirtualMachineSnapshot [Namespace: ${snapshot.metadata!.namespace}, Name: ${snapshot.metadata!.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}
