import { CodeOutlined } from '@ant-design/icons'
import { VirtualMachine } from "@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb"
import styles from '@/pages/virtual/machine/list/styles/table-column-console.module.less'

interface TableColumnConsoleProps {
    vm: VirtualMachine
}

interface Handler {
}

class TableColumnConsoleHandler implements Handler {
    private props: TableColumnConsoleProps

    private width = screen.width - 400
    private height = screen.height - 250
    private left = 0
    private top = 0

    constructor(props: TableColumnConsoleProps) {
        this.props = props
    }

    url = () => {
        return `/console?namespace=${this.props.vm.namespace}&name=${this.props.vm.name}`
    }

    open = () => {
        if (!this.isRunning()) {
            return
        }
        window.open(this.url(), '_blank', `toolbars=0, width=${this.width}, height=${this.height}, left=${this.left}, top=${this.top}, noreferrer`)
    }

    isRunning = () => {
        return this.props.vm.virtualMachine?.status?.printableStatus as string === "Running"
    }
}

const TableColumnConsole: React.FC<TableColumnConsoleProps> = ({ vm }) => {
    const handler = new TableColumnConsoleHandler({ vm })

    return (
        <a href='#'
            className={handler.isRunning() ? "" : styles.disable}
            onClick={handler.open}
        >
            <CodeOutlined />
        </a >
    )
}

export default TableColumnConsole
