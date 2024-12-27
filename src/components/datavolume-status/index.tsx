import { Badge } from 'antd'
import { dataVolumeStatusMap, unknownStatus } from '@/utils/resource-status'

interface Props {
    dv?: any
}

const DataVolumeStatus: React.FC<Props> = ({ dv }) => {
    if (!dv || !dv.status) {
        return <Badge status={unknownStatus.badge} text={unknownStatus.text} />
    }

    const status = dv.status.phase || ""
    const badgeStatus = dataVolumeStatusMap[status] || unknownStatus
    const displayStatus = parseFloat(dv.status.progress) === 100 ? badgeStatus.text : dv.status.progress

    return (
        <Badge status={badgeStatus.badge} text={displayStatus} />
    )
}

export default DataVolumeStatus
