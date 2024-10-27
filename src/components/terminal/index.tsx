import { openConsole } from '@/utils/utils'
import { CodeOutlined } from '@ant-design/icons'
import commonStyles from '@/common/styles/common.module.less'

interface Props {
    vm?: any
}

const Terminal: React.FC<Props> = ({ vm }) => {
    const isRunning = vm?.status?.printableStatus as string === "Running"
    return (
        <a href='#'
            className={isRunning ? "" : commonStyles["a-disable"]}
            onClick={() => {
                if (isRunning) {
                    openConsole(vm)
                }
            }}
        >
            <CodeOutlined />
        </a>
    )
}

export default Terminal
