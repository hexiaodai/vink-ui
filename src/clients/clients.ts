import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport"
import { ResourceListWatchManagementClient } from "@/clients/ts/management/resource/v1alpha1/listwatch.client"
import { VirtualMachineManagementClient } from "@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine.client"
import { ResourceManagementClient } from "@/clients/ts/management/resource/v1alpha1/resource.client"
import { ResourceType } from "@/clients/ts/types/resource"
import { extractNamespaceAndName, namespaceNameKey } from "@/utils/k8s"
import { ListOptions } from "@/clients/ts/types/list_options"
import { NamespaceName } from "@/clients/ts/types/namespace_name"
import { VirtualMachinePowerStateRequest_PowerState } from "@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine"

// export const resourceTypeName = new Map<ResourceType, string>([
//     [ResourceType.VIRTUAL_MACHINE, "VirtualMachine"],
//     [ResourceType.VIRTUAL_MACHINE_INSTANCE, "VirtualMachineInstance"],
//     [ResourceType.VIRTUAL_MACHINE_SUMMARY, "VirtualMachineSummary"],
//     [ResourceType.DATA_VOLUME, "DataVolume"],
//     [ResourceType.NODE, "Node"],
//     [ResourceType.NAMESPACE, "Namespace"],
//     [ResourceType.MULTUS, "Multus"],
//     [ResourceType.SUBNET, "Subnet"],
//     [ResourceType.VPC, "VPC"],
//     [ResourceType.IPPOOL, "IPPool"],
//     [ResourceType.STORAGE_CLASS, "StorageClass"],
//     [ResourceType.IPS, "IPs"]
// ])

// export const powerStateTypeName = new Map<VirtualMachinePowerStateRequest_PowerState, string>([
//     [VirtualMachinePowerStateRequest_PowerState.OFF, "OFF"],
//     [VirtualMachinePowerStateRequest_PowerState.ON, "ON"],
//     [VirtualMachinePowerStateRequest_PowerState.REBOOT, "REBOOT"],
//     [VirtualMachinePowerStateRequest_PowerState.FORCE_REBOOT, "FORCE REBOOT"],
//     [VirtualMachinePowerStateRequest_PowerState.FORCE_OFF, "FORCE OFF"]
// ])

export const getResourceName = (type: ResourceType) => {
    return ResourceType[type]
}

export const getPowerStateName = (state: VirtualMachinePowerStateRequest_PowerState) => {
    return VirtualMachinePowerStateRequest_PowerState[state]
}

export class Clients {
    private static instance: Clients

    readonly watch: ResourceListWatchManagementClient
    readonly resource: ResourceManagementClient
    readonly virtualmachine: VirtualMachineManagementClient

    private constructor() {
        const transport = new GrpcWebFetchTransport({
            baseUrl: window.location.origin
        })

        this.watch = new ResourceListWatchManagementClient(transport)
        this.resource = new ResourceManagementClient(transport)
        this.virtualmachine = new VirtualMachineManagementClient(transport)
    }

    public static getInstance(): Clients {
        if (!Clients.instance) {
            Clients.instance = new Clients()
        }
        return Clients.instance
    }

    public batchDeleteResources = async (resourceType: ResourceType, resources: any[]): Promise<void> => {
        const completed: NamespaceName[] = []
        const failed: NamespaceName[] = []

        await Promise.all(resources.map(async (crd) => {
            const namespaceName = extractNamespaceAndName(crd)
            try {
                await this.resource.delete({ namespaceName: namespaceName, resourceType: resourceType }).response
                completed.push(namespaceName)
            } catch (err: any) {
                failed.push(namespaceName)
            }
            return
        }))

        if (failed.length > 0) {
            Promise.reject(new Error(`Failed to delete ${getResourceName(resourceType)} ${failed.map(namespaceNameKey).join(", ")}`))
        }
    }

    public createResource = async (resourceType: ResourceType, crd: any): Promise<any> => {
        const namespaceName = extractNamespaceAndName(crd)
        const data = JSON.stringify(crd)
        return new Promise((resolve, reject) => {
            const call = this.resource.create({
                resourceType: resourceType,
                data: data
            })

            call.then((result) => {
                resolve(JSON.parse(result.response.data))
            })
            call.response.catch((err: Error) => {
                reject(new Error(`Failed to create ${getResourceName(resourceType)} ${namespaceNameKey(namespaceName)}: ${err.message}`))
            })
        })
    }

    public deleteResource = async (resourceType: ResourceType, namespaceName: NamespaceName): Promise<void> => {
        return new Promise((resolve, reject) => {
            const call = this.resource.delete({
                resourceType: resourceType
            })

            call.then(() => {
                resolve()
            })
            call.response.catch((err: Error) => {
                reject(new Error(`Failed to delete ${getResourceName(resourceType)} ${namespaceNameKey(namespaceName)}: ${err.message}`))
            })
        })
    }

    public updateResource = async (resourceType: ResourceType, crd: any): Promise<any> => {
        const namespaceName = extractNamespaceAndName(crd)
        const data = JSON.stringify(crd)
        return new Promise((resolve, reject) => {
            const call = this.resource.update({
                resourceType: resourceType,
                data: data
            })

            call.then((result) => {
                resolve(JSON.parse(result.response.data))
            })
            call.response.catch((err: Error) => {
                reject(new Error(`Failed to update ${getResourceName(resourceType)} ${namespaceNameKey(namespaceName)}: ${err.message}`))
            })
        })
    }

    public getResource = async (resourceType: ResourceType, namespaceName: NamespaceName): Promise<any> => {
        return new Promise((resolve, reject) => {
            const call = this.resource.get({
                resourceType: resourceType,
                namespaceName: namespaceName
            })
            call.then((result) => {
                resolve(JSON.parse(result.response.data))
            })
            call.response.catch((err: Error) => {
                reject(new Error(`Failed to get ${getResourceName(resourceType)} ${namespaceNameKey(namespaceName)}: ${err.message}`))
            })
        })
    }

    public listResources = async (resourceType: ResourceType, opts?: ListOptions): Promise<any> => {
        return new Promise((resolve, reject) => {
            const call = this.watch.listWatch({
                resourceType: resourceType,
                options: emptyOptions({ ...opts, watch: false })
            })

            call.responses.onMessage((response) => {
                let items: any[] = []
                response.items.forEach((item: any) => {
                    items.push(JSON.parse(item))
                })
                resolve(items)
            })
            call.responses.onError((err: Error) => {
                reject(new Error(`Failed to list ${getResourceName(resourceType)}: ${err.message}`))
            })
        })
    }

    public batchManageVirtualMachinePowerState = async (vms: any[], state: VirtualMachinePowerStateRequest_PowerState): Promise<void> => {
        const completed: NamespaceName[] = []
        const failed: NamespaceName[] = []

        await Promise.all(vms.map(async (vm) => {
            const namespaceName = extractNamespaceAndName(vm)
            const isRunning = vm.status.printableStatus as string === "Running"

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
                await this.virtualmachine.virtualMachinePowerState({
                    namespaceName: namespaceName, powerState: state
                }).response
                completed.push(namespaceName)
            } catch (err: any) {
                failed.push(namespaceName)
            }
            return
        }))

        if (failed.length > 0) {
            Promise.reject(new Error(`Failed to updated power state ${getResourceName(ResourceType.VIRTUAL_MACHINE)}: ${failed.map((vm) => namespaceNameKey(vm)).join(", ")}`))
        }
    }

    public manageVirtualMachinePowerState = (namespaceName: NamespaceName, state: VirtualMachinePowerStateRequest_PowerState): Promise<void> => {
        return new Promise((resolve, reject) => {
            const call = this.virtualmachine.virtualMachinePowerState({
                namespaceName: namespaceName,
                powerState: state
            })
            call.response.then(() => {
                resolve()
            })
            call.response.catch((err: Error) => {
                reject(new Error(`Failed to update power state for ${namespaceNameKey(namespaceName)}: ${err.message}`))
            })
        })
    }
}

export const emptyOptions = (overrides: Partial<ListOptions> = {}): ListOptions => {
    return Object.assign({}, {
        fieldSelector: "",
        labelSelector: "",
        limit: 0,
        continue: "",
        customSelector: {
            namespaceNames: [],
            fieldSelector: [],
        },
        namespace: "",
        watch: false,
    }, overrides)
}

export const clients = Clients.getInstance()
