import { App } from 'antd'
import { useNavigate } from 'react-router-dom'
import { multusYaml } from './crd-template'
import { CreateCRDWithYaml } from '@/components/create-crd-with-yaml'
import { clients, getResourceName } from '@/clients/clients'
import { ResourceType } from '@/clients/ts/types/resource_type'
import { getErrorMessage } from '@/utils/utils'
import * as yaml from 'js-yaml'

export default () => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const submit = async (data: string) => {
        try {
            const multusObject: any = yaml.load(data)
            await clients.createResource(ResourceType.MULTUS, multusObject)
            navigate('/network/multus')
        } catch (err: any) {
            notification.error({ message: getResourceName(ResourceType.MULTUS), description: getErrorMessage(err) })
        }
    }

    return (
        <CreateCRDWithYaml data={multusYaml} onSubmit={submit} />
    )
}
