import { NotificationInstance } from "antd/lib/notification/interface"
import { ListOptions } from "./ts/management/resource/v1alpha1/resource"
import { resourceClient } from "./clients"
import { ResourceType } from "./ts/types/types"
import { getErrorMessage } from "@/utils/utils"

export interface StorageClass {
    metadata: {
        name: string
        namespace: string
    }
}

export const listStorageClass = async (setStorageClass?: React.Dispatch<React.SetStateAction<StorageClass[] | undefined>>, opts?: ListOptions, setLoading?: React.Dispatch<React.SetStateAction<boolean>>, notification?: NotificationInstance): Promise<StorageClass[]> => {
    setLoading?.(true)
    try {
        const result = await resourceClient.list({
            resourceType: ResourceType.STORAGE_CLASS,
            options: ListOptions.create(opts)
        })
        let items: StorageClass[] = []
        result.response.items.forEach((item: string) => {
            items.push(JSON.parse(item) as StorageClass)
        })
        setStorageClass?.(items.length > 0 ? items : undefined)
        return items
    } catch (err) {
        notification?.error({ message: `Failed to list storage class`, description: getErrorMessage(err) })
        throw err
    } finally {
        setLoading?.(false)
    }
}
