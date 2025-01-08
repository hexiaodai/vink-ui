import { Flex } from 'antd'
import { IconFont } from '@/components/icon'
import { getOperatingSystemFromDataVolume } from '@/utils/operating-system'
import { formatOSFamily } from '@/utils/k8s'
import styles from "./index.module.less"
import { DataVolume } from '@/clients/data-volume'

interface OperatingSystemProps {
    dv?: DataVolume
    family?: string
    version?: string
}

const OperatingSystem: React.FC<OperatingSystemProps> = ({ dv, family, version }) => {
    if (dv) {
        const os = getOperatingSystemFromDataVolume(dv)
        if (!os) {
            return
        }
        family = os.family
        version = os.version
    }
    if (!family) {
        return
    }
    return (
        <Flex justify="flex-start" align="center">
            <IconFont type={`icon-${family}`} className={styles['icon']} />
            <span>{formatOSFamily(family)} {version}</span>
        </Flex>
    )
}

export default OperatingSystem
