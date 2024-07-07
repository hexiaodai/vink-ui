import { VirtualMachine } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'
import { formatMemory } from '@/utils/k8s'

interface TableColumnCPUProps {
    vm: VirtualMachine
}

interface CPUHandler {
    core: () => string
}

class TableColumnCPUHandler implements CPUHandler {
    private props: TableColumnCPUProps

    constructor(props: TableColumnCPUProps) {
        this.props = props
    }

    core = () => {
        let core = this.props.vm.virtualMachine?.spec?.template?.spec?.domain?.cpu?.cores
        return core ? `${core} Core` : ''
    }
}

export const TableColumnCPU: React.FC<TableColumnCPUProps> = ({ vm }) => {
    const handler = new TableColumnCPUHandler({ vm })
    return (<>{handler.core()}</>)
}

interface TableColumnMemProps {
    vm: VirtualMachine
}

interface MemHandler {
    mem: () => string
}

class TableColumnMemHandler implements MemHandler {
    private props: TableColumnMemProps

    constructor(props: TableColumnMemProps) {
        this.props = props
    }

    mem = () => {
        const [value, unit] = formatMemory(this.props.vm.virtualMachine?.spec?.template?.spec?.domain?.resources?.requests?.memory)
        return `${value} ${unit}`
    }
}

export const TableColumnMem: React.FC<TableColumnMemProps> = ({ vm }) => {
    const handler = new TableColumnMemHandler({ vm })

    return (<>{handler.mem()}</>)
}
