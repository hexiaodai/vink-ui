import { App } from "antd"
import { DetailYaml } from "@/components/detail-yaml"
import { useNamespaceFromURL } from "@/hooks/use-query-params-from-url"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { DataVolume, updateDataVolume, watchDataVolume } from "@/clients/data-volume"
import useUnmount from "@/hooks/use-unmount"

export default () => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const ns = useNamespaceFromURL()

    const [loading, setLoading] = useState(true)

    const [dataVolume, setDataVolume] = useState<DataVolume>()

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchDataVolume(ns, setDataVolume, setLoading, abortCtrl.current.signal, notification)
    }, [ns])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    const handleSave = async (data: any) => {
        await updateDataVolume(data as DataVolume, undefined, undefined, notification)
    }

    const handleCancel = () => {
        navigate('/storage/disks')
    }

    return <DetailYaml
        data={dataVolume}
        loading={loading}
        onCancel={handleCancel}
        onSave={handleSave}
    />
}
