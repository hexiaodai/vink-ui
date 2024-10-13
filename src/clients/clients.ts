import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport"
import { ResourceListWatchManagementClient } from "@/apis/management/resource/v1alpha1/listwatch.client"
import { VirtualMachineManagementClient } from "@/apis/management/virtualmachine/v1alpha1/virtualmachine.client"
import { ResourceManagementClient } from "@/apis/management/resource/v1alpha1/resource.client"
import { NotificationInstance } from "antd/es/notification/interface"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import { EventType } from "@/apis/management/resource/v1alpha1/listwatch"
import { namespaceName } from "@/utils/k8s"
import { allowedError, generateMessage } from "@/utils/utils"
import { ListOptions } from "@/apis/types/list_options"

interface ListWatchOptions {
    namespace?: string
    fieldSelector?: string
    labelSelector?: string
    notification?: NotificationInstance
    abortCtrl?: AbortController
}

interface DeleteOptions {
    notification?: NotificationInstance
}

interface CreateOptions {
    notification?: NotificationInstance
}

class Clients {
    private static instance: Clients

    readonly resourceWatch: ResourceListWatchManagementClient
    readonly resource: ResourceManagementClient
    readonly virtualmachine: VirtualMachineManagementClient

    private constructor() {
        const transport = new GrpcWebFetchTransport({
            baseUrl: window.location.origin
        })

        this.resourceWatch = new ResourceListWatchManagementClient(transport)
        this.resource = new ResourceManagementClient(transport)
        this.virtualmachine = new VirtualMachineManagementClient(transport)
    }

    public static getInstance(): Clients {
        if (!Clients.instance) {
            Clients.instance = new Clients()
        }
        return Clients.instance
    }

    public listResources = (gvr: GroupVersionResourceEnum, setResources: any, opts: ListWatchOptions): Promise<void> => {
        return new Promise((resolve, reject) => {
            const call = this.resourceWatch.listWatch({
                groupVersionResource: {
                    option: {
                        oneofKind: "enum",
                        enum: gvr
                    }
                },
                options: emptyOptions({
                    fieldSelector: opts.fieldSelector,
                    labelSelector: opts.labelSelector,
                    watch: false
                })
            },
                { abort: opts.abortCtrl?.signal }
            )

            call.responses.onMessage((response) => {
                setResources(response.items)
                resolve()
            })

            call.responses.onError((err: Error) => {
                opts.notification?.error({ message: "", description: err.message })
                reject(err.message)
            })
        })
    }

    public createWatchResource = (gvr: GroupVersionResourceEnum, setResources: (resource: Map<string, CustomResourceDefinition>) => void) => {
        let resources = new Map<string, CustomResourceDefinition>()

        const watchResource = async (opts: ListWatchOptions): Promise<void> => {
            return new Promise((resolve, reject) => {
                const call = this.resourceWatch.listWatch(
                    {
                        groupVersionResource: {
                            option: {
                                oneofKind: "enum",
                                enum: gvr
                            }
                        },
                        options: emptyOptions({
                            labelSelector: opts.labelSelector,
                            fieldSelector: opts.fieldSelector,
                            namespace: opts.namespace,
                            watch: true
                        })
                    },
                    { abort: opts.abortCtrl?.signal }
                )

                call.responses.onMessage((response) => {
                    switch (response.eventType) {
                        case EventType.ADDED: {
                            const temp = new Map<string, CustomResourceDefinition>()
                            response.items.forEach((crd) => {
                                temp.set(namespaceName(crd.metadata), crd)
                            })
                            resources = temp
                            setResources(temp)
                            break
                        }
                        case EventType.MODIFIED: {
                            response.items.forEach((crd) => {
                                resources.set(namespaceName(crd.metadata), crd)
                            })
                            setResources(new Map(resources))
                            break
                        }
                        case EventType.DELETED: {
                            const key = `${response.deleted?.namespace}/${response.deleted?.name}`
                            resources.delete(key)
                            setResources(new Map(resources))
                            break
                        }
                    }
                    resolve()
                })

                call.responses.onError((err: Error) => {
                    if (!allowedError(err)) {
                        opts.notification?.error({
                            message: "",
                            description: err.message
                        })
                    }
                    reject(err.message)
                })
            })
        }

        return watchResource
    }

    public deleteResource = (gvr: GroupVersionResourceEnum, namespace: string, name: string, opts: DeleteOptions): Promise<void> => {
        return new Promise((resolve, reject) => {
            const call = this.resource.delete({
                namespaceName: { namespace: namespace, name: name },
                groupVersionResource: {
                    option: {
                        oneofKind: "enum",
                        enum: gvr
                    }
                }
            })
            call.then(() => {
                opts.notification?.success({ message: "", description: `删除 "${namespace}/${name}" 资源成功` })
                resolve()
            })
            call.response.catch((err: Error) => {
                opts.notification?.error({ message: "", description: `删除 "${namespace}/${name}" 资源失败：${err.message}` })
                reject()
            })
        })
    }

    public batchDeleteResources = async (gvr: GroupVersionResourceEnum, resources: CustomResourceDefinition[], opts: DeleteOptions) => {
        const completed: CustomResourceDefinition[] = []
        const failed: CustomResourceDefinition[] = []
        const notificationSuccessKey = "batch-delete-resources-success"
        const notificationFailedKey = "batch-delete-resources-failed"

        await Promise.all(resources.map(async (crd) => {
            const namespace = crd.metadata?.namespace!
            const name = crd.metadata?.name!

            try {
                await clients.resource.delete({
                    namespaceName: { namespace: namespace, name: name },
                    groupVersionResource: {
                        option: {
                            oneofKind: "enum",
                            enum: gvr
                        }
                    }
                }).response
                completed.push(crd)
                const msg = generateMessage(completed, `正在删除 "{names}" 资源`, `正在删除 "{names}" 等 {count} 个资源`)
                opts.notification?.success({ key: notificationSuccessKey, message: "", description: msg })
            } catch (err: any) {
                failed.push(crd)
                const msg = generateMessage(failed, `删除 "{names}" 资源失败`, `删除 "{names}" 等 {count} 个资源失败`)
                opts.notification?.error({ key: notificationFailedKey, message: "", description: msg })
                console.log(err)
            }
            return
        }))
    }

    public createResource = async (gvr: GroupVersionResourceEnum, crd: CustomResourceDefinition, opts: CreateOptions): Promise<void> => {
        const data = JSON.stringify(crd)
        return new Promise((resolve, reject) => {
            const call = this.resource.create({
                groupVersionResource: {
                    option: {
                        oneofKind: "enum",
                        enum: gvr
                    }
                },
                data: data
            })

            call.then(() => {
                opts.notification?.success({ message: "", description: `创建 "${crd.metadata?.namespace}/${crd.metadata?.name}" 资源成功` })
                resolve()
            })
            call.response.catch((err: Error) => {
                opts.notification?.error({ message: "", description: `创建 "${crd.metadata?.namespace}/${crd.metadata?.name}" 资源失败：${err.message}` })
                reject()
            })
        })
    }
}

export const clients = Clients.getInstance()


const emptyOptions = (overrides: Partial<ListOptions> = {}): ListOptions => {
    const defaults: ListOptions = {
        fieldSelector: "",
        labelSelector: "",
        limit: 0,
        continue: "",
        customSelector: {
            namespaceNames: [],
            fieldSelector: [],
        },
        namespace: "",
        watch: false,
    }

    return {
        ...defaults,
        ...overrides
    }
}