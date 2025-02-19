import { App } from 'antd'
import { useNavigate } from 'react-router'
import { create, KubeResource } from '@/clients/clients'
import { FooterToolbar, ProCard, ProForm } from '@ant-design/pro-components'
import { useRef, useState } from 'react'
import { yaml as langYaml } from "@codemirror/lang-yaml"
import { classNames } from '@/utils/utils'
import styles from "@/common/styles/code-mirror.module.less"
import commonStyles from "@/common/styles/common.module.less"
import CodeMirror from '@uiw/react-codemirror'
import * as yaml from 'js-yaml'

interface CreateResourceWithYamlProps {
    data: string
    backout?: string
}

export const CreateResourceWithYaml = <T extends KubeResource>({ data, backout }: CreateResourceWithYamlProps) => {
    const { notification } = App.useApp()

    const navigate = useNavigate()

    const editorRef = useRef(null)

    const [updatedYaml, setUpdatedYaml] = useState<string>(data)

    const handleUpdateYaml = (data: string) => {
        const object: any = yaml.load(data)
        setUpdatedYaml(yaml.dump(object))
    }

    const handlecChange = (value: string) => {
        setUpdatedYaml(value)
    }

    const handleSubmit = async () => {
        const resource = yaml.load(updatedYaml) as T
        await create(resource, undefined, undefined, notification)
        if (backout) {
            navigate(backout)
        }
    }

    return (
        <ProForm
            onReset={() => { handleUpdateYaml(data) }}
            submitter={{
                onSubmit: () => { handleSubmit() },
                // no need to reset form
                render: (_, dom) => <FooterToolbar>{dom?.[1]}</FooterToolbar>
                // render: (_, dom) => <FooterToolbar>{dom}</FooterToolbar>
            }}
        >
            <ProCard title="Create Resource" >
                <CodeMirror
                    className={classNames(styles["editor"], commonStyles["small-scrollbar"])}
                    ref={editorRef}
                    value={updatedYaml.trimStart()}
                    maxHeight="100vh"
                    extensions={[langYaml()]}
                    onChange={handlecChange}
                />
            </ProCard>
        </ProForm>
    )
}
