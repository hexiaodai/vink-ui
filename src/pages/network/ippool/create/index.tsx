import { App } from 'antd'
import { ippoolYaml } from './crd-template'
import { useNavigate } from 'react-router-dom'
import { CreateCRDWithYaml } from '@/components/create-crd-with-yaml'
import { createIPPool, IPPool } from '@/clients/ippool'
import * as yaml from 'js-yaml'

export default () => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const submit = async (data: string) => {
        const ippool: IPPool = yaml.load(data) as IPPool
        await createIPPool(ippool, undefined, undefined, notification)
        navigate('/network/ippools')
    }

    return (
        <CreateCRDWithYaml data={ippoolYaml} onSubmit={submit} />
    )
}
