import { App } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useNamespace } from '@/common/context'
import { createMultusConfig } from '@/resource-manager/multus'
import { multusYaml } from './crd-template'
import { CreateCRDWithYaml } from '@/components/create-crd-with-yaml'
import * as yaml from 'js-yaml'

export default () => {
    const { notification } = App.useApp()

    const { namespace } = useNamespace()

    const navigate = useNavigate()

    const submit = async (data: string) => {
        const multusObject: any = yaml.load(data)
        if (multusObject.metadata.namespace == "" || multusObject.metadata.namespace != namespace) {
            const errmsg = multusObject.metadata.namespace.length == 0 ? "请选择 Namespace" : "Namespace 错误"
            notification.error({ message: "Multus", description: errmsg })
            return
        }
        await createMultusConfig(multusObject, notification).then(() => {
            navigate('/network/multus')
        })
    }

    return (
        <CreateCRDWithYaml data={multusYaml} onSubmit={submit} />
    )
}
