import { Namespace, NamespaceManagement as InternalNamespaceManagement } from "@kubevm.io/vink/management/namespace/v1alpha1/namespace.pb"
import { useCallback, useEffect, useState } from "react"
import { useNamespaceNotification } from '@/components/notification'
import { ListOptions } from "@/utils/search"

function generateOperationSummary(nss: Namespace[], opresult: unknown[]): { type: string, desc: string } {
    const errors = opresult.filter(err => err !== null && err !== undefined)
    const successCount = nss.length - errors.length
    const type = errors.length === 0 ? "success" : errors.length >= nss.length ? "error" : "warning"
    const desc = `Success: ${successCount}, Failed: ${errors.length}`
    return { type, desc }
}

export class NamespaceManagement extends InternalNamespaceManagement {
    constructor() {
        super()
    }

    static async DeleteNamespaceWithNotification(ns: Namespace, showNamespaceNotification: any) {
        try {
            const request = { name: ns.name }
            await InternalNamespaceManagement.DeleteNamespace(request)
            showNamespaceNotification.success("Namespace deleted successfully")
        } catch (err) {
            showNamespaceNotification.error(err)
        }
    }

    static async BatchDeleteNamespaceWithNotification(nss: Namespace[], showNamespaceNotification: any) {
        const result = await Promise.all(nss.map(async (ns) => {
            try {
                const request = { name: ns.name }
                await InternalNamespaceManagement.DeleteNamespace(request)
                return null
            } catch (err) {
                return { ns, err }
            }
        }))

        const errors = result.filter(err => err !== null && err !== undefined)
        const { type, desc } = generateOperationSummary(nss, errors)
        showNamespaceNotification.notify(type, desc)
    }

    static UseNamespaces(initOpts: ListOptions) {
        const [opts, setOpts] = useState<ListOptions>(initOpts)
        const [data, setData] = useState<Namespace[]>([])
        const [loading, setLoading] = useState(true)
        const { notificationContext, showNamespaceNotification } = useNamespaceNotification()

        const fetchData = useCallback(async () => {
            setLoading(true)
            try {
                const request = {
                    namespace: opts.namespace,
                    options: opts.opts,
                }
                const response = await InternalNamespaceManagement.ListNamespaces(request)
                setData(response.items || [])
                // showDataVolumeNotification.success(`Fetched ${response.items?.length || 0} virtual machines`)
            } catch (err) {
                showNamespaceNotification.error(err)
            } finally {
                setLoading(false)
            }
        }, [opts])

        useEffect(() => {
            fetchData()
        }, [fetchData])

        return { opts, setOpts, data, loading, fetchData, notificationContext }
    }
}
