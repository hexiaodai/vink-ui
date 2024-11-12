import { useCallback, useEffect, useRef, useState } from "react"
import { clients, emptyOptions } from "@/clients/clients"
import { ResourceType } from "@/apis/types/group_version"
import { ListOptions } from "@/apis/types/list_options"
import { allowedError, getErrorMessage, resourceTypeName } from "@/utils/utils"
import { EventType } from "@/apis/management/resource/v1alpha1/listwatch"
import { namespaceNameKey } from "@/utils/k8s"
import { App, Modal } from "antd"
import { useNamespaceFromURL } from "./use-namespace-from-url"
import useUnmount from "./use-unmount"
import { NamespaceName } from "@/apis/types/namespace_name"

export interface ListWatchOptions {
    namespace?: string
    fieldSelector?: string
    labelSelector?: string
    customFieldSelector?: string[]
}

export const useListResources = (resourceType: ResourceType, opts?: ListOptions) => {
    const abortCtrl = new AbortController()

    const { notification } = App.useApp()

    const [resources, setResources] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        const call = clients.watch.listWatch({
            resourceType: resourceType,
            options: emptyOptions({ ...opts, watch: false })
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
    }, [opts])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    useUnmount(() => {
        console.log('useListResources: Component is unmounting and aborting operation')
        abortCtrl.abort()
    })

    return { resources, error }
}

export const useWatchResources = (resourceType: ResourceType, opts?: ListOptions) => {
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
                resourceType: resourceType,
                options: emptyOptions({ ...opts, watch: true }),
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
                message: "Failed to watcher resources",
                description: err.message
            })
            setLoading(false)
        })
    }, [opts])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    useUnmount(() => {
        setLoading(false)
        abortCtrl.current?.abort()
    })

    return { resources, loading }
}

export const useWatchResourceInNamespaceName = (resourceType: ResourceType) => {
    const [resource, setResource] = useState<any>(null)
    const namespaceName = useNamespaceFromURL()

    const opts = useRef<ListOptions>(emptyOptions({ fieldSelector: `metadata.namespace=${namespaceName.namespace},metadata.name=${namespaceName.name}` }))

    const { resources, loading } = useWatchResources(resourceType, opts.current)

    useEffect(() => {
        const resourceData = resources.get(namespaceNameKey(namespaceName))
        setResource(resourceData)
    }, [resources])

    return { resource, loading }
}

export const useDeleteResource = (resourceType: ResourceType, namespaceName: NamespaceName) => {
    const { notification } = App.useApp()
    const [loading, setLoading] = useState(true)

    const resourceName = resourceTypeName.get(resourceType)

    Modal.confirm({
        title: `删除 ${resourceName}？`,
        content: `即将删除 "${namespaceNameKey(namespaceName)}" ${resourceName}，请确认。`,
        okText: '确认删除',
        okType: 'danger',
        cancelText: '取消',
        okButtonProps: {
            disabled: false,
        },
        onOk: async () => {
            setLoading(true)
            try {
                await clients.resource.delete({ resourceType: resourceType, namespaceName: namespaceName })
            } catch (err) {
                notification.error({ message: "删除失败", description: getErrorMessage(err) })
            } finally {
                setLoading(false)
            }
        }
    })

    return loading
}

export const useConfirmDeleteResource = () => {
    const { notification } = App.useApp()
    const [loading, setLoading] = useState(false)

    const confirmDelete = (resourceType: ResourceType, namespaceName: NamespaceName) => {
        const resourceName = resourceTypeName.get(resourceType)

        Modal.confirm({
            title: `Delete ${resourceName}?`,
            content: `Are you sure you want to delete "${namespaceNameKey(namespaceName)}" ${resourceName}? This action cannot be undone.`,
            okText: "Delete",
            okType: "danger",
            cancelText: "Cancel",
            onOk: async () => {
                setLoading(true)
                try {
                    await clients.resource.delete({ resourceType, namespaceName })
                    notification.success({ message: `${resourceName} deleted successfully` })
                } catch (err) {
                    notification.error({
                        message: `Failed to delete ${resourceName}`,
                        description: getErrorMessage(err)
                    })
                } finally {
                    setLoading(false)
                }
            }
        })
    }

    return { loading, confirmDelete }
}
