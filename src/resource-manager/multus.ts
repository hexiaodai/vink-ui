import { NotificationInstance } from "antd/lib/notification/interface"
import { clients } from "./clients"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { emptyOptions, generateMessage } from "@/utils/utils"
import { generateSelector } from "./utils"
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"

export const fetchMultus = (setMultus: any, advancedParams: any, notification: NotificationInstance): Promise<void> => {
    return new Promise((resolve, reject) => {
        const call = clients.resourceWatch.listWatch({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.MULTUS
                }
            },
            options: { ...emptyOptions(), namespace: advancedParams.namespace, fieldSelector: generateSelector(advancedParams) }
        })
        call.responses.onMessage(response => {
            setMultus(response.items)
            resolve()
        })
        call.responses.onError(err => {
            notification.error({ message: "Multus", description: err.message })
            reject()
        })
    })
}

export const deleteMultusConfig = (namespace: string, name: string, notification: NotificationInstance): Promise<void> => {
    return new Promise((resolve, reject) => {
        const call = clients.resource.delete({
            namespaceName: { namespace: namespace, name: name },
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.MULTUS
                }
            }
        })
        call.then(() => {
            notification.success({ message: "Multus", description: `删除 "${namespace}/${name}" Multus 配置成功` })
            resolve()
        })
        call.response.catch((err: Error) => {
            notification.error({ message: "Multus", description: `删除 "${namespace}/${name}" Multus 配置失败：${err.message}` })
            reject()
        })
    })
}

export const batchDeleteMultusConfig = async (mc: CustomResourceDefinition[], notification: NotificationInstance) => {
    const completed: CustomResourceDefinition[] = []
    const failed: CustomResourceDefinition[] = []
    const notificationSuccessKey = "batch-delete-multus-config-success"
    const notificationFailedKey = "batch-delete-multus-config-failed"

    await Promise.all(mc.map(async (m) => {
        const namespace = m.metadata?.namespace!
        const name = m.metadata?.name!

        try {
            await clients.resource.delete({
                namespaceName: { namespace: namespace, name: name },
                groupVersionResource: {
                    option: {
                        oneofKind: "enum",
                        enum: GroupVersionResourceEnum.MULTUS
                    }
                }
            }).response
            completed.push(m)
            const msg = generateMessage(completed, `正在删除 "{names}" Multus 配置`, `正在删除 "{names}" 等 {count} 个 Multus 配置`)
            notification.success({ key: notificationSuccessKey, message: "Multus", description: msg })
        } catch (err: any) {
            failed.push(m)
            const msg = generateMessage(failed, `删除 "{names}" Multus 配置失败`, `删除 "{names}" 等 {count} 个 Multus 配置失败`)
            notification.error({ key: notificationFailedKey, message: "Multus", description: msg })
            console.log(err)
        }
        return
    }))
}

export const createMultusConfig = async (crd: CustomResourceDefinition, notification: NotificationInstance): Promise<void> => {
    const data = JSON.stringify(crd)
    return new Promise((resolve, reject) => {
        const call = clients.resource.create({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.MULTUS
                }
            },
            data: data
        })

        call.then(() => {
            notification.success({ message: "Multus", description: `创建 "${crd.metadata?.namespace}/${crd.metadata?.name}" Multus 配置成功` })
            resolve()
        })
        call.response.catch((err: Error) => {
            notification.error({ message: "Multus", description: `创建 "${crd.metadata?.namespace}/${crd.metadata?.name}" Multus 配置失败：${err.message}` })
            reject()
        })
    })
}
