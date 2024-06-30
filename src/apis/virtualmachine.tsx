import { ListVirtualMachinesRequest, VirtualMachine, VirtualMachineManagement } from "@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb"
import { ListOptions } from "@/utils/search"
import { useCallback, useEffect, useState } from "react"
import { useErrorNotification } from '@/components/notification'

export const useVirtualMachines = (initOpts: ListOptions) => {
    const [opts, setOpts] = useState<ListOptions>(initOpts)
    const [data, setData] = useState<VirtualMachine[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>()

    const { contextHolder, showErrorNotification } = useErrorNotification()

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(undefined)
        try {
            const request: ListVirtualMachinesRequest = {
                namespace: opts.namespace,
                options: opts.opts,
            }
            const response = await VirtualMachineManagement.ListVirtualMachines(request)
            setData(response.items || [])
        } catch (err) {
            setError(String(err) || 'Error fetching data')
            showErrorNotification('Fetch virtual machines', err)
        } finally {
            setLoading(false)
        }
    }, [opts])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return { opts, setOpts, data, loading, error, fetchData, contextHolder }
}
