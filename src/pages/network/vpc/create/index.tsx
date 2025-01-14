import { App } from 'antd'
import { vpcYaml } from './crd-template'
import { useNavigate } from 'react-router-dom'
import { CreateCRDWithYaml } from '@/components/create-crd-with-yaml'
import { createVPC, VPC } from '@/clients/vpc'
import * as yaml from 'js-yaml'

export default () => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const submit = async (data: string) => {
        const vpc = yaml.load(data) as VPC
        await createVPC(vpc, undefined, undefined, notification)
        navigate('/network/vpcs')
    }

    return (
        <CreateCRDWithYaml data={vpcYaml} onSubmit={submit} />
    )
}
