import { defaultTimeout, resourceClient, resourceWatchClient } from "./clients"
import { ListOptions } from "./ts/management/resource/v1alpha1/resource"
import { components } from "./ts/openapi/openapi-schema"
import { NamespaceName, ResourceType } from "./ts/types/types"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"
import { namespaceNameKey } from "@/utils/k8s"
import { getErrorMessage, isAbortedError } from "@/utils/utils"
import { VirtualMachine } from "./virtual-machine"
import { NotificationInstance } from "antd/lib/notification/interface"

export type DataVolume = components["schemas"]["v1beta1DataVolume"]

// export const getDataVolume = async (ns: NamespaceName): Promise<DataVolume> => {
//     return new Promise((resolve, reject) => {
//         const call = resourceClient.get({
//             resourceType: ResourceType.DATA_VOLUME,
//             namespaceName: ns
//         })
//         call.then((result) => {
//             resolve(JSON.parse(result.response.data) as DataVolume)
//         })
//         call.response.catch((err: Error) => {
//             reject(new Error(`Failed to get data volume [Namespace: ${ns.namespace}, Name: ${ns.name}]: ${err.message}`))
//         })
//     })
// }

export const getDataVolume = async (ns: NamespaceName, setDataVolume?: React.Dispatch<React.SetStateAction<DataVolume | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<DataVolume> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.get({
            resourceType: ResourceType.DATA_VOLUME,
            namespaceName: ns
        })
        const output = JSON.parse(result.response.data) as DataVolume
        setDataVolume?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to get DataVolume [Namespace: ${ns.namespace}, Name: ${ns.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

// export const listDataVolumes = async (opts?: ListOptions): Promise<DataVolume[]> => {
//     return new Promise((resolve, reject) => {
//         const call = resourceClient.list({
//             resourceType: ResourceType.DATA_VOLUME,
//             options: ListOptions.create(opts)
//         })
//         call.then((result) => {
//             let items: DataVolume[] = []
//             result.response.items.forEach((item: string) => {
//                 items.push(JSON.parse(item) as DataVolume)
//             })
//             resolve(items)
//         })
//         call.response.catch((err: Error) => {
//             reject(new Error(`Failed to list data volume: ${err.message}`))
//         })
//     })
// }

export const listDataVolumes = async (setDataVolumes?: React.Dispatch<React.SetStateAction<DataVolume[] | undefined>>, opts?: ListOptions, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<DataVolume[]> => {
    try {
        const result = await resourceClient.list({
            resourceType: ResourceType.DATA_VOLUME,
            options: ListOptions.create(opts)
        })
        let items: DataVolume[] = []
        result.response.items.forEach((item: string) => {
            items.push(JSON.parse(item) as DataVolume)
        })
        setDataVolumes?.(items)
        return items
    } catch (err) {
        notification?.error({ message: `Failed to list DataVolumes`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

// export const watchDataVolumes = (setDataVolumes: React.Dispatch<React.SetStateAction<DataVolume[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, opts?: WatchOptions): Promise<void> => {
//     return new Promise((resolve, reject) => {
//         setLoading(true)

//         const map = new Map<string, DataVolume>()

//         const call = resourceWatchClient.watch({
//             resourceType: ResourceType.DATA_VOLUME,
//             options: WatchOptions.create(opts)
//         }, { abort: abortSignal })

//         let timeoutId: NodeJS.Timeout | null = null
//         const updateVirtualMachineSummarys = () => {
//             if (map.size === 0 && timeoutId === null) {
//                 timeoutId = setTimeout(() => {
//                     const items = Array.from(map.values())
//                     setDataVolumes(items.length > 0 ? items : undefined)
//                     timeoutId = null
//                 }, defaultTimeout)
//             } else {
//                 const items = Array.from(map.values())
//                 setDataVolumes(items.length > 0 ? items : undefined)
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
//                         const vm = JSON.parse(data) as DataVolume
//                         map.set(namespaceNameKey(vm), vm)
//                     })
//                     break
//                 }
//                 case EventType.DELETED: {
//                     response.items.forEach((data) => {
//                         const vm = JSON.parse(data) as DataVolume
//                         map.delete(namespaceNameKey(vm))
//                     })
//                     break
//                 }
//             }
//             updateVirtualMachineSummarys()
//         })

//         call.responses.onError((err: Error) => {
//             setLoading(false)
//             if (isAbortedError(err)) {
//                 resolve()
//             } else {
//                 reject(new Error(`Error in watch stream for DataVolume: ${err.message}`))
//             }
//         })

//         call.responses.onComplete(() => {
//             setLoading(false)
//             resolve()
//         })
//     })
// }

export const watchDataVolumes = async (setDataVolumes: React.Dispatch<React.SetStateAction<DataVolume[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, opts?: WatchOptions, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const map = new Map<string, DataVolume>()

            const call = resourceWatchClient.watch({
                resourceType: ResourceType.DATA_VOLUME,
                options: WatchOptions.create(opts)
            }, { abort: abortSignal })

            let timeoutId: NodeJS.Timeout | null = null
            const updateVirtualMachineSummarys = () => {
                if (map.size === 0 && timeoutId === null) {
                    timeoutId = setTimeout(() => {
                        const items = Array.from(map.values())
                        setDataVolumes(items.length > 0 ? items : undefined)
                        timeoutId = null
                    }, defaultTimeout)
                } else {
                    const items = Array.from(map.values())
                    setDataVolumes(items.length > 0 ? items : undefined)
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
                            const vm = JSON.parse(data) as DataVolume
                            map.set(namespaceNameKey(vm), vm)
                        })
                        break
                    }
                    case EventType.DELETED: {
                        response.items.forEach((data) => {
                            const vm = JSON.parse(data) as DataVolume
                            map.delete(namespaceNameKey(vm))
                        })
                        break
                    }
                }
                updateVirtualMachineSummarys()
            })

            call.responses.onError((err: Error) => {
                if (isAbortedError(err)) {
                    resolve()
                } else {
                    reject(new Error(`Error in watch stream for DataVolume: ${err.message}`))
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch DataVolumes`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}

export const watchDataVolume = async (ns: NamespaceName, setDataVolume: React.Dispatch<React.SetStateAction<DataVolume | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const call = resourceWatchClient.watch({
                resourceType: ResourceType.DATA_VOLUME,
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
                        setDataVolume(JSON.parse(response.items[0]) as DataVolume)
                        break
                    }
                    case EventType.DELETED: {
                        setDataVolume(undefined)
                        break
                    }
                }
            })

            call.responses.onError((err: Error) => {
                if (!isAbortedError(err)) {
                    reject(new Error(`Error in watch stream for DataVolume: ${err.message}`))
                } else {
                    resolve()
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch data volume`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}

// export const getRootDisk = (setLoading: React.Dispatch<React.SetStateAction<boolean>>, vm: VirtualMachine): Promise<DataVolume> => {
//     return new Promise((resolve, reject) => {
//         const disks = vm.spec?.template?.spec?.domain?.devices?.disks
//         if (!disks || disks.length === 0) {
//             setLoading(false)
//             reject(new Error(`Failed to get root disk for VirtualMachine [Namespace: ${vm.metadata!.namespace}, Name: ${vm.metadata!.name}]: No disks found`))
//             return
//         }

//         let disk = disks.find((disk: any) => {
//             return disk.bootOrder === 1
//         })
//         if (!disk) {
//             disk = disks[0]
//         }

//         const volumes = vm.spec?.template?.spec?.volumes
//         if (!volumes || volumes.length === 0) {
//             setLoading(false)
//             reject(new Error(`Failed to get root disk for VirtualMachine [Namespace: ${vm.metadata!.namespace}, Name: ${vm.metadata!.name}]: No volumes found`))
//             return
//         }

//         const vol = volumes.find((vol: any) => {
//             return vol.name == disk.name
//         })
//         if (!vol) {
//             setLoading(false)
//             reject(new Error(`Failed to get root disk for VirtualMachine [Namespace: ${vm.metadata!.namespace}, Name: ${vm.metadata!.name}]: No volume found`))
//             return
//         }
//         getDataVolume({ namespace: vm.metadata!.namespace, name: vol.dataVolume!.name }).then(dv => {
//             resolve(dv)
//         }).catch(err => {
//             reject(new Error(`Failed to get root disk for VirtualMachine [Namespace: ${vm.metadata!.namespace}, Name: ${vm.metadata!.name}]: ${err.message}`))
//         }).finally(() => {
//             setLoading(false)
//         })
//     })
// }

export const getRootDisk = async (vm: VirtualMachine, setDataVolume?: React.Dispatch<React.SetStateAction<DataVolume | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<DataVolume> => {
    setLoading?.(false)
    try {
        const disks = vm.spec?.template?.spec?.domain?.devices?.disks
        if (!disks || disks.length === 0) {
            throw new Error(`Failed to get root disk for VirtualMachine [Namespace: ${vm.metadata!.namespace}, Name: ${vm.metadata!.name}]: No disks found`)
        }

        let disk = disks.find((disk: any) => {
            return disk.bootOrder === 1
        })
        if (!disk) {
            disk = disks[0]
        }

        const volumes = vm.spec?.template?.spec?.volumes
        if (!volumes || volumes.length === 0) {
            throw new Error(`Failed to get root disk for VirtualMachine [Namespace: ${vm.metadata!.namespace}, Name: ${vm.metadata!.name}]: No volumes found`)
        }

        const vol = volumes.find((vol: any) => {
            return vol.name == disk.name
        })
        if (!vol) {
            throw new Error(`Failed to get root disk for VirtualMachine [Namespace: ${vm.metadata!.namespace}, Name: ${vm.metadata!.name}]: No volume found`)
        }

        const result = await resourceClient.get({
            resourceType: ResourceType.DATA_VOLUME,
            namespaceName: { namespace: vm.metadata!.namespace, name: vol.dataVolume!.name }
        })
        const output = JSON.parse(result.response.data) as DataVolume
        setDataVolume?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to get root disk for VirtualMachine [Namespace: ${vm.metadata!.namespace}, Name: ${vm.metadata!.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}


export const deleteDataVolumes = async (dvs: DataVolume[], setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        const completed: DataVolume[] = []
        const failed: { dv: DataVolume; error: any }[] = []

        await Promise.all(dvs.map(async (dv) => {
            const namespace = dv.metadata!.namespace
            const name = dv.metadata!.name

            try {
                await resourceClient.delete({ namespaceName: { namespace, name }, resourceType: ResourceType.DATA_VOLUME }).response
                completed.push(dv)
            } catch (err: any) {
                failed.push({ dv, error: err })
            }
        }))

        if (failed.length > 0) {
            const errorMessages = failed.map(({ dv, error }) => `Namespace: ${dv.metadata?.namespace ?? "unknown"}, Name: ${dv.metadata?.name ?? "unknown"}, Error: ${error.message}`).join("\n")
            throw new Error(`Failed to delete the following data volumes:\n${errorMessages}`)
        }
    } catch (err) {
        notification?.error({ message: `Failed to delete data volumes:`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const deleteDataVolume = async (ns: NamespaceName, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        await resourceClient.delete({
            resourceType: ResourceType.DATA_VOLUME,
            namespaceName: ns
        })
    } catch (err) {
        notification?.error({ message: `Failed to delete data volume [Namespace: ${ns.namespace}, Name: ${ns.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const updateDataVolume = async (dv: DataVolume, setDataVolume?: React.Dispatch<React.SetStateAction<DataVolume | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<DataVolume> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.update({
            resourceType: ResourceType.DATA_VOLUME,
            data: JSON.stringify(dv)
        })
        const temp = JSON.parse(result.response.data) as DataVolume
        setDataVolume?.(temp)
        return temp
    } catch (err) {
        notification?.error({ message: `Failed to update data volume [Namespace: ${dv.metadata!.namespace}, Name: ${dv.metadata!.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const createDataVolume = async (dv: DataVolume, setDataVolume?: React.Dispatch<React.SetStateAction<DataVolume | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<DataVolume> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.create({
            resourceType: ResourceType.DATA_VOLUME,
            data: JSON.stringify(dv)
        })
        const output = JSON.parse(result.response.data) as DataVolume
        setDataVolume?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to create data volume [Namespace: ${dv.metadata!.namespace}, Name: ${dv.metadata!.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}
