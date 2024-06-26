import { DataVolume, DataVolumeManagement, ListDataVolumesRequest } from "@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb"
import { ListOptions } from "@/utils/search"
import { useCallback, useEffect, useRef, useState } from "react"

export const useDataVolumes = (initOpts: ListOptions) => {
    const [opts, setOpts] = useState<ListOptions>(initOpts)
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<DataVolume[]>([])
    const [error, setError] = useState<string>()
    // const fetching = useRef(false)

    const fetchData = useCallback(async () => {
        // if (fetching.current) return

        // fetching.current = true
        setLoading(true)
        setError(undefined)

        try {
            const request: ListDataVolumesRequest = {
                namespace: opts.namespace,
                options: opts.opts,
            }
            const response = await DataVolumeManagement.ListDataVolumes(request)
            setData(response.items || [])
        } catch (err) {
            setError(String(err) || 'Error fetching data')
        } finally {
            setLoading(false)
            // fetching.current = false
        }
    }, [opts])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return { opts, setOpts, data, loading, error, fetchData }
}
