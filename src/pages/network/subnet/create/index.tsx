import { App } from 'antd'
import { subnetYaml } from './crd-template'
import { useNavigate } from 'react-router-dom'
import { CreateCRDWithYaml } from '@/components/create-crd-with-yaml'
import { clients } from '@/clients/clients'
import { GroupVersionResourceEnum } from '@/apis/types/group_version'
import * as yaml from 'js-yaml'

export default () => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const submit = async (data: string) => {
        const subnetObject: any = yaml.load(data)
        if (subnetObject.metadata.name == "") {
            notification.error({ message: "Subnet", description: "Subnet name cannot be empty" })
            return
        }
        await clients.createResource(GroupVersionResourceEnum.SUBNET, subnetObject, { notification: notification }).then(() => {
            navigate('/network/subnets')
        })
    }

    return (
        <CreateCRDWithYaml data={subnetYaml} onSubmit={submit} />
    )
}
