import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport"
import { ResourceWatchManagementClient } from "@/clients/ts/management/resource/v1alpha1/watch.client"
import { VirtualMachineManagementClient } from "@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine.client"
import { ResourceManagementClient } from "@/clients/ts/management/resource/v1alpha1/resource.client"
import { FieldSelector, NamespaceName, ResourceType } from "@/clients/ts/types/types"
import { VirtualMachinePowerStateRequest_PowerState } from "@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine"
import { NotificationInstance } from "antd/es/notification/interface"
import { VirtualMachine } from "./virtual-machine"
import { DataVolume } from "./data-volume"
import { getErrorMessage, isAbortedError, resourceSort } from "@/utils/utils"
import { ListOptions } from "./ts/management/resource/v1alpha1/resource"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"
import { namespaceNameString } from "@/utils/k8s"
import { Node } from "./node"
import { Multus } from "./multus"
import { Subnet } from "./subnet"
import { VPC } from "./vpc"
import { Event } from "./event"
import { VLAN } from "./vlan"
import { ProviderNetwork } from "./provider-networks"
import { VirtualMachineClone } from "./virtual-machine-clone"
import { VirtualMachineSnapshot } from "./virtual-machine-snapshot"
import { VirtualMachineRestore } from "./virtual-machine-restore"

export const transport = new GrpcWebFetchTransport({
    baseUrl: window.location.origin
})

export const defaultTimeout = 0

export const resourceClient = new ResourceManagementClient(transport)
export const virtualMachineClient = new VirtualMachineManagementClient(transport)
export const resourceWatchClient = new ResourceWatchManagementClient(transport)

export const getResourceName = (type: ResourceType) => {
    return ResourceType[type]
}

export const getPowerStateName = (state: VirtualMachinePowerStateRequest_PowerState) => {
    return VirtualMachinePowerStateRequest_PowerState[state]
}

export type KubeResource = VirtualMachine | DataVolume | Node | Multus | Subnet | VPC | ProviderNetwork | VirtualMachineClone | VLAN | Event | VirtualMachineSnapshot | VirtualMachineRestore

export const create = async <T extends KubeResource>(cr: T, set?: React.Dispatch<React.SetStateAction<T>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<T> => {
    setLoading?.(true)
    const resource = resolveResourceType(cr)
    try {
        const result = await resourceClient.create({ resourceType: resource.type, data: JSON.stringify(cr) })
        const output = JSON.parse(result.response.data) as T
        set?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to create ${resource.name} [Namespace: ${cr.metadata?.namespace}, Name: ${cr.metadata?.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const get = async<T extends KubeResource>(type: ResourceType, nn: NamespaceName, set?: React.Dispatch<React.SetStateAction<T | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<T> => {
    setLoading?.(true)
    const resource = resolveResourceType(undefined, type)
    try {
        const call = await resourceClient.get({
            resourceType: resource.type,
            namespaceName: nn
        })
        const output = JSON.parse(call.response.data) as T
        set?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to get ${resource.name} [Namespace: ${nn.namespace}, Name: ${nn.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const update = async <T extends KubeResource>(cr: T, set?: React.Dispatch<React.SetStateAction<T>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<T> => {
    setLoading?.(true)
    const resource = resolveResourceType(cr)
    try {
        const result = await resourceClient.update({
            resourceType: resource.type,
            data: JSON.stringify(cr)
        })
        const output = JSON.parse(result.response.data) as T
        set?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to update ${resource.name} [Namespace: ${cr.metadata?.namespace}, Name: ${cr.metadata?.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const delete2 = async (type: ResourceType, nn: NamespaceName, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    const resource = resolveResourceType(undefined, type)
    try {
        await resourceClient.delete({
            resourceType: resource.type,
            namespaceName: nn
        })
    } catch (err) {
        notification?.error({ message: `Failed to delete ${resource.name} [Namespace: ${nn.namespace}, Name: ${nn.name}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const deleteMany = async (crs: KubeResource[], setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    try {
        const completed: KubeResource[] = []
        const failed: { cr: KubeResource; error: any }[] = []

        await Promise.all(crs.map(async (cr) => {
            const namespace = cr.metadata!.namespace
            const name = cr.metadata!.name
            const resource = resolveResourceType(cr)
            try {
                await resourceClient.delete({ namespaceName: { namespace, name }, resourceType: resource.type }).response
                completed.push(cr)
            } catch (err: any) {
                failed.push({ cr, error: err })
            }
        }))

        if (failed.length > 0) {
            const errorMessages = failed.map(({ cr, error }) => `Namespace: ${cr.metadata?.namespace}, Name: ${cr.metadata?.name}, Error: ${error.message}`).join("\n")
            throw new Error(`Failed to delete the following resources:\n${errorMessages}`)
        }
    } catch (err) {
        notification?.error({ message: `Failed to delete resources:`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const list = async<T extends KubeResource>(type: ResourceType, set?: React.Dispatch<React.SetStateAction<T[] | undefined>>, opts?: ListOptions, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<T[]> => {
    setLoading?.(true)
    const resource = resolveResourceType(undefined, type)
    try {
        const result = await resourceClient.list({
            resourceType: resource.type,
            options: ListOptions.create(opts)
        })
        let items: T[] = []
        result.response.items.forEach((item: string) => {
            items.push(JSON.parse(item) as T)
        })
        set?.(items)
        return items
    } catch (err) {
        notification?.error({ message: `Failed to list ${resource.name}`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const watch = async<T extends KubeResource>(type: ResourceType, set: React.Dispatch<React.SetStateAction<T[] | undefined>>, abortSignal: AbortSignal, opts?: WatchOptions, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading?.(true)
    const resource = resolveResourceType(undefined, type)
    try {
        await new Promise<void>((resolve, reject) => {
            const map = new Map<string, KubeResource>()

            const call = resourceWatchClient.watch({
                resourceType: resource.type,
                options: WatchOptions.create(opts)
            }, { abort: abortSignal })

            let timeoutId: NodeJS.Timeout | null = null
            const update = () => {
                if (map.size === 0 && timeoutId === null) {
                    timeoutId = setTimeout(() => {
                        const items = resourceSort(Array.from(map.values()))
                        set(items.length > 0 ? items : undefined)
                        timeoutId = null
                    }, defaultTimeout)
                } else {
                    const items = resourceSort(Array.from(map.values()))
                    set(items.length > 0 ? items : undefined)
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
                            const temp = JSON.parse(data) as KubeResource
                            map.set(namespaceNameString(temp), temp)
                        })
                        break
                    }
                    case EventType.DELETED: {
                        response.items.forEach((data) => {
                            const temp = JSON.parse(data) as KubeResource
                            map.delete(namespaceNameString(temp))
                        })
                        break
                    }
                }
                update()
            })

            call.responses.onError((err: Error) => {
                if (!isAbortedError(err)) {
                    reject(new Error(`Error in watch stream for ${resource.name}: ${err.message}`))
                } else {
                    resolve()
                }
            })
            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch ${resource.name}`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}

export const watchSingle = async <T extends KubeResource>(type: ResourceType, nn: NamespaceName, set: React.Dispatch<React.SetStateAction<T | undefined>>, abortSignal: AbortSignal, setLoading: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<void> => {
    setLoading(true)
    const resource = resolveResourceType(undefined, type)
    const opts = WatchOptions.create({
        fieldSelectorGroup: { operator: "&&", fieldSelectors: [{ fieldPath: "metadata.name", operator: "=", values: [nn.name] }] }
    })
    if (nn.namespace.length > 0) {
        opts.fieldSelectorGroup!.fieldSelectors.unshift(FieldSelector.create({ fieldPath: "metadata.namespace", operator: "=", values: [nn.namespace] }))
    }
    try {
        await new Promise<void>((resolve, reject) => {
            const call = resourceWatchClient.watch({
                resourceType: resource.type,
                options: opts
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
                        set(JSON.parse(response.items[0]) as T)
                        break
                    }
                    case EventType.DELETED: {
                        set(undefined)
                        break
                    }
                }
            })

            call.responses.onError((err: Error) => {
                if (!isAbortedError(err)) {
                    reject(new Error(`Error in watch stream for ${resource.name}: ${err.message}`))
                } else {
                    resolve()
                }
            })

            call.responses.onComplete(() => {
                resolve()
            })
        })
    } catch (err) {
        notification?.error({ message: `Failed to watch ${resource.name}`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading(false)
    }
}

const resolveTypeMap = new Map([
    ["VirtualMachine", ResourceType.VIRTUAL_MACHINE],
    ["VirtualMachinePool", ResourceType.VIRTUAL_MACHINE_POOL],
    ["DataVolume", ResourceType.DATA_VOLUME],
    ["NetworkAttachmentDefinition", ResourceType.MULTUS],
    ["Event", ResourceType.EVENT],
    ["IP", ResourceType.IPS],
    ["Namespace", ResourceType.NAMESPACE],
    ["Node", ResourceType.NODE],
    ["ProvideNetworks", ResourceType.PROVIDER_NETWORK],
    ["StorageClass", ResourceType.STORAGE_CLASS],
    ["Subnet", ResourceType.SUBNET],
    ["VirtualMachineClone", ResourceType.VIRTUAL_MACHINE_CLONE],
    ["VirtualMachineRestore", ResourceType.VIRTUAL_MACHINE_RESTORE],
    ["Vlan", ResourceType.VLAN],
    ["Vpc", ResourceType.VPC]
])

const resolveTypeNameMap = new Map([
    [ResourceType.VIRTUAL_MACHINE, "virtual machine"],
    [ResourceType.VIRTUAL_MACHINE_POOL, "virtual machine pool"],
    [ResourceType.DATA_VOLUME, "data volume"],
    [ResourceType.MULTUS, "multus"],
    [ResourceType.EVENT, "event"],
    [ResourceType.IPS, "ips"],
    [ResourceType.NAMESPACE, "namespace"],
    [ResourceType.NODE, "node"],
    [ResourceType.PROVIDER_NETWORK, "provide networks"],
    [ResourceType.STORAGE_CLASS, "storage class"],
    [ResourceType.SUBNET, "subnet"],
    [ResourceType.VLAN, "vlan"],
    [ResourceType.VPC, "vpc"],
    [ResourceType.UNSPECIFIED, "unknown"]
])

export const resolveResourceType = (cr?: KubeResource, type?: ResourceType): { type: ResourceType, name: string } => {
    if (!type) {
        type = ResourceType.UNSPECIFIED
    }
    if (cr) {
        type = resolveTypeMap.get(cr.kind!) ?? ResourceType.UNSPECIFIED
    }
    return { type: type, name: resolveTypeNameMap.get(type) ?? "unknown" }
}
