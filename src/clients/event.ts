import { defaultTimeout, resourceWatchClient } from "./clients"
import { NamespaceName, ResourceType } from "./ts/types/types"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"
import { namespaceNameKey } from "@/utils/k8s"
import { getErrorMessage, isAbortedError } from "@/utils/utils"
import { NotificationInstance } from "antd/lib/notification/interface"

// export const watchVirtualMachineEvents = (ns: NamespaceName, setEvents: React.Dispatch<React.SetStateAction<any[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal): Promise<void> => {
//     return new Promise((resolve, reject) => {
//         setLoading(true)

//         const map = new Map<string, any>()

//         const call = resourceWatchClient.watch({
//             resourceType: ResourceType.EVENT,
//             options: WatchOptions.create({
//                 fieldSelectorGroup: {
//                     operator: "&&",
//                     fieldSelectors: [
//                         {
//                             fieldPath: "involvedObject.namespace",
//                             operator: "=",
//                             values: [ns.namespace]
//                         },
//                         {
//                             fieldPath: "involvedObject.kind",
//                             operator: "~=",
//                             values: ["VirtualMachine", "VirtualMachineInstance", "Pod"]
//                         },
//                         {
//                             fieldPath: "involvedObject.name",
//                             operator: "=",
//                             values: [ns.name]
//                         }
//                     ]
//                 }
//             })
//         }, { abort: abortSignal })

//         let timeoutId: NodeJS.Timeout | null = null
//         const updateEvents = () => {
//             if (map.size === 0 && timeoutId === null) {
//                 timeoutId = setTimeout(() => {
//                     const items = Array.from(map.values()).sort((a: any, b: any) => {
//                         return new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
//                     })
//                     setEvents(items.length > 0 ? items : undefined)
//                     timeoutId = null
//                 }, defaultTimeout)
//             } else {
//                 const items = Array.from(map.values()).sort((a: any, b: any) => {
//                     return new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
//                 })
//                 setEvents(items.length > 0 ? items : undefined)
//                 if (timeoutId !== null) {
//                     clearTimeout(timeoutId)
//                     timeoutId = null
//                 }
//             }
//         }

//         call.responses.onMessage((response) => {
//             switch (response.eventType) {
//                 case EventType.READY: {
//                     setLoading(false)
//                     break
//                 }
//                 case EventType.ADDED:
//                 case EventType.MODIFIED: {
//                     response.items.forEach((data) => {
//                         const e = JSON.parse(data)
//                         map.set(namespaceNameKey(e), e)
//                     })
//                     break
//                 }
//                 case EventType.DELETED: {
//                     response.items.forEach((data) => {
//                         const vm = JSON.parse(data)
//                         map.delete(namespaceNameKey(vm))
//                     })
//                     break
//                 }
//             }
//             updateEvents()
//         })

//         call.responses.onError((err: Error) => {
//             setLoading(false)
//             if (isAbortedError(err)) {
//                 resolve()
//             } else {
//                 reject(new Error(`Error in watch stream for Event: ${err.message}`))
//             }
//         })

//         call.responses.onComplete(() => {
//             setLoading(false)
//             resolve()
//         })
//     })
// }

export const watchVirtualMachineEvents = async (ns: NamespaceName, setEvents: React.Dispatch<React.SetStateAction<any[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const map = new Map<string, any>()

            const call = resourceWatchClient.watch({
                resourceType: ResourceType.EVENT,
                options: WatchOptions.create({
                    fieldSelectorGroup: {
                        operator: "&&",
                        fieldSelectors: [
                            {
                                fieldPath: "involvedObject.namespace",
                                operator: "=",
                                values: [ns.namespace]
                            },
                            {
                                fieldPath: "involvedObject.kind",
                                operator: "~=",
                                values: ["VirtualMachine", "VirtualMachineInstance", "Pod"]
                            },
                            {
                                fieldPath: "involvedObject.name",
                                operator: "=",
                                values: [ns.name]
                            }
                        ]
                    }
                })
            }, { abort: abortSignal })

            let timeoutId: NodeJS.Timeout | null = null
            const updateEvents = () => {
                if (map.size === 0 && timeoutId === null) {
                    timeoutId = setTimeout(() => {
                        const items = Array.from(map.values()).sort((a: any, b: any) => {
                            return new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
                        })
                        setEvents(items.length > 0 ? items : undefined)
                        timeoutId = null
                    }, defaultTimeout)
                } else {
                    const items = Array.from(map.values()).sort((a: any, b: any) => {
                        return new Date(b.lastTimestamp).getTime() - new Date(a.lastTimestamp).getTime()
                    })
                    setEvents(items.length > 0 ? items : undefined)
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
                            const e = JSON.parse(data)
                            map.set(namespaceNameKey(e), e)
                        })
                        break
                    }
                    case EventType.DELETED: {
                        response.items.forEach((data) => {
                            const vm = JSON.parse(data)
                            map.delete(namespaceNameKey(vm))
                        })
                        break
                    }
                }
                updateEvents()
            })

            call.responses.onError((err: Error) => {
                if (isAbortedError(err)) {
                    resolve()
                } else {
                    reject(new Error(`Error in watch stream for Event: ${err.message}`))
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch events [Namespace: ${ns.namespace}, Name: ${ns.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}
