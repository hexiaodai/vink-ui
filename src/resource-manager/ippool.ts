import { NotificationInstance } from "antd/lib/notification/interface"
import { clients } from "./clients"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { emptyOptions, generateMessage } from "@/utils/utils"
import { generateSelector } from "./utils"
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"

export const fetchIPPools = (setIPPools: any, advancedParams: any, notification: NotificationInstance): Promise<void> => {
    return new Promise((resolve, reject) => {
        const call = clients.resourceWatch.listWatch({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.IPPOOL
                }
            },
            options: { ...emptyOptions(), namespace: advancedParams.namespace, fieldSelector: generateSelector(advancedParams) }
        })
        call.responses.onMessage(response => {
            setIPPools(response.items)
            resolve()
        })
        call.responses.onError(err => {
            notification.error({ message: "IPPool", description: err.message })
            reject()
        })
    })
}

export const deleteIPPool = (name: string, notification: NotificationInstance): Promise<void> => {
    return new Promise((resolve, reject) => {
        const call = clients.resource.delete({
            namespaceName: { namespace: "", name: name },
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.IPPOOL
                }
            }
        })
        call.then(() => {
            notification.success({ message: "IPPool", description: `删除 "${name}" IPPool 成功` })
            resolve()
        })
        call.response.catch((err: Error) => {
            notification.error({ message: "IPPool", description: `删除 "${name}" IPPool 失败：${err.message}` })
            reject()
        })
    })
}

export const batchDeleteIPPools = async (mc: CustomResourceDefinition[], notification: NotificationInstance) => {
    const completed: CustomResourceDefinition[] = []
    const failed: CustomResourceDefinition[] = []
    const notificationSuccessKey = "batch-delete-ippool-success"
    const notificationFailedKey = "batch-delete-ippool-failed"

    await Promise.all(mc.map(async (m) => {
        const namespace = m.metadata?.namespace!
        const name = m.metadata?.name!

        try {
            await clients.resource.delete({
                namespaceName: { namespace: namespace, name: name },
                groupVersionResource: {
                    option: {
                        oneofKind: "enum",
                        enum: GroupVersionResourceEnum.IPPOOL
                    }
                }
            }).response
            completed.push(m)
            const msg = generateMessage(completed, `正在删除 "{names}" IPPool`, `正在删除 "{names}" 等 {count} 个 IPPool`)
            notification.success({ key: notificationSuccessKey, message: "IPPool", description: msg })
        } catch (err: any) {
            failed.push(m)
            const msg = generateMessage(failed, `删除 "{names}" IPPool 失败`, `删除 "{names}" 等 {count} 个 IPPool 失败`)
            notification.error({ key: notificationFailedKey, message: "IPPool", description: msg })
            console.log(err)
        }
        return
    }))
}

export const createIPPool = async (crd: CustomResourceDefinition, notification: NotificationInstance): Promise<void> => {
    const data = JSON.stringify(crd)
    return new Promise((resolve, reject) => {
        const call = clients.resource.create({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.IPPOOL
                }
            },
            data: data
        })

        call.then(() => {
            notification.success({ message: "IPPool", description: `创建 "${crd.metadata?.name}" IPPool 成功` })
            resolve()
        })
        call.response.catch((err: Error) => {
            notification.error({ message: "IPPool", description: `创建 "${crd.metadata?.name}" IPPool 失败：${err.message}` })
            reject()
        })
    })
}
