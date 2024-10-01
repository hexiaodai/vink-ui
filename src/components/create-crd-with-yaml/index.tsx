import { FooterToolbar, ProCard, ProForm } from '@ant-design/pro-components'
import { useRef, useState } from 'react'
import { yaml as langYaml } from "@codemirror/lang-yaml"
import * as yaml from 'js-yaml'
import styles from "@/common/styles/code-mirror.module.less"
import commonStyles from "@/common/styles/common.module.less"
import CodeMirror from '@uiw/react-codemirror'
import { classNames } from '@/utils/utils'

interface CreateCRDWithYamlProps {
    title?: string
    data: string
    onSubmit: (data: string) => void
}

export const CreateCRDWithYaml: React.FC<CreateCRDWithYamlProps> = ({ title, data, onSubmit }) => {
    const editorRef = useRef(null)

    const [updatedYaml, setUpdatedYaml] = useState<string>(data)

    const updateYaml = (data: string) => {
        const object: any = yaml.load(data)
        setUpdatedYaml(yaml.dump(object))
    }

    const change = (value: string) => {
        setUpdatedYaml(value)
    }

    return (
        <ProForm
            onReset={() => {
                updateYaml(data)
            }}
            submitter={{
                onSubmit: () => { onSubmit(updatedYaml) },
                render: (_, dom) => <FooterToolbar>{dom}</FooterToolbar>
            }}
        >
            <ProCard title={title} >
                <CodeMirror
                    className={classNames(styles["editor"], commonStyles["small-scrollbar"])}
                    ref={editorRef}
                    value={updatedYaml.trimStart()}
                    maxHeight="100vh"
                    extensions={[langYaml()]}
                    onChange={change}
                />
            </ProCard>
        </ProForm>
    )
}
