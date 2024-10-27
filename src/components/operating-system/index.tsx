import { Flex } from 'antd'
import { IconFont } from '@/components/icon'
import { getOperatingSystemFromDataVolume } from '@/utils/operating-system'
import { formatOSFamily } from '@/utils/k8s'
import styles from "./index.module.less"

interface OperatingSystemProps {
    rootDataVolume?: any
}

const OperatingSystem: React.FC<OperatingSystemProps> = ({ rootDataVolume }) => {
    const info = getOperatingSystemFromDataVolume(rootDataVolume?.metadata)
    return (
        <Flex justify="flex-start" align="center">
            <IconFont type={`icon-${info.family}`} className={styles['icon']} />
            {formatOSFamily(info.family)} {info.version}
        </Flex>
    )
}

export default OperatingSystem
