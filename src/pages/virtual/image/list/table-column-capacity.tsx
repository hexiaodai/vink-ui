import { Tooltip } from 'antd'
import { DataVolume } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import { formatMemory } from '@/utils/k8s'

interface TableColumnCapacityProps {
    dv: DataVolume
}

interface Handler {
    capacity: () => string
}

class TableColumnCapacityHandler implements Handler {
    private props: TableColumnCapacityProps

    constructor(props: TableColumnCapacityProps) {
        this.props = props
    }

    capacity = () => {
        const [value, uint] = formatMemory(this.props.dv.dataVolume?.spec?.pvc?.resources?.requests?.storage)
        const capacity = `${value} ${uint}`
        return capacity
    }
}

const TableColumnCapacity: React.FC<TableColumnCapacityProps> = ({ dv }) => {
    const handler = new TableColumnCapacityHandler({ dv })

    return (<>{handler.capacity()}</>)
}

export default TableColumnCapacity
