import { DetailYaml } from "@/components/detail-yaml"
import { useEffect, useRef, useState } from "react"
import { App } from "antd"
import { useNamespaceFromURL } from "@/hooks/use-query-params-from-url"
import { useNavigate } from "react-router"
import { updateVPC, VPC, watchVPC } from "@/clients/vpc"
import useUnmount from "@/hooks/use-unmount"

export default () => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const ns = useNamespaceFromURL()

    const [loading, setLoading] = useState(true)

    const [vpc, setVPC] = useState<VPC>()

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchVPC(ns, setVPC, setLoading, abortCtrl.current.signal, notification)
    }, [ns])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    const handleSave = async (data: any) => {
        await updateVPC(data as VPC, undefined, undefined, notification)
    }

    const handleCancel = () => {
        navigate('/network/vpcs')
    }

    return <DetailYaml
        data={vpc}
        loading={loading}
        onCancel={handleCancel}
        onSave={handleSave}
    />
}
