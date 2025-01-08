import { App } from "antd"
import { DetailYaml } from "@/components/detail-yaml"
import { ResourceType } from "@/clients/ts/types/types"
import { useNamespaceFromURL } from "@/hooks/use-query-params-from-url"
import { useEffect, useRef, useState } from "react"
import { updateVirtualMachine, VirtualMachine, watchVirtualMachine } from "@/clients/virtual-machine"
import { getResourceName } from "@/clients/clients"
import { getErrorMessage } from "@/utils/utils"
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
        watchVirtualMachine(ns, setVirtualMachine, setLoading, abortCtrl.current.signal).catch(err => {
            notification.error({
                message: getResourceName(ResourceType.VIRTUAL_MACHINE),
                description: getErrorMessage(err)
            })
        })
    }, [ns])

    useUnmount(() => {
        console.log("Unmounting watcher", getResourceName(ResourceType.VIRTUAL_MACHINE))
        abortCtrl.current?.abort()
    })

    const handleSave = (data: any) => {
        data = data as VirtualMachine
        try {
            updateVirtualMachine(data)
        } catch (err) {
            notification.error({
                message: getResourceName(ResourceType.VIRTUAL_MACHINE),
                description: getErrorMessage(err)
            })
        }
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
