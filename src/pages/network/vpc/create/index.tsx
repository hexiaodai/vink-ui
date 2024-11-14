import { App } from 'antd'
import { vpcYaml } from './crd-template'
import { useNavigate } from 'react-router-dom'
import { CreateCRDWithYaml } from '@/components/create-crd-with-yaml'
import { clients, getResourceName } from '@/clients/clients'
import { ResourceType } from '@/clients/ts/types/types'
import { getErrorMessage } from '@/utils/utils'
import * as yaml from 'js-yaml'

export default () => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const submit = async (data: string) => {
        try {
            const vpcObject: any = yaml.load(data)
            await clients.createResource(ResourceType.VPC, vpcObject)
            navigate('/network/vpcs')
        } catch (err: any) {
            notification.error({ message: getResourceName(ResourceType.VPC), description: getErrorMessage(err) })
        }
    }

    return (
        <CreateCRDWithYaml data={vpcYaml} onSubmit={submit} />
    )
}
