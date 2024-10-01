import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { clients } from "./clients"
import { instances as labels } from "@/apis/sdks/ts/label/labels.gen"
import { NotificationInstance } from "antd/lib/notification/interface"
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { allowedError, generateMessage } from "@/utils/utils"
import { EventType } from "@/apis/management/resource/v1alpha1/listwatch"
import { namespaceName } from "@/utils/k8s"
import { generateSelector } from "./utils"

export const fetchImages = (setImages: any, advancedParams: any, notification: NotificationInstance): Promise<void> => {
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
                namespace: "",
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

export const fetchDataDisks = (setDataDisks: any, advancedParams: any, notification: NotificationInstance): Promise<void> => {
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
                namespace: "",
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
            notification.success({ message: "DataVolume", description: `删除 "${namespace}/${name}" 数据卷成功` })
            resolve()
        })
        call.response.catch((err: Error) => {
            notification.error({ message: "DataVolume", description: `删除 "${namespace}/${name}" 数据卷失败：${err.message}` })
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
            const msg = generateMessage(completed, `正在删除 "{names}" 数据卷`, `正在删除 "{names}" 等 {count} 个数据卷`)
            notification.success({ key: notificationSuccessKey, message: "DataVolume", description: msg })
        } catch (err: any) {
            failed.push(dv)
            const msg = generateMessage(failed, `删除 "{names}" 数据卷失败`, `删除 "{names}" 等 {count} 个数据卷失败`)
            notification.error({ key: notificationFailedKey, message: "DataVolume", description: msg })
            console.log(err)
        }
        return
    }))
}

export const createWatchImages = (initialImage: Map<string, CustomResourceDefinition>, setImage: (image: Map<string, CustomResourceDefinition>) => void, notification: NotificationInstance) => {
    let image = initialImage

    const updateResource = async (advancedParams: any, abortCtrl: AbortController): Promise<void> => {
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
                        fieldSelector: generateSelector(advancedParams),
                        labelSelector: `${labels.VinkDatavolumeType.name}=image`,
                        limit: 0,
                        continue: "",
                        namespaceNames: [],
                        namespace: advancedParams.namespace,
                        watch: true
                    }
                },
                { abort: abortCtrl.signal }
            )

            call.responses.onMessage((response) => {
                switch (response.eventType) {
                    case EventType.ADDED: {
                        const temp = new Map<string, CustomResourceDefinition>()
                        response.items.forEach((dv) => {
                            temp.set(namespaceName(dv.metadata), dv)
                        })
                        image = temp
                        setImage(temp)
                        break;
                    }
                    case EventType.MODIFIED: {
                        response.items.forEach((dv) => {
                            image.set(namespaceName(dv.metadata), dv)
                        })
                        setImage(new Map(image))
                        break
                    }
                    case EventType.DELETED: {
                        const key = `${response.deleted?.namespace}/${response.deleted?.name}`
                        image.delete(key)
                        setImage(new Map(image))
                        break
                    }
                }
                resolve()
            })

            call.responses.onError((err: Error) => {
                if (!allowedError(err)) {
                    notification.error({
                        message: "DataVolume",
                        description: err.message
                    })
                }
                reject(err.message)
            })
        })
    }

    return updateResource
}

export const createWatchDataDisks = (initialDataDisks: Map<string, CustomResourceDefinition>, setDataDisks: (dataDisks: Map<string, CustomResourceDefinition>) => void, notification: NotificationInstance) => {
    let dataDisks = initialDataDisks

    const updateResource = async (advancedParams: any, abortCtrl: AbortController): Promise<void> => {
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
                        fieldSelector: generateSelector(advancedParams),
                        labelSelector: `${labels.VinkDatavolumeType.name}!=image`,
                        limit: 0,
                        continue: "",
                        namespaceNames: [],
                        namespace: advancedParams.namespace,
                        watch: true
                    }
                },
                { abort: abortCtrl.signal }
            )

            call.responses.onMessage((response) => {
                switch (response.eventType) {
                    case EventType.ADDED: {
                        const temp = new Map<string, CustomResourceDefinition>()
                        response.items.forEach((dv) => {
                            temp.set(namespaceName(dv.metadata), dv)
                        })
                        dataDisks = temp
                        setDataDisks(temp)
                        break;
                    }
                    case EventType.MODIFIED: {
                        response.items.forEach((dv) => {
                            dataDisks.set(namespaceName(dv.metadata), dv)
                        })
                        setDataDisks(new Map(dataDisks))
                        break
                    }
                    case EventType.DELETED: {
                        const key = `${response.deleted?.namespace}/${response.deleted?.name}`
                        dataDisks.delete(key)
                        setDataDisks(new Map(dataDisks))
                        break
                    }
                }
                resolve()
            })

            call.responses.onError((err: Error) => {
                if (!allowedError(err)) {
                    notification.error({
                        message: "DataVolume",
                        description: err.message
                    })
                }
                reject(err.message)
            })
        })
    }

    return updateResource
}

export const createDataVolume = async (crd: CustomResourceDefinition, notification: NotificationInstance): Promise<void> => {
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
            notification.success({ message: "DataVolume", description: `创建 "${crd.metadata?.namespace}/${crd.metadata?.name}" 数据卷成功` })
            resolve()
        })
        call.response.catch((err: Error) => {
            notification.error({ message: "DataVolume", description: `创建 "${crd.metadata?.namespace}/${crd.metadata?.name}" 数据卷失败：${err.message}` })
            reject()
        })
    })
}

