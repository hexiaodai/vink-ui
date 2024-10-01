import { NotificationInstance } from "antd/lib/notification/interface"
import { clients } from "./clients"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { emptyOptions, generateMessage } from "@/utils/utils"
import { generateSelector } from "./utils"
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"

export const fetchVpcs = (setVpcs: any, advancedParams: any, notification: NotificationInstance): Promise<void> => {
    return new Promise((resolve, reject) => {
        const call = clients.resourceWatch.listWatch({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.VPC
                }
            },
            options: { ...emptyOptions(), namespace: advancedParams.namespace, fieldSelector: generateSelector(advancedParams) }
        })
        call.responses.onMessage(response => {
            setVpcs(response.items)
            resolve()
        })
        call.responses.onError(err => {
            notification.error({ message: "Vpc", description: err.message })
            reject()
        })
    })
}

export const deleteVpc = (name: string, notification: NotificationInstance): Promise<void> => {
    return new Promise((resolve, reject) => {
        const call = clients.resource.delete({
            namespaceName: { namespace: "", name: name },
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.VPC
                }
            }
        })
        call.then(() => {
            notification.success({ message: "VPC", description: `删除 "${name}" VPC 成功` })
            resolve()
        })
        call.response.catch((err: Error) => {
            notification.error({ message: "VPC", description: `删除 "${name}" VPC 失败：${err.message}` })
            reject()
        })
    })
}

export const batchDeleteVpcs = async (mc: CustomResourceDefinition[], notification: NotificationInstance) => {
    const completed: CustomResourceDefinition[] = []
    const failed: CustomResourceDefinition[] = []
    const notificationSuccessKey = "batch-delete-vpc-success"
    const notificationFailedKey = "batch-delete-vpc-failed"

    await Promise.all(mc.map(async (m) => {
        const namespace = m.metadata?.namespace!
        const name = m.metadata?.name!

        try {
            await clients.resource.delete({
                namespaceName: { namespace: namespace, name: name },
                groupVersionResource: {
                    option: {
                        oneofKind: "enum",
                        enum: GroupVersionResourceEnum.VPC
                    }
                }
            }).response
            completed.push(m)
            const msg = generateMessage(completed, `正在删除 "{names}" VPC`, `正在删除 "{names}" 等 {count} 个 VPC`)
            notification.success({ key: notificationSuccessKey, message: "VPC", description: msg })
        } catch (err: any) {
            failed.push(m)
            const msg = generateMessage(failed, `删除 "{names}" VPC 失败`, `删除 "{names}" 等 {count} 个 VPC 失败`)
            notification.error({ key: notificationFailedKey, message: "VPC", description: msg })
            console.log(err)
        }
        return
    }))
}

export const createVpc = async (crd: CustomResourceDefinition, notification: NotificationInstance): Promise<void> => {
    const data = JSON.stringify(crd)
    return new Promise((resolve, reject) => {
        const call = clients.resource.create({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.VPC
                }
            },
            data: data
        })

        call.then(() => {
            notification.success({ message: "VPC", description: `创建 "${crd.metadata?.name}" VPC 成功` })
            resolve()
        })
        call.response.catch((err: Error) => {
            notification.error({ message: "VPC", description: `创建 "${crd.metadata?.name}" VPC 失败：${err.message}` })
            reject()
        })
    })
}
