import { useCallback, useEffect, useRef, useState } from "react"
import { clients, getResourceName } from "@/clients/clients"
import { ResourceType } from "@/clients/ts/types/types"
import { isAbortedError } from "@/utils/utils"
import { EventType, WatchOptions } from "@/clients/ts/management/resource/v1alpha1/watch"
import { namespaceNameKey } from "@/utils/k8s"
import { App } from "antd"
import { useNamespaceFromURL } from "./use-query-params-from-url"
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
    console.log("Watching resources", getResourceName(resourceType), opts)
    const abortCtrl = useRef<AbortController>(new AbortController())
    const initResourceRef = useRef(false)
    const { notification } = App.useApp()

    const [loading, setLoading] = useState(true)
    const [resources, setResources] = useState<Map<string, any>>(new Map())

    const fetchData = useCallback(async () => {
        console.log("Fetching data", getResourceName(resourceType), opts)
        setLoading(true)
        initResourceRef.current = true
        abortCtrl.current.abort()
        abortCtrl.current = new AbortController()

        const call = clients.watch.watch({
            resourceType: resourceType,
            options: WatchOptions.create(opts),
        }, { abort: abortCtrl.current.signal })

        call.responses.onMessage((response) => {
            switch (response.eventType) {
                case EventType.ADDED:
                case EventType.MODIFIED: {
                    if (response.items.length === 0 && initResourceRef.current && resources.size > 0) {
                        setResources(new Map())
                    }
                    response.items.forEach((data) => {
                        const crd = JSON.parse(data)
                        setResources((prevResources) => {
                            const updatedResources = initResourceRef.current ? new Map() : new Map(prevResources)
                            initResourceRef.current = false
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
            setLoading(false)
            if (isAbortedError(err)) {
                return
            }
            notification.error({
                message: "Failed to watcher resources",
                description: err.message
            })
        })
    }, [opts])

    useEffect(() => {
        if (pause) {
            return
        }
        fetchData()
    }, [fetchData, pause])

    useUnmount(() => {
        console.log("Unmounting watcher", getResourceName(resourceType))
        setLoading(false)
        abortCtrl.current?.abort()
    })

    return { resources, loading }
}

export const useWatchResourceInNamespaceName = (resourceType: ResourceType) => {
    const [resource, setResource] = useState<any>(null)
    const namespaceName = useNamespaceFromURL()

    const selector = {
        fieldSelectorGroup: {
            operator: "&&",
            fieldSelectors: [
                {
                    fieldPath: 'metadata.name',
                    operator: '=',
                    values: [namespaceName.name]
                }
            ]
        }
    }
    if (namespaceName.namespace.length > 0) {
        selector.fieldSelectorGroup.fieldSelectors.unshift({
            fieldPath: 'metadata.namespace',
            operator: '=',
            values: [namespaceName.namespace]
        })
    }

    const opts = useRef<WatchOptions>(WatchOptions.create(selector))

    const { resources, loading } = useWatchResources(resourceType, opts.current)

    useEffect(() => {
        const resourceData = resources.get(namespaceNameKey(namespaceName))
        setResource(resourceData)
    }, [resources])

    return { resource, loading }
}
