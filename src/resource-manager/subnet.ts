import { NotificationInstance } from "antd/lib/notification/interface"
import { clients } from "./clients"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { emptyOptions, generateMessage } from "@/utils/utils"
import { generateSelector } from "./utils"
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"

export const fetchSubnets = (setSubnets: any, advancedParams: any, notification: NotificationInstance): Promise<void> => {
    return new Promise((resolve, reject) => {
        const call = clients.resourceWatch.listWatch({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.SUBNET
                }
            },
            options: { ...emptyOptions(), namespace: advancedParams.namespace, fieldSelector: generateSelector(advancedParams) }
        })
        call.responses.onMessage(response => {
            setSubnets(response.items)
            resolve()
        })
        call.responses.onError(err => {
            notification.error({ message: "Subnet", description: err.message })
            reject()
        })
    })
}

export const deleteSubnet = (name: string, notification: NotificationInstance): Promise<void> => {
    return new Promise((resolve, reject) => {
        const call = clients.resource.delete({
            namespaceName: { namespace: "", name: name },
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.SUBNET
                }
            }
        })
        call.then(() => {
            notification.success({ message: "Subnet", description: `删除 "${name}" 子网成功` })
            resolve()
        })
        call.response.catch((err: Error) => {
            notification.error({ message: "Subnet", description: `删除 "${name}" 子网失败：${err.message}` })
            reject()
        })
    })
}

export const batchDeleteSubnets = async (mc: CustomResourceDefinition[], notification: NotificationInstance) => {
    const completed: CustomResourceDefinition[] = []
    const failed: CustomResourceDefinition[] = []
    const notificationSuccessKey = "batch-delete-subnet-success"
    const notificationFailedKey = "batch-delete-subnet-failed"

    await Promise.all(mc.map(async (m) => {
        const namespace = m.metadata?.namespace!
        const name = m.metadata?.name!

        try {
            await clients.resource.delete({
                namespaceName: { namespace: namespace, name: name },
                groupVersionResource: {
                    option: {
                        oneofKind: "enum",
                        enum: GroupVersionResourceEnum.SUBNET
                    }
                }
            }).response
            completed.push(m)
            const msg = generateMessage(completed, `正在删除 "{names}" 子网`, `正在删除 "{names}" 等 {count} 个子网`)
            notification.success({ key: notificationSuccessKey, message: "Subnet", description: msg })
        } catch (err: any) {
            failed.push(m)
            const msg = generateMessage(failed, `删除 "{names}" 子网失败`, `删除 "{names}" 等 {count} 个子网失败`)
            notification.error({ key: notificationFailedKey, message: "Subnet", description: msg })
            console.log(err)
        }
        return
    }))
}

export const createSubnet = async (crd: CustomResourceDefinition, notification: NotificationInstance): Promise<void> => {
    const data = JSON.stringify(crd)
    return new Promise((resolve, reject) => {
        const call = clients.resource.create({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.SUBNET
                }
            },
            data: data
        })

        call.then(() => {
            notification.success({ message: "Subnet", description: `创建 "${crd.metadata?.name}" 子网成功` })
            resolve()
        })
        call.response.catch((err: Error) => {
            notification.error({ message: "Subnet", description: `创建 "${crd.metadata?.name}" 子网失败：${err.message}` })
            reject()
        })
    })
}
