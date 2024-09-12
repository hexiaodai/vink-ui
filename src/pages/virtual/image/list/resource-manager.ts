import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { EventType } from "@/apis/management/resource/v1alpha1/listwatch"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { clients } from "@/clients/clients"
import { namespaceName } from "@/utils/k8s"
import { allowedError, generateMessage } from "@/utils/utils"
import { NotificationInstance } from "antd/lib/notification/interface"
import { instances as labels } from "@/apis/sdks/ts/label/labels.gen"

export class ResourceUpdater {
    image: Map<string, CustomResourceDefinition>
    setImage: any

    abortCtrl!: AbortController
    notification: NotificationInstance

    constructor(
        image: Map<string, CustomResourceDefinition>,
        setImage: any,
        notification: NotificationInstance
    ) {
        this.image = image
        this.setImage = setImage
        this.notification = notification
    }

    async updateResource(advancedParams: any, abortCtrl: AbortController): Promise<void> {
        this.abortCtrl = abortCtrl

        return new Promise((resolve, reject) => {
            const call = clients.resourceWatch.listWatch(
                {
                    groupVersionResource: {
                        option: {
                            oneofKind: "enum",
                            enum: GroupVersionResourceEnum.DATA_VOLUME
                        }
                    },
                    options: {
                        fieldSelector: this.generateSelecter(advancedParams),
                        labelSelector: `${labels.VinkDatavolumeType.name}=image`,
                        limit: 0,
                        continue: "",
                        namespaceNames: [],
                        watch: true
                    }
                },
                { abort: this.abortCtrl.signal }
            )

            call.responses.onMessage((response) => {
                switch (response.eventType) {
                    case EventType.ADDED: {
                        const temp = new Map<string, CustomResourceDefinition>()
                        response.items.forEach((dv) => {
                            temp.set(namespaceName(dv.metadata), dv)
                        })
                        this.image = temp
                        this.setImage(temp)
                        break
                    }
                    case EventType.MODIFIED: {
                        response.items.forEach((dv) => {
                            this.image.set(namespaceName(dv.metadata), dv)
                        })
                        this.setImage(new Map(this.image))
                        break
                    }
                    case EventType.DELETED: {
                        const key = `${response.deleted?.namespace}/${response.deleted?.name}`
                        this.image.delete(key)
                        this.setImage(new Map(this.image))
                        break
                    }
                }
                resolve()
            })

            call.responses.onError((err: Error) => {
                if (!allowedError(err)) {
                    this.notification.error({
                        message: "DataVolume",
                        description: err.message
                    })
                }
                reject(err.message)
            })
        })
    }

    generateSelecter = (advancedParams: any) => {
        return advancedParams.params.keyword ? `metadata.${advancedParams.searchFilter}=${advancedParams.params.keyword}` : ""
    }
}

export const deleteDataVolume = (namespace: string, name: string, notification: NotificationInstance): Promise<void> => {
    return new Promise((resolve, reject) => {
        const call = clients.resource.delete({
            namespaceName: { namespace: namespace, name: name },
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: GroupVersionResourceEnum.DATA_VOLUME
                }
            }
        })
        call.then(() => {
            notification.success({ message: "DataVolume", description: `删除 "${namespace}/${name}" 系统镜像成功` })
            resolve()
        })
        call.response.catch((err: Error) => {
            notification.error({ message: "DataVolume", description: `删除 "${namespace}/${name}" 系统镜像失败：${err.message}` })
            reject()
        })
    })
}

export const batchDeleteDataVolumes = async (dvs: CustomResourceDefinition[], notification: NotificationInstance) => {
    const completed: CustomResourceDefinition[] = []
    const failed: CustomResourceDefinition[] = []
    const notificationSuccessKey = "batch-delete-data-volumes-success"
    const notificationFailedKey = "batch-delete-data-volumes-failed"

    await Promise.all(dvs.map(async (dv) => {
        const namespace = dv.metadata?.namespace!
        const name = dv.metadata?.name!

        try {
            await clients.resource.delete({
                namespaceName: { namespace: namespace, name: name },
                groupVersionResource: {
                    option: {
                        oneofKind: "enum",
                        enum: GroupVersionResourceEnum.DATA_VOLUME
                    }
                }
            }).response
            completed.push(dv)
            const msg = generateMessage(completed, `正在删除 "{names}" 系统镜像`, `正在删除 "{names}" 等 {count} 个系统镜像`)
            notification.success({ key: notificationSuccessKey, message: "DataVolume", description: msg })
        } catch (err: any) {
            failed.push(dv)
            const msg = generateMessage(failed, `删除 "{names}" 系统镜像失败`, `删除 "{names}" 等 {count} 个系统镜像失败`)
            notification.error({ key: notificationFailedKey, message: "DataVolume", description: msg })
            console.log(err)
        }
        return
    }))
}
