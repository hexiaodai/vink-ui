import { openConsole } from '@/utils/utils'
import { CodeOutlined } from '@ant-design/icons'
import { VirtualMachine } from '@/clients/virtual-machine'
import commonStyles from '@/common/styles/common.module.less'

interface Props {
    vm: VirtualMachine
}

const Terminal: React.FC<Props> = ({ vm }) => {
    const isRunning = vm.status?.printableStatus === "Running"
    return (
        <a href='#'
            className={isRunning ? "" : commonStyles["a-disable"]}
            onClick={(e) => {
                e.preventDefault()
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
