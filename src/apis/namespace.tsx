import { ListNamespacesRequest, Namespace, NamespaceManagement } from "@kubevm.io/vink/management/namespace/v1alpha1/namespace.pb"
import { ListOptions } from "@/utils/search"
import { useCallback, useEffect, useState } from "react"
import { useErrorNotification } from '@/common/notification'

export const useNamespaces = (initOpts: ListOptions) => {
    const [opts, setOpts] = useState<ListOptions>(initOpts)
    const [data, setData] = useState<Namespace[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>()

    const { contextHolder, showErrorNotification } = useErrorNotification()

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(undefined)
        try {
            const request: ListNamespacesRequest = {
                options: opts.opts,
            }
            const response = await NamespaceManagement.ListNamespaces(request)
            setData(response.items || [])
        } catch (err) {
            setError(String(err) || 'Error fetching data')
            showErrorNotification('Fetch namespaces', err)
        } finally {
            setLoading(false)
        }
    }, [opts])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return { opts, setOpts, data, loading, error, fetchData, contextHolder }
}
