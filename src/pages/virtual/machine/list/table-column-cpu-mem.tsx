import { Tooltip } from 'antd'
import { VirtualMachine } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'
import { formatMemory } from '@/utils/k8s'

interface TableColumnCPUProps {
    vm: VirtualMachine
}

export const TableColumnCPU: React.FC<TableColumnCPUProps> = ({ vm }) => {
    let core = vm.virtualMachine?.spec?.template?.spec?.domain?.cpu?.cores
    core = core ? `${core} Core` : ''
    return (<Tooltip title={core}>{core}</Tooltip>)
}

interface TableColumnMemProps {
    vm: VirtualMachine
}

export const TableColumnMem: React.FC<TableColumnMemProps> = ({ vm }) => {
    const [value, unit] = formatMemory(vm.virtualMachine?.spec?.template?.spec?.domain?.resources?.requests?.memory)
    const mem = `${value} ${unit}`
    return (<Tooltip title={mem}>{mem}</Tooltip>)
}


