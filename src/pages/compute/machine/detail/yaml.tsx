import { App } from "antd"
import { DetailYaml } from "@/components/detail-yaml"
import { useNamespaceFromURL } from "@/hooks/use-query-params-from-url"
import { useEffect, useRef, useState } from "react"
import { updateVirtualMachine, VirtualMachine, watchVirtualMachine } from "@/clients/virtual-machine"
import { useNavigate } from "react-router"
import useUnmount from "@/hooks/use-unmount"

export default () => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const ns = useNamespaceFromURL()

    const [loading, setLoading] = useState(true)

    const [virtualMachine, setVirtualMachine] = useState<VirtualMachine>()

    const abortCtrl = useRef<AbortController>()

    useEffect(() => {
        abortCtrl.current?.abort()
        abortCtrl.current = new AbortController()
        watchVirtualMachine(ns, setVirtualMachine, setLoading, abortCtrl.current.signal, notification)
    }, [ns])

    useUnmount(() => {
        abortCtrl.current?.abort()
    })

    const handleSave = async (data: any) => {
        await updateVirtualMachine(data as VirtualMachine, undefined, undefined, notification)
    }

    const handleCancel = () => {
        navigate('/compute/machines')
    }

    return <DetailYaml
        data={virtualMachine}
        loading={loading}
        onCancel={handleCancel}
        onSave={handleSave}
    />
}
