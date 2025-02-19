import { useEffect, useRef, useState } from "react"
import { KubeResource, watch, watchSingle } from "@/clients/clients"
import { ResourceType } from "@/clients/ts/types/types"
import { useNamespaceNameFromURL } from "./use-query-params-from-url"
import useUnmount from "@/hooks/use-unmount"
import { WatchOptions } from "@/clients/ts/management/resource/v1alpha1/watch"

export const useWatchResource = <T extends KubeResource>(resourceType: ResourceType) => {
    const nn = useNamespaceNameFromURL()

    const [resource, setResource] = useState<T>()
    const [loading, setLoading] = useState(true)

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        if (!nn) {
            return
        }

        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()

        watchSingle<T>(resourceType, nn, setResource, abortCtrl.current.signal, setLoading)

        return () => abortCtrl.current?.abort()
    }, [resourceType, nn])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    return { resource, loading }
}

export const useWatchResources = <T extends KubeResource>(resourceType: ResourceType, opts: WatchOptions) => {
    const [resources, setResources] = useState<T[]>()
    const [loading, setLoading] = useState(true)

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()

        watch<T>(resourceType, setResources, abortCtrl.current.signal, opts, setLoading, undefined)

        return () => abortCtrl.current?.abort()
    }, [resourceType, opts])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    return { resources, loading }
}
