import { Tooltip } from 'antd'
import { DataVolume } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import { formatMemory } from '@/utils/k8s'

interface TableColumnCapacityProps {
    dv: DataVolume
}

const TableColumnCapacity: React.FC<TableColumnCapacityProps> = ({ dv }) => {
    const [value, uint] = formatMemory(dv.dataVolume?.spec?.pvc?.resources?.requests?.storage)
    const capacity = `${value} ${uint}`
    return (<Tooltip title={capacity}>{capacity}</Tooltip>)
}

export default TableColumnCapacity
