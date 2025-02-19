import { NotificationInstance } from "antd/lib/notification/interface"
import { defaultTimeout, resourceClient, resourceWatchClient } from "./clients"
import { NamespaceName, ResourceType } from "./ts/types/types"
import { getErrorMessage, isAbortedError, resourceSort } from "@/utils/utils"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"
import { namespaceNameKey } from "@/utils/k8s"

export interface VirtualMachineClone {
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
        source: {
            apiGroup: string
            kind: string
            name: string
        },
        target: {
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

export const createClone = async (clone: VirtualMachineClone, setClone?: React.Dispatch<React.SetStateAction<VirtualMachineClone | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<VirtualMachineClone> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.create({
            resourceType: ResourceType.VIRTUAL_MACHINE_CLONE,
            data: JSON.stringify(clone)
        })
        const output = JSON.parse(result.response.data) as VirtualMachineClone
        setClone?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to create VirtualMachineClone [Namespace: ${clone.metadata.namespace}, Name: ${clone.metadata.name || clone.metadata.generateName}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const deleteClone = async (ns: NamespaceName, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        await resourceClient.delete({
            resourceType: ResourceType.VIRTUAL_MACHINE_CLONE,
            namespaceName: ns
        })
    } catch (err) {
        notification?.error({ message: `Failed to delete VirtualMachineClone [Namespace: ${ns.namespace}, Name: ${ns.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const watchVirtualMachineClones = async (setVirtualMachineClones: React.Dispatch<React.SetStateAction<VirtualMachineClone[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, opts?: WatchOptions, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const map = new Map<string, VirtualMachineClone>()

            const call = resourceWatchClient.watch({
                resourceType: ResourceType.VIRTUAL_MACHINE_CLONE,
                options: WatchOptions.create(opts)
            }, { abort: abortSignal })

            let timeoutId: NodeJS.Timeout | null = null
            const updateVirtualMachineClones = () => {
                if (map.size === 0 && timeoutId === null) {
                    timeoutId = setTimeout(() => {
                        const items = resourceSort(Array.from(map.values()))
                        setVirtualMachineClones(items.length > 0 ? items : undefined)
                        timeoutId = null
                    }, defaultTimeout)
                } else {
                    const items = resourceSort(Array.from(map.values()))
                    setVirtualMachineClones(items.length > 0 ? items : undefined)
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
                            const snapshot = JSON.parse(data) as VirtualMachineClone
                            map.set(namespaceNameKey(snapshot), snapshot)
                        })
                        break
                    }
                    case EventType.DELETED: {
                        response.items.forEach((data) => {
                            const clone = JSON.parse(data) as VirtualMachineClone
                            map.delete(namespaceNameKey(clone))
                        })
                        break
                    }
                }
                updateVirtualMachineClones()
            })

            call.responses.onError((err: Error) => {
                if (isAbortedError(err)) {
                    resolve()
                } else {
                    reject(new Error(`Error in watch stream for VirtualMachineClone: ${err.message}`))
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch VirtualMachineClone`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}
