import { App } from 'antd'
import { ippoolYaml } from './crd-template'
import { useNavigate } from 'react-router-dom'
import { CreateCRDWithYaml } from '@/components/create-crd-with-yaml'
import { createIPPool } from '@/resource-manager/ippool'
import * as yaml from 'js-yaml'

export default () => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const submit = async (data: string) => {
        const ipppolObject: any = yaml.load(data)
        if (ipppolObject.metadata.name == "") {
            notification.error({ message: "IPPool", description: "IPPool name cannot be empty" })
            return
        }
        await createIPPool(ipppolObject, notification).then(() => {
            navigate('/network/ippools')
        })
    }

    return (
        <CreateCRDWithYaml data={ippoolYaml} onSubmit={submit} />
    )
}
