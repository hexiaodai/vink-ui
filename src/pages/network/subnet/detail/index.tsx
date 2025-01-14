import { DetailYaml } from "@/components/detail-yaml"
import { useEffect, useRef, useState } from "react"
import { App } from "antd"
import { useNamespaceFromURL } from "@/hooks/use-query-params-from-url"
import { useNavigate } from "react-router"
import { Subnet, updateSubnet, watchSubnet } from "@/clients/subnet"
import useUnmount from "@/hooks/use-unmount"

export default () => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const ns = useNamespaceFromURL()

    const [loading, setLoading] = useState(true)

    const [subnet, setSubnet] = useState<Subnet>()

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchSubnet(ns, setSubnet, setLoading, abortCtrl.current.signal, notification)
    }, [ns])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    const handleSave = async (data: any) => {
        await updateSubnet(data as Subnet, undefined, undefined, notification)
    }

    const handleCancel = () => {
        navigate('/network/subnets')
    }

    return <DetailYaml
        data={subnet}
        loading={loading}
        onCancel={handleCancel}
        onSave={handleSave}
    />
}
