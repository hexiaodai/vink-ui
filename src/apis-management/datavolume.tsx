import { CreateDataVolumeRequest, DataVolume, DataVolumeManagement as InternalDataVolumeManagement } from "@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb"
import { ListOptions } from "@/utils/search"
import { useCallback, useEffect, useState } from "react"
import { useDataVolumeNotification } from "@/components/notification"

function generateOperationSummary(dvs: DataVolume[], opresult: unknown[]): { type: string, desc: string } {
    const errors = opresult.filter(err => err !== null && err !== undefined)
    const successCount = dvs.length - errors.length
    const type = errors.length === 0 ? "success" : errors.length >= dvs.length ? "error" : "warning"
    const desc = `Success: ${successCount}, Failed: ${errors.length}`
    return { type, desc }
}

export class DataVolumeManagement extends InternalDataVolumeManagement {
    constructor() {
        super()
    }

    static async DeleteDataVolumeWithNotification(dv: DataVolume, showDataVolumeNotification: any) {
        try {
            const request = { namespace: dv.namespace, name: dv.name }
            await InternalDataVolumeManagement.DeleteDataVolume(request)
            showDataVolumeNotification.success("Data volume deleted successfully")
        } catch (err) {
            showDataVolumeNotification.error(err)
        }
    }

    static async CreateDataVolumeWithNotification(request: CreateDataVolumeRequest, showDataVolumeNotification: any) {
        try {
            await InternalDataVolumeManagement.CreateDataVolume(request)
            showDataVolumeNotification.success("Data volume create successfully")
            return Promise.resolve()
        } catch (err) {
            showDataVolumeNotification.error(err)
            return Promise.reject(new Error(`failed to create data volume: ${err}`))
        }
    }

    static async BatchDeleteDataVolumesWithNotification(dvs: DataVolume[], showDataVolumeNotification: any) {
        const result = await Promise.all(dvs.map(async (dv) => {
            try {
                const request = { namespace: dv.namespace, name: dv.name }
                await InternalDataVolumeManagement.DeleteDataVolume(request)
                return null
            } catch (err) {
                return { dv, err }
            }
        }))

        const errors = result.filter(err => err !== null && err !== undefined)
        const { type, desc } = generateOperationSummary(dvs, errors)
        showDataVolumeNotification.notify(type, desc)
    }

    static UseDataVolumes(initOpts: ListOptions) {
        const [opts, setOpts] = useState<ListOptions>(initOpts)
        const [data, setData] = useState<DataVolume[]>([])
        const [loading, setLoading] = useState(true)
        const { notificationContext, showDataVolumeNotification } = useDataVolumeNotification()

        const fetchData = useCallback(async () => {
            setLoading(true)
            try {
                const request = {
                    namespace: opts.namespace,
                    options: opts.opts,
                }
                const response = await InternalDataVolumeManagement.ListDataVolumes(request)
                setData(response.items || [])
                // showDataVolumeNotification.success(`Fetched ${response.items?.length || 0} virtual machines`)
            } catch (err) {
                showDataVolumeNotification.error(err)
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
