import { Flex, Tooltip } from 'antd'
import { DataVolume } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import { IconFont } from '@/components/icon'
import { getOperatingSystemFromDataVolume } from '@/utils/operating-system'
import { formatOSFamily } from '@/utils/k8s'
import styles from '@/components/table-column-operating-system/index.module.less'

interface TableColumnOperatingSystemProps {
    dv: DataVolume
}

const TableColumnOperatingSystem: React.FC<TableColumnOperatingSystemProps> = ({ dv }) => {
    const info = getOperatingSystemFromDataVolume(dv)
    return (
        <Flex justify="flex-start" align="center">
            <IconFont type={`icon-${info.family}`} className={styles['icon']} />
            <Tooltip title={`${formatOSFamily(info.family)} ${info.version}`}>{formatOSFamily(info.family)}</Tooltip>
        </Flex>
    )
}

export default TableColumnOperatingSystem
