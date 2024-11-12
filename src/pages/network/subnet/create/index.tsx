import { App } from 'antd'
import { subnetYaml } from './crd-template'
import { useNavigate } from 'react-router-dom'
import { CreateCRDWithYaml } from '@/components/create-crd-with-yaml'
import { clients, resourceTypeName } from '@/clients/clients'
import { ResourceType } from '@/apis/types/group_version'
import * as yaml from 'js-yaml'
import { getErrorMessage } from '@/utils/utils'

export default () => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const submit = async (data: string) => {
        try {
            const subnetObject: any = yaml.load(data)
            await clients.createResource(ResourceType.SUBNET, subnetObject)
            navigate('/network/subnets')
        } catch (err: any) {
            notification.error({ message: resourceTypeName.get(ResourceType.MULTUS), description: getErrorMessage(err) })
        }
    }

    return (
        <CreateCRDWithYaml data={subnetYaml} onSubmit={submit} />
    )
}
