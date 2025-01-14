import { DetailYaml } from "@/components/detail-yaml"
import { useEffect, useRef, useState } from "react"
import { App } from "antd"
import { useNamespaceFromURL } from "@/hooks/use-query-params-from-url"
import { useNavigate } from "react-router"
import { Multus, updateMultus, watchMultus } from "@/clients/multus"
import useUnmount from "@/hooks/use-unmount"

export default () => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const ns = useNamespaceFromURL()

    const [loading, setLoading] = useState(true)

    const [multus, setMultus] = useState<Multus>()

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchMultus(ns, setMultus, setLoading, abortCtrl.current.signal, notification)
    }, [ns])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    const handleSave = async (data: any) => {
        await updateMultus(data as Multus, undefined, undefined, notification)
    }

    const handleCancel = () => {
        navigate('/network/multus')
    }

    return <DetailYaml
        data={multus}
        loading={loading}
        onCancel={handleCancel}
        onSave={handleSave}
    />
}
