import { App } from 'antd'
import { useNavigate } from 'react-router-dom'
import { multusYaml } from './crd-template'
import { CreateCRDWithYaml } from '@/components/create-crd-with-yaml'
import { createMultus, Multus } from '@/clients/multus'
import * as yaml from 'js-yaml'

export default () => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const submit = async (data: string) => {
        const multus = yaml.load(data) as Multus
        await createMultus(multus, undefined, undefined, notification)
        navigate('/network/multus')
    }

    return (
        <CreateCRDWithYaml data={multusYaml} onSubmit={submit} />
    )
}
