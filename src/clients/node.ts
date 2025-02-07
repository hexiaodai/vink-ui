import { NotificationInstance } from "antd/lib/notification/interface"
import { defaultTimeout, resourceWatchClient } from "./clients"
import { ResourceType } from "./ts/types/types"
import { getErrorMessage, isAbortedError, resourceSort } from "@/utils/utils"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"
import { namespaceNameKey } from "@/utils/k8s"

export interface Node {
    metadata: {
        name: string
        namespace: string
        creationTimestamp: string
    }
    spec?: {
    }
    status?: {
        addresses?: {
            address: string
            type: string
        }[]
        capacity?: {
            [key: string]: string
        }
        allocatable?: {
            [key: string]: string
        }
        conditions?: {
            status: string
            type: string
        }[]
    }
}

export const watchNodes = async (setNodes: React.Dispatch<React.SetStateAction<Node[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, opts?: WatchOptions, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const map = new Map<string, Node>()

            const call = resourceWatchClient.watch({
                resourceType: ResourceType.NODE,
                options: WatchOptions.create(opts)
            }, { abort: abortSignal })

            let timeoutId: NodeJS.Timeout | null = null
            const updateNodes = () => {
                if (map.size === 0 && timeoutId === null) {
                    timeoutId = setTimeout(() => {
                        const items = resourceSort(Array.from(map.values()))
                        setNodes(items.length > 0 ? items : undefined)
                        timeoutId = null
                    }, defaultTimeout)
                } else {
                    const items = resourceSort(Array.from(map.values()))
                    setNodes(items.length > 0 ? items : undefined)
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
                            const node = JSON.parse(data) as Node
                            map.set(namespaceNameKey(node), node)
                        })
                        break
                    }
                    case EventType.DELETED: {
                        response.items.forEach((data) => {
                            const node = JSON.parse(data) as Node
                            map.delete(namespaceNameKey(node))
                        })
                        break
                    }
                }
                updateNodes()
            })

            call.responses.onError((err: Error) => {
                if (isAbortedError(err)) {
                    resolve()
                } else {
                    reject(new Error(`Error in watch stream for Node: ${err.message}`))
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch Node`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}
