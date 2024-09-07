import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport"
import { ResourceListWatchManagementClient } from "@/apis/management/resource/v1alpha1/listwatch.client"
import { VirtualMachineManagementClient } from "@/apis/management/virtualmachine/v1alpha1/virtualmachine.client"

class Clients {
    private static instance: Clients

    readonly resource: ResourceListWatchManagementClient
    readonly virtualmachine: VirtualMachineManagementClient

    private constructor() {
        const transport = new GrpcWebFetchTransport({
            // baseUrl: window.location.origin
            baseUrl: "http://192.168.18.240:8080"
        })

        this.resource = new ResourceListWatchManagementClient(transport)
        this.virtualmachine = new VirtualMachineManagementClient(transport)
    }

    public static getInstance(): Clients {
        if (!Clients.instance) {
            Clients.instance = new Clients()
        }
        return Clients.instance
    }
}

export const clients = Clients.getInstance()
