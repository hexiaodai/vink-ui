import { virtualMachineStatusMap } from '@/utils/resource-status'
import { Badge } from 'antd'

interface Props {
    vm?: any
}

const VirtualMachineStatus: React.FC<Props> = ({ vm }) => {
    return (
        <Badge status={virtualMachineStatusMap[vm?.status.printableStatus]?.badge} text={virtualMachineStatusMap[vm?.status.printableStatus]?.text} />
    )
}

export default VirtualMachineStatus
