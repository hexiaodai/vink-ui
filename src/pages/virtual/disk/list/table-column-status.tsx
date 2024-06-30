import { Tooltip } from 'antd'
import { DataVolume } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'

interface TableColumnStatusProps {
    dv: DataVolume
}

const TableColumnStatus: React.FC<TableColumnStatusProps> = ({ dv }) => {
    const status = dv.dataVolume?.status;
    const displayStatus = status?.phase === 'ImportInProgress' ? status?.progress : status?.phase
    return (
        <Tooltip title={displayStatus}>{displayStatus}</Tooltip>
    )
}

export default TableColumnStatus
