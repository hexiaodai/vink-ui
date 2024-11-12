import { App } from 'antd'
import { ippoolYaml } from './crd-template'
import { useNavigate } from 'react-router-dom'
import { CreateCRDWithYaml } from '@/components/create-crd-with-yaml'
import { clients, resourceTypeName } from '@/clients/clients'
import { ResourceType } from '@/apis/types/group_version'
import { getErrorMessage } from '@/utils/utils'
import * as yaml from 'js-yaml'

export default () => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const submit = async (data: string) => {
        try {
            const ipppolObject: any = yaml.load(data)
            await clients.createResource(ResourceType.IPPOOL, ipppolObject)
            navigate('/network/ippools')
        } catch (err: any) {
            notification.error({ message: resourceTypeName.get(ResourceType.IPPOOL), description: getErrorMessage(err) })
        }
    }

    return (
        <CreateCRDWithYaml data={ippoolYaml} onSubmit={submit} />
    )
}
