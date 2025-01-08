import { Badge } from 'antd'
import { dataVolumeStatusMap, unknownStatus } from '@/utils/resource-status'
import { DataVolume } from '@/clients/data-volume'

interface Props {
    dv: DataVolume
}

const DataVolumeStatus: React.FC<Props> = ({ dv }) => {
    const status = dv.status?.phase
    const progress = dv.status?.progress
    if (!status || !progress) {
        return <Badge status={unknownStatus.badge} text={unknownStatus.text} />
    }

    const badgeStatus = dataVolumeStatusMap[status] || unknownStatus
    const displayStatus = parseFloat(progress) === 100 ? badgeStatus.text : progress

    return (
        <Badge status={badgeStatus.badge} text={displayStatus} />
    )
}

export default DataVolumeStatus
