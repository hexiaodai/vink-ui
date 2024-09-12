import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { EventType } from "@/apis/management/resource/v1alpha1/listwatch"
import { VirtualMachinePowerStateRequest_PowerState } from "@/apis/management/virtualmachine/v1alpha1/virtualmachine"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { NamespaceName } from "@/apis/types/namespace_name"
import { clients } from "@/clients/clients"
import { namespaceName } from "@/utils/k8s"
import { allowedError, emptyOptions, generateMessage, jsonParse } from "@/utils/utils"
import { NotificationInstance } from "antd/lib/notification/interface"
import { instances as labels } from "@/apis/sdks/ts/label/labels.gen"
import { ProFormInstance } from "@ant-design/pro-components"

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

export const updateImages = (setImages: any, advancedParams: any, notification: NotificationInstance): Promise<void> => {
    const fieldSelector = advancedParams.params.keyword ? `metadata.${advancedParams.searchFilter}=${advancedParams.params.keyword}` : ""
    return new Promise((resolve, reject) => {
        const call = clients.resourceWatch.listWatch({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.DATA_VOLUME
                }
            },
            options: {
                fieldSelector: fieldSelector,
                labelSelector: `${labels.VinkDatavolumeType.name}=image`,
                limit: 0,
                continue: "",
                namespaceNames: [],
                watch: false
            }
        })

        call.responses.onMessage((response) => {
            setImages(response.items)
            resolve()
        })

        call.responses.onError((err: Error) => {
            notification.error({ message: "DataVolume", description: err.message })
            reject(err.message)
        })
    })
}

export const updateDataDisks = (setDataDisks: any, advancedParams: any, notification: NotificationInstance): Promise<void> => {
    const fieldSelector = advancedParams.params.keyword ? `metadata.${advancedParams.searchFilter}=${advancedParams.params.keyword}` : ""
    return new Promise((resolve, reject) => {
        const call = clients.resourceWatch.listWatch({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.DATA_VOLUME
                }
            },
            options: {
                fieldSelector: fieldSelector,
                labelSelector: `${labels.VinkDatavolumeType.name}=data`,
                limit: 0,
                continue: "",
                namespaceNames: [],
                watch: false
            }
        })

        call.responses.onMessage((response) => {
            setDataDisks(response.items)
            resolve()
        })

        call.responses.onError((err: Error) => {
            notification.error({ message: "DataVolume", description: err.message })
            reject(err.message)
        })
    })
}

export const createVirtualMachine = async (crd: CustomResourceDefinition, notification: NotificationInstance): Promise<void> => {
    const data = JSON.stringify(crd)
    return new Promise((resolve, reject) => {
        const call = clients.resource.create({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.VIRTUAL_MACHINE
                }
            },
            data: data
        })

        call.then(() => {
            notification.success({ message: "VirtualMachine", description: `创建 "${crd.metadata?.namespace}/${crd.metadata?.name}" 虚拟机成功` })
            resolve()
        })
        call.response.catch((err: Error) => {
            notification.error({ message: "VirtualMachine", description: `创建 "${crd.metadata?.namespace}/${crd.metadata?.name}" 虚拟机失败：${err.message}` })
            reject()
        })
    })
}
