import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { clients } from "@/clients/clients"
import { emptyOptions } from "@/utils/utils"
import { NotificationInstance } from "antd/lib/notification/interface"

export const updateNamespaces = (setNamespace: any, notification: NotificationInstance): Promise<void> => {
    return new Promise((resolve, reject) => {
        const call = clients.resourceWatch.listWatch({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.NAMESPACE
                }
            },
            options: emptyOptions()
        })
        call.responses.onMessage(response => {
            setNamespace(response.items)
            resolve()
        })
        call.responses.onError(err => {
            notification.error({ message: "Namespace", description: err.message })
            reject()
        })
    })
}

export const createDataDisk = async (crd: CustomResourceDefinition, notification: NotificationInstance): Promise<void> => {
    const data = JSON.stringify(crd)
    return new Promise((resolve, reject) => {
        const call = clients.resource.create({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.DATA_VOLUME
                }
            },
            data: data
        })

        call.then(() => {
            notification.success({ message: "DataVolume", description: `创建 "${crd.metadata?.namespace}/${crd.metadata?.name}" 镜像成功` })
            resolve()
        })
        call.response.catch((err: Error) => {
            notification.error({ message: "DataVolume", description: `创建 "${crd.metadata?.namespace}/${crd.metadata?.name}" 镜像失败：${err.message}` })
            reject()
        })
    })
}
