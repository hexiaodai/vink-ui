import { App } from 'antd'
import { subnetYaml } from './crd-template'
import { useNavigate } from 'react-router-dom'
import { CreateCRDWithYaml } from '@/components/create-crd-with-yaml'
import { createSubnet, Subnet } from '@/clients/subnet'
import * as yaml from 'js-yaml'

export default () => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const submit = async (data: string) => {
        const subnet = yaml.load(data) as Subnet
        await createSubnet(subnet, undefined, undefined, notification)
        navigate('/network/subnets')
    }

    return (
        <CreateCRDWithYaml data={subnetYaml} onSubmit={submit} />
    )
}
