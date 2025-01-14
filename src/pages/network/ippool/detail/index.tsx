import { DetailYaml } from "@/components/detail-yaml"
import { useEffect, useRef, useState } from "react"
import { IPPool, updateIPPool, watchIPPool } from "@/clients/ippool"
import { App } from "antd"
import { useNamespaceFromURL } from "@/hooks/use-query-params-from-url"
import { useNavigate } from "react-router"
import useUnmount from "@/hooks/use-unmount"

export default () => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const ns = useNamespaceFromURL()

    const [loading, setLoading] = useState(true)

    const [ippool, setIPPool] = useState<IPPool>()

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchIPPool(ns, setIPPool, setLoading, abortCtrl.current.signal, notification)
    }, [ns])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    const handleSave = async (data: any) => {
        await updateIPPool(data as IPPool, undefined, undefined, notification)
    }

    const handleCancel = () => {
        navigate('/network/ippools')
    }

    return <DetailYaml
        data={ippool}
        loading={loading}
        onCancel={handleCancel}
        onSave={handleSave}
    />
}
