import { Button, Flex, Spin } from "antd"
import { useEffect, useRef } from "react"
import { LoadingOutlined } from '@ant-design/icons'
import { classNames } from "@/utils/utils"
import { yaml as langYaml } from "@codemirror/lang-yaml"
import CodeMirror from '@uiw/react-codemirror'
import codeMirrorStyles from "@/common/styles/code-mirror.module.less"
import commonStyles from "@/common/styles/common.module.less"
import yaml from 'js-yaml'

interface Props {
    data: any
    loading: boolean
    onSave?: (data: any) => void
    onCancel?: () => void
}

export const DetailYaml: React.FC<Props> = ({ onSave, onCancel, data, loading }) => {
    const updatedObject = useRef<any>()

    useEffect(() => {
        updatedObject.current = data
    }, [data])

    const handleChange = (value: string) => {
        updatedObject.current = yaml.load(value)
    }

    return (
        <Spin spinning={loading} delay={500} indicator={<LoadingOutlined spin />} >
            <CodeMirror
                className={classNames(codeMirrorStyles["editor"], commonStyles["small-scrollbar"])}
                value={yaml.dump(data).trimStart()}
                maxHeight="100vh"
                extensions={[langYaml()]}
                onChange={handleChange}
            />

            <Flex className={commonStyles["sticky-footer-bar"]} justify="flex-end">
                <Button style={{ marginRight: 8 }} onClick={onCancel}>取消</Button>
                <Button type="primary" onClick={() => { if (onSave) onSave(updatedObject.current) }}>保存</Button>
            </Flex>
        </Spin>
    )
}
