import { App } from 'antd'
import { vpcYaml } from './crd-template'
import { useNavigate } from 'react-router-dom'
import { CreateCRDWithYaml } from '@/components/create-crd-with-yaml'
import { clients } from '@/clients/clients'
import { GroupVersionResourceEnum } from '@/apis/types/group_version'
import * as yaml from 'js-yaml'

export default () => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const submit = async (data: string) => {
        const vpcObject: any = yaml.load(data)
        if (vpcObject.metadata.name == "") {
            notification.error({ message: "VPC", description: "VPC name cannot be empty" })
            return
        }
        await clients.createResource(GroupVersionResourceEnum.VPC, vpcObject, { notification: notification }).then(() => {
            navigate('/network/vpcs')
        })
    }

    return (
        <CreateCRDWithYaml data={vpcYaml} onSubmit={submit} />
    )
}
