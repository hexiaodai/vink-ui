import { Flex } from 'antd'
import { IconFont } from '@/components/icon'
import { getOperatingSystemFromDataVolume } from '@/utils/operating-system'
import { formatOSFamily } from '@/utils/k8s'
import styles from "./index.module.less"

interface OperatingSystemProps {
    dv?: any
    family?: "ubuntu" | "centos" | "debian" | "linux" | "windows"
    version?: string
}

const OperatingSystem: React.FC<OperatingSystemProps> = ({ dv, family, version }) => {
    if (dv) {
        const info = getOperatingSystemFromDataVolume(dv.metadata)
        family = info.family as OperatingSystemProps["family"]
        version = info.version
    }
    return (
        <Flex justify="flex-start" align="center">
            <IconFont type={`icon-${family}`} className={styles['icon']} />
            <span>{formatOSFamily(family)} {version}</span>
        </Flex>
    )
}

export default OperatingSystem
