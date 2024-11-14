import { App, Button, Flex, Spin } from "antd"
import { useEffect, useRef } from "react"
import { ResourceType } from "@/clients/ts/types/types"
import { useWatchResourceInNamespaceName } from "@/hooks/use-resource"
import { LoadingOutlined } from '@ant-design/icons'
import { classNames, getErrorMessage } from "@/utils/utils"
import { yaml as langYaml } from "@codemirror/lang-yaml"
import { clients, getResourceName } from "@/clients/clients"
import CodeMirror from '@uiw/react-codemirror'
import codeMirrorStyles from "@/common/styles/code-mirror.module.less"
import commonStyles from "@/common/styles/common.module.less"
import yaml from 'js-yaml'

export default () => {
    const { notification } = App.useApp()

    const { resource: virtualMachine, loading } = useWatchResourceInNamespaceName(ResourceType.VIRTUAL_MACHINE)

    const updatedObject = useRef<any>()

    useEffect(() => {
        updatedObject.current = virtualMachine
    }, [virtualMachine])

    const handleChange = (value: string) => {
        updatedObject.current = yaml.load(value)
    }

    const handleSave = async () => {
        try {
            await clients.updateResource(ResourceType.VIRTUAL_MACHINE, updatedObject.current)
        } catch (err: any) {
            notification.error({ message: getResourceName(ResourceType.VIRTUAL_MACHINE), description: getErrorMessage(err) })
        }
    }

    return (
        <Spin spinning={loading} delay={500} indicator={<LoadingOutlined spin />} >
            <CodeMirror
                className={classNames(codeMirrorStyles["editor"], commonStyles["small-scrollbar"])}
                value={yaml.dump(virtualMachine).trimStart()}
                maxHeight="100vh"
                extensions={[langYaml()]}
                onChange={handleChange}
            />

            <Flex className={commonStyles["sticky-footer-bar"]} justify="flex-end">
                {/* <Button style={{marginRight: 8}}>重置</Button> */}
                <Button type="primary" onClick={handleSave}>保存</Button>
            </Flex>
        </Spin>
    )
}
