import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport"
import { ResourceListWatchManagementClient } from "@/apis/management/resource/v1alpha1/listwatch.client"
import { VirtualMachineManagementClient } from "@/apis/management/virtualmachine/v1alpha1/virtualmachine.client"
import { ResourceManagementClient } from "@/apis/management/resource/v1alpha1/resource.client"
import { NotificationInstance } from "antd/es/notification/interface"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { EventType } from "@/apis/management/resource/v1alpha1/listwatch"
import { namespaceNameKey } from "@/utils/k8s"
import { allowedError, generateMessage } from "@/utils/utils"
import { ListOptions } from "@/apis/types/list_options"
import { NamespaceName } from "@/apis/types/namespace_name"

interface ListWatchOptions {
    namespace?: string
    fieldSelector?: string
    labelSelector?: string
    notification?: NotificationInstance
    abortCtrl?: AbortController
    customFieldSelector?: string[]
}

interface DeleteOptions {
    notification?: NotificationInstance
}

interface CreateOptions {
    notification?: NotificationInstance
}

interface GetOptions {
    notification?: NotificationInstance
}

interface UpdateOptions {
    notification?: NotificationInstance
    setResource?: any
}

class Clients {
    private static instance: Clients

    readonly watch: ResourceListWatchManagementClient
    readonly resource: ResourceManagementClient
    readonly virtualmachine: VirtualMachineManagementClient

    private constructor() {
        const transport = new GrpcWebFetchTransport({
            baseUrl: window.location.origin
        })

        this.watch = new ResourceListWatchManagementClient(transport)
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
            const call = this.watch.listWatch({
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

    public createWatchResource = (gvr: GroupVersionResourceEnum, setResources: (resource: Map<string, any>) => void) => {
        let resources = new Map<string, any>()

        const watchResource = async (opts: ListWatchOptions): Promise<void> => {
            return new Promise((resolve, reject) => {
                const call = this.watch.listWatch(
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
                            const temp = new Map<string, any>()
                            response.items.forEach((data) => {
                                const crd = JSON.parse(data)
                                temp.set(namespaceNameKey(crd), crd)
                            })
                            resources = temp
                            setResources(temp)
                            break
                        }
                        case EventType.MODIFIED: {
                            response.items.forEach((data) => {
                                const crd = JSON.parse(data)
                                resources.set(namespaceNameKey(crd), crd)
                            })
                            setResources(new Map(resources))
                            break
                        }
                        case EventType.DELETED: {
                            resources.delete(namespaceNameKey(response.deleted))
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

    public batchDeleteResources = async (gvr: GroupVersionResourceEnum, resources: string[], opts: DeleteOptions) => {
        const completed: string[] = []
        const failed: string[] = []
        const notificationSuccessKey = "batch-delete-resources-success"
        const notificationFailedKey = "batch-delete-resources-failed"

        await Promise.all(resources.map(async (data) => {
            const crd = JSON.parse(data)
            // const crd = jsonParse(data)
            const namespace = crd.metadata.namespace
            const name = crd.metadata.name

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

    public createResource = async (gvr: GroupVersionResourceEnum, crd: any, opts: CreateOptions): Promise<void> => {
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
                opts.notification?.success({ message: "", description: `创建 "${crd.metadata.namespace}/${crd.metadata.name}" 资源成功` })
                resolve()
            })
            call.response.catch((err: Error) => {
                opts.notification?.error({ message: "", description: `创建 "${crd.metadata.namespace}/${crd.metadata.name}" 资源失败：${err.message}` })
                reject()
            })
        })
    }

    public updateResource = async (gvr: GroupVersionResourceEnum, crd: any, opts: UpdateOptions): Promise<void> => {
        const data = JSON.stringify(crd)
        return new Promise((resolve, reject) => {
            const call = this.resource.update({
                groupVersionResource: {
                    option: {
                        oneofKind: "enum",
                        enum: gvr
                    }
                },
                data: data
            })

            call.then((result) => {
                opts.notification?.success({ message: "", description: `更新 "${crd.metadata.namespace}/${crd.metadata.name}" 资源成功` })
                opts.setResource?.(JSON.parse(result.response.data))
                resolve()
            })
            call.response.catch((err: Error) => {
                opts.notification?.error({ message: "", description: `更新 "${crd.metadata.namespace}/${crd.metadata.name}" 资源失败：${err.message}` })
                reject()
            })
        })
    }

    public updateResourceAsync = async (gvr: GroupVersionResourceEnum, crd: any): Promise<any> => {
        const data = JSON.stringify(crd)
        return new Promise((resolve, reject) => {
            const call = this.resource.update({
                groupVersionResource: {
                    option: {
                        oneofKind: "enum",
                        enum: gvr
                    }
                },
                data: data
            })

            call.then((result) => {
                resolve(JSON.parse(result.response.data))
            })
            call.response.catch((err: Error) => {
                reject(err)
            })
        })
    }

    public getResource = async (gvr: GroupVersionResourceEnum, namespaceName: NamespaceName, setResource: any, opts: GetOptions): Promise<void> => {
        return new Promise((resolve, reject) => {
            const call = this.resource.get({
                groupVersionResource: {
                    option: {
                        oneofKind: "enum",
                        enum: gvr
                    }
                },
                namespaceName: namespaceName
            })

            call.then((result) => {
                setResource(JSON.parse(result.response.data))
                resolve()
            })
            call.response.catch((err: Error) => {
                opts.notification?.error({ message: "", description: `获取 "${namespaceName.namespace}/${namespaceName.name}" 资源失败：${err.message}` })
                reject()
            })
        })
    }

    public fetchResource = async (gvr: GroupVersionResourceEnum, namespaceName: NamespaceName): Promise<any> => {
        return new Promise((resolve, reject) => {
            const call = this.resource.get({
                groupVersionResource: {
                    option: {
                        oneofKind: "enum",
                        enum: gvr
                    }
                },
                namespaceName: namespaceName
            })

            call.then((result) => {
                resolve(JSON.parse(result.response.data))
            })
            call.response.catch((err: Error) => {
                reject(err)
            })
        })
    }

    public fetchResources = async (gvr: GroupVersionResourceEnum, opts?: ListWatchOptions): Promise<any> => {
        return new Promise((resolve, reject) => {
            const call = this.watch.listWatch({
                groupVersionResource: {
                    option: {
                        oneofKind: "enum",
                        enum: gvr
                    }
                },
                options: emptyOptions({
                    namespace: opts?.namespace,
                    fieldSelector: opts?.fieldSelector,
                    labelSelector: opts?.labelSelector,
                    customSelector: {
                        namespaceNames: [],
                        fieldSelector: opts?.customFieldSelector || []
                    },
                    watch: false
                })
            })

            call.responses.onMessage((response) => {
                let items: any[] = []
                response.items.forEach((item: any) => {
                    items.push(JSON.parse(item))
                })
                resolve(items)
            })

            call.responses.onError((err: Error) => {
                reject(err)
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