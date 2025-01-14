import { NotificationInstance } from "antd/lib/notification/interface"
import { defaultTimeout, resourceWatchClient } from "./clients"
import { ResourceType } from "./ts/types/types"
import { getErrorMessage, isAbortedError } from "@/utils/utils"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"
import { namespaceNameKey } from "@/utils/k8s"

export interface Namespace {
    metadata: {
        name: string
    }
}

export const watchNamespaces = async (setNamespaces: React.Dispatch<React.SetStateAction<Namespace[] | undefined>>, abortSignal: AbortSignal, opts?: WatchOptions, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const map = new Map<string, Namespace>()

            const call = resourceWatchClient.watch({
                resourceType: ResourceType.NAMESPACE,
                options: WatchOptions.create(opts)
            }, { abort: abortSignal })

            let timeoutId: NodeJS.Timeout | null = null
            const updateNamespaces = () => {
                if (map.size === 0 && timeoutId === null) {
                    timeoutId = setTimeout(() => {
                        const items = Array.from(map.values())
                        setNamespaces(items.length > 0 ? items : undefined)
                        timeoutId = null
                    }, defaultTimeout)
                } else {
                    const items = Array.from(map.values())
                    setNamespaces(items.length > 0 ? items : undefined)
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
                            const ns = JSON.parse(data) as Namespace
                            map.set(namespaceNameKey(ns), ns)
                        })
                        break
                    }
                    case EventType.DELETED: {
                        response.items.forEach((data) => {
                            const ns = JSON.parse(data) as Namespace
                            map.delete(namespaceNameKey(ns))
                        })
                        break
                    }
                }
                updateNamespaces()
            })

            call.responses.onError((err: Error) => {
                if (isAbortedError(err)) {
                    resolve()
                } else {
                    reject(new Error(`Error in watch stream for Namespace: ${err.message}`))
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch Namespace`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}
