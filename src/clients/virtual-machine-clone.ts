import { NotificationInstance } from "antd/lib/notification/interface"
import { defaultTimeout, resourceClient, resourceWatchClient } from "./clients"
import { NamespaceName, ResourceType } from "./ts/types/types"
import { getErrorMessage, isAbortedError, resourceSort } from "@/utils/utils"
import { EventType, WatchOptions } from "./ts/management/resource/v1alpha1/watch"
import { namespaceNameKey } from "@/utils/k8s"

export interface VirtualMachineClone {
    apiVersion: string
    kind: string
    metadata: {
        name?: string
        namespace?: string
        generateName?: string
        creationTimestamp?: string
    }
    spec?: {
        source: {
            apiGroup: string
            kind: string
            name: string
        },
        target: {
            apiGroup: string
            kind: string
            name: string
        }
    }
    status?: {
        conditions?: {
            status: string
            type: string
        }[]
    }
}

export const createClone = async (clone: VirtualMachineClone, setClone?: React.Dispatch<React.SetStateAction<VirtualMachineClone | undefined>>, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<VirtualMachineClone> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.create({
            resourceType: ResourceType.VIRTUAL_MACHINE_CLONE,
            data: JSON.stringify(clone)
        })
        const output = JSON.parse(result.response.data) as VirtualMachineClone
        setClone?.(output)
        return output
    } catch (err) {
        notification?.error({ message: `Failed to create VirtualMachineClone [Namespace: ${clone.metadata.namespace}, Name: ${clone.metadata.name || clone.metadata.generateName}]`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}
