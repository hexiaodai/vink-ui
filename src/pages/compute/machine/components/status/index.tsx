import { Badge } from 'antd'
import { unknownStatus, virtualMachineStatusMap } from '@/utils/resource-status'

interface Props {
    vm?: any
}

const VirtualMachineStatus: React.FC<Props> = ({ vm }) => {
    const status = vm?.status.printableStatus || ""
    const badgeStatus = virtualMachineStatusMap[status] || unknownStatus
    return (
        <Badge status={badgeStatus.badge} text={badgeStatus.text} />
    )
}

export default VirtualMachineStatus
