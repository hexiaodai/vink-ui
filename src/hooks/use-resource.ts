import { useCallback, useEffect, useRef, useState } from "react"
import { clients } from "@/clients/clients"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { NotificationInstance } from "antd/lib/notification/interface"
import { ListOptions } from "@/apis/types/list_options"
import { allowedError } from "@/utils/utils"
import { EventType } from "@/apis/management/resource/v1alpha1/listwatch"
import { namespaceNameKey } from "@/utils/k8s"
import useUnmount from "./use-unmount"
import { App } from "antd"
import { useNamespaceFromURL } from "./use-namespace-from-url"

export interface ListWatchOptions {
    namespace?: string
    fieldSelector?: string
    labelSelector?: string
    customFieldSelector?: string[]
    // notification?: NotificationInstance
    // abortCtrl?: AbortController
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

export const useListResources = (gvr: GroupVersionResourceEnum, opts?: ListWatchOptions) => {
    const abortCtrl = new AbortController()

    const { notification } = App.useApp()

    const [resources, setResources] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        const call = clients.watch.listWatch({
            groupVersionResource: {
                option: {
                    oneofKind: "enum",
                    enum: gvr
                }
            },
            options: emptyOptions({
                fieldSelector: opts?.fieldSelector,
                labelSelector: opts?.labelSelector,
                customSelector: {
                    namespaceNames: [],
                    fieldSelector: opts?.customFieldSelector || []
                },
                watch: false
            })
        }, { abort: abortCtrl.signal })

        const handleResponse = (response: any) => {
            let items: any[] = []
            response.items.forEach((item: any) => {
                items.push(JSON.parse(item))
            })
            setResources(items)
            setError(null)
        }

        const handleError = (err: Error) => {
            notification.error({ message: "Data fetching failed", description: err.message })
            setError(err.message)
        }

        call.responses.onMessage(handleResponse)
        call.responses.onError(handleError)
    }, [gvr, opts])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    useUnmount(() => {
        console.log('useListResources: Component is unmounting and aborting operation')
        abortCtrl.abort()
    })

    return { resources, error }
}

export const useWatchResources = (gvr: GroupVersionResourceEnum, opts?: ListWatchOptions) => {
    const abortCtrl = useRef<AbortController>()

    const { notification } = App.useApp()

    const [loading, setLoading] = useState(true)

    const [resources, setResources] = useState<Map<string, any>>(new Map())
    const fetchData = useCallback(async () => {
        setLoading(true)

        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()

        const call = clients.watch.listWatch(
            {
                groupVersionResource: {
                    option: {
                        oneofKind: "enum",
                        enum: gvr
                    }
                },
                options: emptyOptions({
                    labelSelector: opts?.labelSelector,
                    fieldSelector: opts?.fieldSelector,
                    namespace: opts?.namespace,
                    watch: true
                })
            }, { abort: abortCtrl.current.signal })

        call.responses.onMessage((response) => {
            switch (response.eventType) {
                case EventType.ADDED: {
                    const temp = new Map<string, any>()
                    response.items.forEach((data) => {
                        const crd = JSON.parse(data)
                        temp.set(namespaceNameKey(crd), crd)
                    })
                    setResources(temp)
                    break
                }
                case EventType.MODIFIED: {
                    response.items.forEach((data) => {
                        const crd = JSON.parse(data)
                        setResources((prevResources) => {
                            const updatedResources = new Map(prevResources)
                            updatedResources.set(namespaceNameKey(crd), crd)
                            return updatedResources
                        })
                    })
                    break
                }
                case EventType.DELETED: {
                    setResources((prevResources) => {
                        const updatedResources = new Map(prevResources)
                        updatedResources.delete(namespaceNameKey(response.deleted))
                        return updatedResources
                    })
                    break
                }
            }
            setLoading(false)
        })

        call.responses.onError((err: Error) => {
            if (allowedError(err)) {
                return
            }
            notification.error({
                message: "",
                description: err.message
            })
            setLoading(false)
        })
    }, [gvr, opts])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    useUnmount(() => {
        setLoading(false)
        abortCtrl.current?.abort()
    })

    return { resources, loading }
}

export const useWatchResourceInNamespaceName = (gvr: GroupVersionResourceEnum) => {
    const [resource, setResource] = useState<any>(null)
    const namespaceName = useNamespaceFromURL()

    const opts = useRef<ListWatchOptions>({ fieldSelector: `metadata.namespace=${namespaceName.namespace},metadata.name=${namespaceName.name}` })

    const { resources, loading } = useWatchResources(gvr, opts.current)

    useEffect(() => {
        const resourceData = resources.get(namespaceNameKey(namespaceName))
        setResource(resourceData)
    }, [resources])

    return { resource, loading }
}

const emptyOptions = (overrides: Partial<ListOptions> = {}): ListOptions => {
    return Object.assign({}, {
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
    }, overrides)
}
