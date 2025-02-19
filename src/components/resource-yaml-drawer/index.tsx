import { App, Button, Drawer, Flex, Space, Spin } from "antd"
import { useEffect, useRef, useState } from "react"
import { LoadingOutlined } from '@ant-design/icons'
import { classNames } from "@/utils/utils"
import { yaml as langYaml } from "@codemirror/lang-yaml"
import { get, KubeResource, update } from "@/clients/clients"
import { NamespaceName, ResourceType } from "@/clients/ts/types/types"
import { useNamespaceNameFromURL } from "@/hooks/use-query-params-from-url"
import CodeMirror from '@uiw/react-codemirror'
import codeMirrorStyles from "@/common/styles/code-mirror.module.less"
import commonStyles from "@/common/styles/common.module.less"
import yaml from 'js-yaml'

interface YamlDrawerProps<T extends KubeResource> {
    open: boolean
    resourceType: ResourceType
    namespaceName?: NamespaceName
    onConfirm?: (data: T) => void
    onCancel?: () => void
}

export const YamlDrawer = <T extends KubeResource>({ open, resourceType, namespaceName, onCancel, onConfirm }: YamlDrawerProps<T>) => {
    const { notification } = App.useApp()

    let nn = useNamespaceNameFromURL()
    if (!nn && namespaceName) {
        nn = namespaceName
    }

    const [loading, setLoading] = useState(true)

    const [resource, setResource] = useState<T>()

    useEffect(() => {
        if (open && nn) {
            get<T>(resourceType, nn, setResource, setLoading, notification)
        }
    }, [open])

    const updatedObject = useRef<any>()

    useEffect(() => {
        updatedObject.current = resource
    }, [resource])

    const handleChange = (value: string) => {
        updatedObject.current = yaml.load(value)
    }

    const handleSubmit = async () => {
        await update<T>(updatedObject.current as T, undefined, undefined, notification)
        onConfirm?.(updatedObject.current)
    }

    return (
        <Drawer
            title="YAML"
            open={open}
            onClose={onCancel}
            closeIcon={false}
            width={650}
            footer={
                <Flex justify="space-between" align="flex-start">
                    <Space>
                        <Button onClick={handleSubmit} type="primary">确定</Button>
                        <Button onClick={onCancel}>取消</Button>
                    </Space>
                </Flex>
            }
        >
            <Spin spinning={loading} delay={500} indicator={<LoadingOutlined spin />} >
                <CodeMirror
                    className={classNames(codeMirrorStyles["editor"], commonStyles["small-scrollbar"])}
                    value={yaml.dump(resource).trimStart()}
                    maxHeight="100vh"
                    extensions={[langYaml()]}
                    onChange={handleChange}
                />
            </Spin>
        </Drawer>
    )
}
