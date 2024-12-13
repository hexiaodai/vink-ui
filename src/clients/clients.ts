import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport"
import { ResourceWatchManagementClient } from "@/clients/ts/management/resource/v1alpha1/watch.client"
import { VirtualMachineManagementClient } from "@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine.client"
import { ResourceManagementClient } from "@/clients/ts/management/resource/v1alpha1/resource.client"
import { ResourceType, NamespaceName } from "@/clients/ts/types/types"
import { extractNamespaceAndName, namespaceNameKey } from "@/utils/k8s"
import { VirtualMachinePowerStateRequest_PowerState } from "@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine"
import { ListOptions } from "./ts/management/resource/v1alpha1/resource"
import { virtualMachine } from "@/utils/parse-summary"

export const getResourceName = (type: ResourceType) => {
    return ResourceType[type]
}

export const getPowerStateName = (state: VirtualMachinePowerStateRequest_PowerState) => {
    return VirtualMachinePowerStateRequest_PowerState[state]
}

export class Clients {
    private static instance: Clients

    readonly watch: ResourceWatchManagementClient
    readonly resource: ResourceManagementClient
    readonly virtualmachine: VirtualMachineManagementClient

    private constructor() {
        const transport = new GrpcWebFetchTransport({
            baseUrl: window.location.origin
        })

        this.watch = new ResourceWatchManagementClient(transport)
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
                resourceType: resourceType,
                namespaceName: namespaceName
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
            const call = this.resource.list({
                resourceType: resourceType,
                options: ListOptions.create(opts)
            })
            call.then((result) => {
                let items: any[] = []
                result.response.items.forEach((item: any) => {
                    items.push(JSON.parse(item))
                })
                resolve(items)
            })
            call.response.catch((err: Error) => {
                reject(new Error(`Failed to list ${getResourceName(resourceType)}: ${err.message}`))
            })
        })
    }

    public batchManageVirtualMachinePowerState = async (vms: any[], state: VirtualMachinePowerStateRequest_PowerState): Promise<void> => {
        const completed: NamespaceName[] = []
        const failed: NamespaceName[] = []

        await Promise.all(vms.map(async (vm) => {
            const namespaceName = extractNamespaceAndName(vm)
            const isRunning = virtualMachine(vm)?.status.printableStatus as string === "Running"

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
                console.log(err)
                failed.push(namespaceName)
            }
            return
        }))

        if (failed.length > 0) {
            return Promise.reject(new Error(`Failed to updated power state ${getResourceName(ResourceType.VIRTUAL_MACHINE)}: ${failed.map((vm) => namespaceNameKey(vm)).join(", ")}`))
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

export const clients = Clients.getInstance()
