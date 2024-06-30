import { Badge, Tooltip } from 'antd'
import { VirtualMachine } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'
import { statusMap } from '@/utils/k8s'

interface TableColumnStatusProps {
    vm: VirtualMachine
}

const TableColumnStatus: React.FC<TableColumnStatusProps> = ({ vm }) => {
    const status = vm.virtualMachine?.status?.printableStatus as string
    return (
        <Badge
            status={statusMap[status] || 'default'}
            text={< Tooltip title={status} > {status}</Tooltip>}
        />
    )
}

export default TableColumnStatus
