import { useCallback, useEffect, useRef, useState } from "react"
import { clients } from "@/clients/clients"
import { ResourceType } from "@/clients/ts/types/types"
import { allowedError } from "@/utils/utils"
import { EventType, WatchOptions } from "@/clients/ts/management/resource/v1alpha1/watch"
import { namespaceNameKey } from "@/utils/k8s"
import { App } from "antd"
import { useNamespaceFromURL } from "./use-namespace-from-url"
import { ListOptions } from "@/clients/ts/management/resource/v1alpha1/resource"
import useUnmount from "./use-unmount"

export const useListResources = (resourceType: ResourceType, opts?: ListOptions) => {
    const { notification } = App.useApp()

    const [resources, setResources] = useState<any[]>([])
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        const call = clients.listResources(resourceType, ListOptions.create(opts))
        call.then(crds => {
            setResources(crds)
            setError(null)
        }).catch(err => {
            notification.error({ message: "Data fetching failed", description: err.message })
            setError(err.message)
        })
    }, [opts])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return { resources, error }
}

export const useWatchResources = (resourceType: ResourceType, opts?: WatchOptions, pause?: boolean) => {
    const abortCtrl = useRef<AbortController>()

    const needClean = useRef(false)

    const { notification } = App.useApp()

    const [loading, setLoading] = useState(true)

    const [resources, setResources] = useState<Map<string, any>>(new Map())

    const fetchData = useCallback(async () => {
        setLoading(true)
        needClean.current = true

        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()

        console.log("fetchDatafetchDatafetchDatafetchDatafetchData", opts)

        const call = clients.watch.watch({
            resourceType: resourceType,
            options: WatchOptions.create(opts),
        }, { abort: abortCtrl.current.signal })

        call.responses.onMessage((response) => {
            switch (response.eventType) {
                case EventType.ADDED:
                case EventType.MODIFIED: {
                    if (response.items.length === 0 && needClean.current && resources.size > 0) {
                        setResources(new Map())
                    }
                    response.items.forEach((data) => {
                        const crd = JSON.parse(data)
                        setResources((prevResources) => {
                            const updatedResources = needClean.current ? new Map() : new Map(prevResources)
                            needClean.current = false
                            updatedResources.set(namespaceNameKey(crd), crd)
                            return updatedResources
                        })
                    })
                    break
                }
                case EventType.DELETED: {
                    response.items.forEach((data) => {
                        const crd = JSON.parse(data)
                        setResources((prevResources) => {
                            const updatedResources = new Map(prevResources)
                            updatedResources.delete(namespaceNameKey(crd))
                            return updatedResources
                        })
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
        if (pause) {
            return
        }
        fetchData()
    }, [fetchData, pause])

    useUnmount(() => {
        setLoading(false)
        abortCtrl.current?.abort()
    })

    return { resources, loading }
}

export const useWatchResourceInNamespaceName = (resourceType: ResourceType) => {
    const [resource, setResource] = useState<any>(null)
    const namespaceName = useNamespaceFromURL()

    const opts = useRef<WatchOptions>(WatchOptions.create({
        fieldSelectorGroup: {
            operator: "&&",
            fieldSelectors: [
                {
                    fieldPath: 'metadata.namespace',
                    operator: '=',
                    values: [namespaceName.namespace]
                },
                {
                    fieldPath: 'metadata.name',
                    operator: '=',
                    values: [namespaceName.name]
                }
            ]
        }
    }))

    const { resources, loading } = useWatchResources(resourceType, opts.current)

    useEffect(() => {
        const resourceData = resources.get(namespaceNameKey(namespaceName))
        setResource(resourceData)
    }, [resources])

    return { resource, loading }
}


export const useWatchResourceInName = (resourceType: ResourceType) => {
    const [resource, setResource] = useState<any>(null)
    const namespaceName = useNamespaceFromURL()

    const opts = useRef<WatchOptions>(WatchOptions.create({
        fieldSelectorGroup: {
            fieldSelectors: [
                {
                    fieldPath: 'metadata.name',
                    operator: '=',
                    values: [namespaceName.name]
                }
            ]
        }
    }))

    const { resources, loading } = useWatchResources(resourceType, opts.current)

    useEffect(() => {
        const resourceData = resources.get(namespaceNameKey(namespaceName))
        setResource(resourceData)
    }, [resources])

    return { resource, loading }
}
