import { Flex } from 'antd'
import { IconFont } from '@/components/icon'
import { getOperatingSystemFromDataVolume } from '@/utils/operating-system'
import { formatOSFamily } from '@/utils/k8s'
import { CustomResourceDefinition } from "@/apis/apiextensions/v1alpha1/custom_resource_definition"
import Styles from '@/components/table-column/styles/operating-system.module.less'

interface TableColumnOperatingSystemProps {
    rootDataVolume?: CustomResourceDefinition
}

const TableColumnOperatingSystem: React.FC<TableColumnOperatingSystemProps> = ({ rootDataVolume }) => {
    const info = getOperatingSystemFromDataVolume(rootDataVolume?.metadata)
    return (
        <Flex justify="flex-start" align="center">
            <IconFont type={`icon-${info.family}`} className={Styles['icon']} />
            {formatOSFamily(info.family)} {info.version}
        </Flex>
    )
}

export default TableColumnOperatingSystem
