import { isAbortedError } from "@/utils/utils"
import { defaultTimeout, resourceClient, resourceWatchClient, virtualMachineClient } from "./clients"
import { ListOptions } from "./ts/management/resource/v1alpha1/resource"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"
import { VirtualMachinePowerStateRequest_PowerState } from "./ts/management/virtualmachine/v1alpha1/virtualmachine"
import { components } from "./ts/openapi/openapi-schema"
import { NamespaceName, ResourceType } from "./ts/types/types"
import { namespaceNameKey } from "@/utils/k8s"

export type VirtualMachine = components["schemas"]["v1VirtualMachine"]

export const createVirtualMachine = async (vm: VirtualMachine): Promise<VirtualMachine> => {
    return new Promise((resolve, reject) => {
        const call = resourceClient.create({
            resourceType: ResourceType.VIRTUAL_MACHINE,
            data: JSON.stringify(vm)
        })

        call.then((result) => {
            resolve(JSON.parse(result.response.data) as VirtualMachine)
        })
        call.response.catch((err: Error) => {
            reject(new Error(`Failed to create virtual machine [Namespace: ${vm.metadata?.namespace}, Name: ${vm.metadata?.name}]: ${err.message}`))
        })
    })
}

export const deleteVirtualMachines = async (vms: VirtualMachine[]): Promise<void> => {
    const completed: VirtualMachine[] = []
    const failed: { vm: VirtualMachine; error: any }[] = []

    await Promise.all(vms.map(async (vm) => {
        const namespace = vm.metadata?.namespace
        const name = vm.metadata?.name
        if (!namespace || !name) {
            return
        }
        try {
            await resourceClient.delete({ namespaceName: { namespace, name }, resourceType: ResourceType.VIRTUAL_MACHINE }).response
            completed.push(vm)
        } catch (err: any) {
            failed.push({ vm, error: err })
        }
    }))

    if (failed.length > 0) {
        const errorMessages = failed.map(({ vm, error }) => `Namespace: ${vm.metadata?.namespace ?? "unknown"}, Name: ${vm.metadata?.name ?? "unknown"}, Error: ${error.message}`).join("\n")
        Promise.reject(new Error(`Failed to delete the following virtual machines:\n${errorMessages}`))
    }
}

export const deleteVirtualMachine = async (ns: NamespaceName): Promise<void> => {
    return new Promise((resolve, reject) => {
        const call = resourceClient.delete({
            resourceType: ResourceType.VIRTUAL_MACHINE,
            namespaceName: ns
        })

        call.then(() => {
            resolve()
        })
        call.response.catch((err: Error) => {
            reject(new Error(`Failed to delete virtual machine [Namespace: ${ns.namespace}, Name: ${ns.name}]: ${err.message}`))
        })
    })
}

export const getVirtualMachine = async (ns: NamespaceName): Promise<VirtualMachine> => {
    return new Promise((resolve, reject) => {
        const call = resourceClient.get({
            resourceType: ResourceType.VIRTUAL_MACHINE,
            namespaceName: ns
        })
        call.then((result) => {
            resolve(JSON.parse(result.response.data) as VirtualMachine)
        })
        call.response.catch((err: Error) => {
            reject(new Error(`Failed to get virtual machine [Namespace: ${ns.namespace}, Name: ${ns.name}]: ${err.message}`))
        })
    })
}

export const updateVirtualMachine = async (vm: VirtualMachine): Promise<VirtualMachine> => {
    const namespace = vm.metadata?.namespace
    const name = vm.metadata?.name
    if (!namespace || !name) {
        return vm
    }

    return new Promise((resolve, reject) => {
        const call = resourceClient.update({
            resourceType: ResourceType.VIRTUAL_MACHINE,
            data: JSON.stringify(vm)
        })

        call.then((result) => {
            resolve(JSON.parse(result.response.data))
        })
        call.response.catch((err: Error) => {
            reject(new Error(`Failed to update virtual machine [Namespace: ${namespace}, Name: ${name}]: ${err.message}`))
        })
    })
}

export const listVirtualMachines = async (opts?: ListOptions): Promise<VirtualMachine[]> => {
    return new Promise((resolve, reject) => {
        const call = resourceClient.list({
            resourceType: ResourceType.VIRTUAL_MACHINE,
            options: ListOptions.create(opts)
        })
        call.then((result) => {
            let items: VirtualMachine[] = []
            result.response.items.forEach((item: string) => {
                items.push(JSON.parse(item) as VirtualMachine)
            })
            resolve(items)
        })
        call.response.catch((err: Error) => {
            reject(new Error(`Failed to list virtual machine: ${err.message}`))
        })
    })
}

export const manageVirtualMachinePowerState = (ns: NamespaceName, state: VirtualMachinePowerStateRequest_PowerState): Promise<void> => {
    return new Promise((resolve, reject) => {
        const call = virtualMachineClient.virtualMachinePowerState({
            namespaceName: ns,
            powerState: state
        })
        call.response.then(() => {
            resolve()
        })
        call.response.catch((err: Error) => {
            reject(new Error(`Failed to change power state of virtual machine [Namespace: ${ns.namespace}, Name: ${ns.name}] to [State: ${state}]: ${err.message}`))
        })
    })
}

export const manageVirtualMachinesPowerState = async (vms: VirtualMachine[], state: VirtualMachinePowerStateRequest_PowerState): Promise<void> => {
    const completed: VirtualMachine[] = []
    const failed: { vm: VirtualMachine; error: any }[] = []

    await Promise.all(vms.map(async (vm) => {
        const namespace = vm.metadata?.namespace
        const name = vm.metadata?.name
        if (!namespace || !name) {
            return
        }

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
        Promise.reject(new Error(`Failed to change power state the following virtual machines:\n${errorMessages}`))
    }
}

export const watchVirtualMachines = (setVirtualMachine: React.Dispatch<React.SetStateAction<VirtualMachine[] | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal, opts?: WatchOptions): Promise<void> => {
    return new Promise((resolve, reject) => {
        setLoading(true)

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
                    setLoading(false)
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
            setLoading(false)
            if (isAbortedError(err)) {
                resolve()
            } else {
                reject(new Error(`Error in watch stream for VirtualMachine: ${err.message}`))
            }
        })

        call.responses.onComplete(() => {
            setLoading(false)
            resolve()
        })
    })
}

export const watchVirtualMachine = (ns: NamespaceName, setVirtualMachine: React.Dispatch<React.SetStateAction<VirtualMachine | undefined>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>, abortSignal: AbortSignal): Promise<void> => {
    return new Promise((resolve, reject) => {
        setLoading(true)

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
                    setLoading(false)
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
            setLoading(false)
            if (isAbortedError(err)) {
                resolve()
            } else {
                reject(new Error(`Error in watch stream for VirtualMachine: ${err.message}`))
            }
        })

        call.responses.onComplete(() => {
            setLoading(false)
            resolve()
        })
    })
}
