import { App, Button, Flex, Spin } from "antd"
import { useEffect, useRef, useState } from "react"
import { GroupVersionResourceEnum } from "@/apis/types/group_version"
import { namespaceNameKey } from "@/utils/k8s"
import { useWatchResources } from "@/hooks/use-resource"
import { LoadingOutlined } from '@ant-design/icons'
import { useNamespaceFromURL } from "@/hooks/use-namespace-from-url"
import { classNames } from "@/utils/utils"
import { yaml as langYaml } from "@codemirror/lang-yaml"
import { clients } from "@/clients/clients"
import CodeMirror from '@uiw/react-codemirror'
import codeMirrorStyles from "@/common/styles/code-mirror.module.less"
import commonStyles from "@/common/styles/common.module.less"
import yaml from 'js-yaml'

export default () => {
    const { notification } = App.useApp()

    const [virtualMachine, setVirtualMachine] = useState<any>()

    const namespaceName = useNamespaceFromURL()

    const { resources: virtualMachineMap, loading } = useWatchResources(GroupVersionResourceEnum.VIRTUAL_MACHINE)

    const updatedObject = useRef<any>()
    const change = (value: string) => {
        updatedObject.current = yaml.load(value)
    }

    useEffect(() => {
        const vm = virtualMachineMap.get(namespaceNameKey(namespaceName))
        setVirtualMachine(vm)
        updatedObject.current = vm
    }, [virtualMachineMap])

    const save = async () => {
        try {
            await clients.updateResourceAsync(GroupVersionResourceEnum.VIRTUAL_MACHINE, updatedObject.current)
            notification.success({ message: "保存成功" })
        } catch (err: any) {
            notification.error({ message: "保存失败", description: err.message })
        }
    }

    return (
        <Spin spinning={loading} indicator={<LoadingOutlined spin />} >
            <CodeMirror
                className={classNames(codeMirrorStyles["editor"], commonStyles["small-scrollbar"])}
                value={yaml.dump(virtualMachine).trimStart()}
                maxHeight="100vh"
                extensions={[langYaml()]}
                onChange={change}
            />

            <Flex
                className={commonStyles["sticky-footer-bar"]}
                justify="flex-end"
            >
                {/* <Button style={{marginRight: 8}}>重置</Button> */}
                <Button type="primary" onClick={save}>保存</Button>
            </Flex>
        </Spin>
    )
}
