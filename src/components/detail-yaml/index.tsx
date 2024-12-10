import { App, Button, Flex, Spin } from "antd"
import { useEffect, useRef } from "react"
import { LoadingOutlined } from '@ant-design/icons'
import { classNames, getErrorMessage } from "@/utils/utils"
import { yaml as langYaml } from "@codemirror/lang-yaml"
import { clients, getResourceName } from "@/clients/clients"
import { Link } from "react-router-dom"
import { ResourceType } from "@/clients/ts/types/types"
import CodeMirror from '@uiw/react-codemirror'
import codeMirrorStyles from "@/common/styles/code-mirror.module.less"
import commonStyles from "@/common/styles/common.module.less"
import yaml from 'js-yaml'

interface Props {
    resourceType: ResourceType
    resource: any
    loading: boolean
    backPath?: string
}

export const DetailYaml: React.FC<Props> = ({ resourceType, resource, backPath, loading }) => {
    const { notification } = App.useApp()

    const updatedObject = useRef<any>()

    useEffect(() => {
        updatedObject.current = resource
    }, [resource])

    const handleChange = (value: string) => {
        updatedObject.current = yaml.load(value)
    }

    const handleSave = async () => {
        try {
            await clients.updateResource(resourceType, updatedObject.current)
        } catch (err: any) {
            notification.error({ message: getResourceName(resourceType), description: getErrorMessage(err) })
        }
    }

    return (
        <Spin spinning={loading} delay={500} indicator={<LoadingOutlined spin />} >
            <CodeMirror
                className={classNames(codeMirrorStyles["editor"], commonStyles["small-scrollbar"])}
                value={yaml.dump(resource).trimStart()}
                maxHeight="100vh"
                extensions={[langYaml()]}
                onChange={handleChange}
            />

            <Flex className={commonStyles["sticky-footer-bar"]} justify="flex-end">
                <Link style={{ marginRight: 8 }} to={{ pathname: backPath }}>
                    <Button>取消</Button>
                </Link>
                <Button type="primary" onClick={handleSave}>保存</Button>
            </Flex>
        </Spin>
    )
}
