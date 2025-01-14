import { getErrorMessage, isAbortedError } from "@/utils/utils"
import { defaultTimeout, resourceClient, resourceWatchClient, virtualMachineClient } from "./clients"
import { ListOptions } from "./ts/management/resource/v1alpha1/resource"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"
import { VirtualMachinePowerStateRequest_PowerState } from "./ts/management/virtualmachine/v1alpha1/virtualmachine"
import { components } from "./ts/openapi/openapi-schema"
import { NamespaceName, ResourceType } from "./ts/types/types"
import { namespaceNameKey } from "@/utils/k8s"
import { NotificationInstance } from "antd/lib/notification/interface"

export type VirtualMachine = components["schemas"]["v1VirtualMachine"]

// export const createVirtualMachine = async (vm: VirtualMachine): Promise<VirtualMachine> => {
//     return new Promise((resolve, reject) => {
//         const call = resourceClient.create({
//             resourceType: ResourceType.VIRTUAL_MACHINE,
//             data: JSON.stringify(vm)
//         })

//         call.then((result) => {
//             resolve(JSON.parse(result.response.data) as VirtualMachine)
//         })
//         call.response.catch((err: Error) => {
//             reject(new Error(`Failed to create virtual machine [Namespace: ${vm.metadata?.namespace}, Name: ${vm.metadata?.name}]: ${err.message}`))
//         })
//     })
// }

export const createVirtualMachine = async (vm: VirtualMachine, setVirtualMachine?: React.Dispatch<React.SetStateAction<VirtualMachine | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<VirtualMachine> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.create({
            resourceType: ResourceType.VIRTUAL_MACHINE,
            data: JSON.stringify(vm)
        })
        const output = JSON.parse(result.response.data) as VirtualMachine
        setVirtualMachine?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to create virtual machine [Namespace: ${vm.metadata!.namespace}, Name: ${vm.metadata!.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

// export const deleteVirtualMachines = async (vms: VirtualMachine[]): Promise<void> => {
//     const completed: VirtualMachine[] = []
//     const failed: { vm: VirtualMachine; error: any }[] = []

//     await Promise.all(vms.map(async (vm) => {
//         const namespace = vm.metadata?.namespace
//         const name = vm.metadata?.name
//         if (!namespace || !name) {
//             return
//         }
//         try {
//             await resourceClient.delete({ namespaceName: { namespace, name }, resourceType: ResourceType.VIRTUAL_MACHINE }).response
//             completed.push(vm)
//         } catch (err: any) {
//             failed.push({ vm, error: err })
//         }
//     }))

//     if (failed.length > 0) {
//         const errorMessages = failed.map(({ vm, error }) => `Namespace: ${vm.metadata?.namespace ?? "unknown"}, Name: ${vm.metadata?.name ?? "unknown"}, Error: ${error.message}`).join("\n")
//         Promise.reject(new Error(`Failed to delete the following virtual machines:\n${errorMessages}`))
//     }
// }

export const deleteVirtualMachines = async (vms: VirtualMachine[], setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        const completed: VirtualMachine[] = []
        const failed: { vm: VirtualMachine; error: any }[] = []

        await Promise.all(vms.map(async (vm) => {
            const namespace = vm.metadata!.namespace
            const name = vm.metadata!.name

            try {
                await resourceClient.delete({ namespaceName: { namespace, name }, resourceType: ResourceType.VIRTUAL_MACHINE }).response
                completed.push(vm)
            } catch (err: any) {
                failed.push({ vm, error: err })
            }
        }))

        if (failed.length > 0) {
            const errorMessages = failed.map(({ vm, error }) => `Namespace: ${vm.metadata?.namespace ?? "unknown"}, Name: ${vm.metadata?.name ?? "unknown"}, Error: ${error.message}`).join("\n")
            throw new Error(`Failed to delete the following virtual machines:\n${errorMessages}`)
        }
    } catch (err) {
        notification?.error({ message: `Failed to delete virtual machines:`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const deleteVirtualMachine = async (ns: NamespaceName, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        await resourceClient.delete({
            resourceType: ResourceType.VIRTUAL_MACHINE,
            namespaceName: ns
        })
    } catch (err) {
        notification?.error({ message: `Failed to delete virtual machine [Namespace: ${ns.namespace}, Name: ${ns.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

// export const getVirtualMachine = async (ns: NamespaceName): Promise<VirtualMachine> => {
//     return new Promise((resolve, reject) => {
//         const call = resourceClient.get({
//             resourceType: ResourceType.VIRTUAL_MACHINE,
//             namespaceName: ns
//         })
//         call.then((result) => {
//             resolve(JSON.parse(result.response.data) as VirtualMachine)
//         })
//         call.response.catch((err: Error) => {
//             reject(new Error(`Failed to get virtual machine [Namespace: ${ns.namespace}, Name: ${ns.name}]: ${err.message}`))
//         })
//     })
// }

export const getVirtualMachine = async (ns: NamespaceName, setVirtualMachine?: React.Dispatch<React.SetStateAction<VirtualMachine | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<VirtualMachine> => {
    setLoading?.(true)
    try {
        const call = await resourceClient.get({
            resourceType: ResourceType.VIRTUAL_MACHINE,
            namespaceName: ns
        })
        const vm = JSON.parse(call.response.data) as VirtualMachine
        setVirtualMachine?.(vm)
        return vm
    } catch (err) {
        notification?.error({ message: `Failed to get virtual machine [Namespace: ${ns.namespace}, Name: ${ns.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

// export const updateVirtualMachine = async (vm: VirtualMachine): Promise<VirtualMachine> => {
//     const namespace = vm.metadata?.namespace
//     const name = vm.metadata?.name
//     if (!namespace || !name) {
//         return vm
//     }

//     return new Promise((resolve, reject) => {
//         const call = resourceClient.update({
//             resourceType: ResourceType.VIRTUAL_MACHINE,
//             data: JSON.stringify(vm)
//         })

//         call.then((result) => {
//             resolve(JSON.parse(result.response.data))
//         })
//         call.response.catch((err: Error) => {
//             reject(new Error(`Failed to update virtual machine [Namespace: ${namespace}, Name: ${name}]: ${err.message}`))
//         })
//     })
// }

export const updateVirtualMachine = async (vm: VirtualMachine, setVirtualMachine?: React.Dispatch<React.SetStateAction<VirtualMachine | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<VirtualMachine> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.update({
            resourceType: ResourceType.VIRTUAL_MACHINE,
            data: JSON.stringify(vm)
        })
        const temp = JSON.parse(result.response.data) as VirtualMachine
        setVirtualMachine?.(temp)
        return temp
    } catch (err) {
        notification?.error({ message: `Failed to update virtual machine [Namespace: ${vm.metadata!.namespace}, Name: ${vm.metadata!.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

// export const listVirtualMachines = async (opts?: ListOptions): Promise<VirtualMachine[]> => {
//     return new Promise((resolve, reject) => {
//         const call = resourceClient.list({
//             resourceType: ResourceType.VIRTUAL_MACHINE,
//             options: ListOptions.create(opts)
//         })
//         call.then((result) => {
//             let items: VirtualMachine[] = []
//             result.response.items.forEach((item: string) => {
//                 items.push(JSON.parse(item) as VirtualMachine)
//             })
//             resolve(items)
//         })
//         call.response.catch((err: Error) => {
//             reject(new Error(`Failed to list virtual machine: ${err.message}`))
//         })
//     })
// }

export const listVirtualMachines = async (setVirtualMachines: React.Dispatch<React.SetStateAction<VirtualMachine[] | undefined>>, opts?: ListOptions, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<VirtualMachine[]> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.list({
            resourceType: ResourceType.VIRTUAL_MACHINE,
            options: ListOptions.create(opts)
        })
        let items: VirtualMachine[] = []
        result.response.items.forEach((item: string) => {
            items.push(JSON.parse(item) as VirtualMachine)
        })
        setVirtualMachines(items)
        return items
    } catch (err) {
        notification?.error({ message: `Failed to list virtual machines`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

// export const manageVirtualMachinePowerState = (ns: NamespaceName, state: VirtualMachinePowerStateRequest_PowerState): Promise<void> => {
//     return new Promise((resolve, reject) => {
//         const call = virtualMachineClient.virtualMachinePowerState({
//             namespaceName: ns,
//             powerState: state
//         })
//         call.response.then(() => {
//             resolve()
//         })
//         call.response.catch((err: Error) => {
//             reject(new Error(`Failed to change power state of virtual machine [Namespace: ${ns.namespace}, Name: ${ns.name}] to [State: ${state}]: ${err.message}`))
//         })
//     })
// }

export const manageVirtualMachinePowerState = async (ns: NamespaceName, state: VirtualMachinePowerStateRequest_PowerState, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        await virtualMachineClient.virtualMachinePowerState({
            namespaceName: ns,
            powerState: state
        })
    } catch (err) {
        notification?.error({ message: `Failed to change power state of virtual machine [Namespace: ${ns.namespace}, Name: ${ns.name}] to [State: ${state}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

// export const manageVirtualMachinesPowerState = async (vms: VirtualMachine[], state: VirtualMachinePowerStateRequest_PowerState): Promise<void> => {
//     const completed: VirtualMachine[] = []
//     const failed: { vm: VirtualMachine; error: any }[] = []

//     await Promise.all(vms.map(async (vm) => {
//         const namespace = vm.metadata?.namespace
//         const name = vm.metadata?.name
//         if (!namespace || !name) {
//             return
//         }

//         const isRunning = vm.status?.printableStatus as string === "Running"

//         if (state === VirtualMachinePowerStateRequest_PowerState.OFF && !isRunning) {
//             return
//         }
//         if (state === VirtualMachinePowerStateRequest_PowerState.ON && isRunning) {
//             return
//         }
//         if (state === VirtualMachinePowerStateRequest_PowerState.REBOOT && !isRunning) {
//             return
//         }

//         try {
//             await virtualMachineClient.virtualMachinePowerState({ namespaceName: { namespace, name }, powerState: state }).response
//             completed.push(vm)
//         } catch (err: any) {
//             failed.push({ vm, error: err })
//         }
//     }))

//     if (failed.length > 0) {
//         const errorMessages = failed.map(({ vm, error }) => `Namespace: ${vm.metadata?.namespace ?? "unknown"}, Name: ${vm.metadata?.name ?? "unknown"}, Error: ${error.message}`).join("\n")
//         Promise.reject(new Error(`Failed to change power state the following virtual machines:\n${errorMessages}`))
//     }
// }

export const manageVirtualMachinesPowerState = async (vms: VirtualMachine[], state: VirtualMachinePowerStateRequest_PowerState, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        const completed: VirtualMachine[] = []
        const failed: { vm: VirtualMachine; error: any }[] = []

        await Promise.all(vms.map(async (vm) => {
            const namespace = vm.metadata!.namespace
            const name = vm.metadata!.name

            const isRunning = vm.status?.printableStatus as string === "Running"

            if (state === VirtualMachinePowerStateRequest_PowerState.OFF && !isRunning) {
                return
            }
            if (state === VirtualMachinePowerStateRequest_PowerState.ON && isRunning) {
                return
            }
            if (state === VirtualMachinePowerStateRequest_PowerState.REBOOT && !isRunning) {
                return
            }
            try {
                await virtualMachineClient.virtualMachinePowerState({ namespaceName: { namespace, name }, powerState: state }).response
                completed.push(vm)
            } catch (err: any) {
                failed.push({ vm, error: err })
            }
        }))

        if (failed.length > 0) {
            const errorMessages = failed.map(({ vm, error }) => `Namespace: ${vm.metadata?.namespace ?? "unknown"}, Name: ${vm.metadata?.name ?? "unknown"}, Error: ${error.message}`).join("\n")
            throw new Error(`Failed to change power state the following virtual machines:\n${errorMessages}`)
        }
    } catch (err) {
        notification?.error({ message: `Failed to change power state of virtual machine to [State: ${state}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

// export const watchVirtualMachines = (setVirtualMachine: React.Dispatch<React.SetStateAction<VirtualMachine[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, opts?: WatchOptions): Promise<void> => {
//     return new Promise((resolve, reject) => {
//         setLoading(true)

//         const map = new Map<string, VirtualMachine>()

//         const call = resourceWatchClient.watch({
//             resourceType: ResourceType.VIRTUAL_MACHINE,
//             options: WatchOptions.create(opts)
//         }, { abort: abortSignal })

//         let timeoutId: NodeJS.Timeout | null = null
//         const updateVirtualMachine = () => {
//             if (map.size === 0 && timeoutId === null) {
//                 timeoutId = setTimeout(() => {
//                     const items = Array.from(map.values())
//                     setVirtualMachine(items.length > 0 ? items : undefined)
//                     timeoutId = null
//                 }, defaultTimeout)
//             } else {
//                 const items = Array.from(map.values())
//                 setVirtualMachine(items.length > 0 ? items : undefined)
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
//                         const vm = JSON.parse(data) as VirtualMachine
//                         map.set(namespaceNameKey(vm), vm)
//                     })
//                     break
//                 }
//                 case EventType.DELETED: {
//                     response.items.forEach((data) => {
//                         const vm = JSON.parse(data) as VirtualMachine
//                         map.delete(namespaceNameKey(vm))
//                     })
//                     break
//                 }
//             }
//             updateVirtualMachine()
//         })

//         call.responses.onError((err: Error) => {
//             setLoading(false)
//             if (isAbortedError(err)) {
//                 resolve()
//             } else {
//                 reject(new Error(`Error in watch stream for VirtualMachine: ${err.message}`))
//             }
//         })

//         call.responses.onComplete(() => {
//             setLoading(false)
//             resolve()
//         })
//     })
// }

export const watchVirtualMachines = async (setVirtualMachine: React.Dispatch<React.SetStateAction<VirtualMachine[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, opts?: WatchOptions, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const map = new Map<string, VirtualMachine>()

            const call = resourceWatchClient.watch({
                resourceType: ResourceType.VIRTUAL_MACHINE,
                options: WatchOptions.create(opts)
            }, { abort: abortSignal })

            let timeoutId: NodeJS.Timeout | null = null
            const updateVirtualMachine = () => {
                if (map.size === 0 && timeoutId === null) {
                    timeoutId = setTimeout(() => {
                        const items = Array.from(map.values())
                        setVirtualMachine(items.length > 0 ? items : undefined)
                        timeoutId = null
                    }, defaultTimeout)
                } else {
                    const items = Array.from(map.values())
                    setVirtualMachine(items.length > 0 ? items : undefined)
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
                            const vm = JSON.parse(data) as VirtualMachine
                            map.set(namespaceNameKey(vm), vm)
                        })
                        break
                    }
                    case EventType.DELETED: {
                        response.items.forEach((data) => {
                            const vm = JSON.parse(data) as VirtualMachine
                            map.delete(namespaceNameKey(vm))
                        })
                        break
                    }
                }
                updateVirtualMachine()
            })

            call.responses.onError((err: Error) => {
                if (!isAbortedError(err)) {
                    reject(new Error(`Error in watch stream for VirtualMachine: ${err.message}`))
                } else {
                    resolve()
                }
            })
            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch virtual machines`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}

// export const watchVirtualMachine = (ns: NamespaceName, setVirtualMachine: React.Dispatch<React.SetStateAction<VirtualMachine | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal): Promise<void> => {
//     return new Promise((resolve, reject) => {
//         setLoading(true)

//         const call = resourceWatchClient.watch({
//             resourceType: ResourceType.VIRTUAL_MACHINE,
//             options: WatchOptions.create({
//                 fieldSelectorGroup: {
//                     operator: "&&",
//                     fieldSelectors: [
//                         { fieldPath: "metadata.namespace", operator: "=", values: [ns.namespace] },
//                         { fieldPath: "metadata.name", operator: "=", values: [ns.name] }
//                     ]
//                 }
//             })
//         }, { abort: abortSignal })

//         call.responses.onMessage((response) => {
//             switch (response.eventType) {
//                 case EventType.READY: {
//                     setLoading(false)
//                     break
//                 }
//                 case EventType.ADDED:
//                 case EventType.MODIFIED: {
//                     if (response.items.length === 0) {
//                         return
//                     }
//                     setVirtualMachine(JSON.parse(response.items[0]) as VirtualMachine)
//                     break
//                 }
//                 case EventType.DELETED: {
//                     setVirtualMachine(undefined)
//                     break
//                 }
//             }
//         })

//         call.responses.onError((err: Error) => {
//             setLoading(false)
//             if (isAbortedError(err)) {
//                 resolve()
//             } else {
//                 reject(new Error(`Error in watch stream for VirtualMachine: ${err.message}`))
//             }
//         })

//         call.responses.onComplete(() => {
//             setLoading(false)
//             resolve()
//         })
//     })
// }

export const watchVirtualMachine = async (ns: NamespaceName, setVirtualMachine: React.Dispatch<React.SetStateAction<VirtualMachine | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    try {
        await new Promise<void>((resolve, reject) => {
            const call = resourceWatchClient.watch({
                resourceType: ResourceType.VIRTUAL_MACHINE,
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
                        setVirtualMachine(JSON.parse(response.items[0]) as VirtualMachine)
                        break
                    }
                    case EventType.DELETED: {
                        setVirtualMachine(undefined)
                        break
                    }
                }
            })

            call.responses.onError((err: Error) => {
                if (!isAbortedError(err)) {
                    reject(new Error(`Error in watch stream for VirtualMachine: ${err.message}`))
                } else {
                    resolve()
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch virtual machine`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}
