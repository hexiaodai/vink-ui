import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport"
import { ResourceWatchManagementClient } from "@/clients/ts/management/resource/v1alpha1/watch.client"
import { VirtualMachineManagementClient } from "@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine.client"
import { ResourceManagementClient } from "@/clients/ts/management/resource/v1alpha1/resource.client"
import { ResourceType } from "@/clients/ts/types/types"
import { VirtualMachinePowerStateRequest_PowerState } from "@/clients/ts/management/virtualmachine/v1alpha1/virtualmachine"

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
