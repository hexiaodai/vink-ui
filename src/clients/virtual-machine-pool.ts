import { VirtualMachine } from "./virtual-machine"

export interface VirtualMachinePool {
    apiVersion: string
    kind: string
    metadata: {
        name: string
        namespace: string
        annotations?: {
            [key: string]: string
        }
    }
    spec: {
        replicas: number
        selector: {
            matchLabels: {
                [key: string]: string
            }
        }
        virtualMachineTemplate: VirtualMachine
    }
}
