import { Flex } from 'antd'
import { IconFont } from '@/components/icon'
import { getOperatingSystemFromDataVolume } from '@/utils/operating-system'
import { formatOSFamily } from '@/utils/k8s'
import { DataVolume } from '@/clients/data-volume'
import { OperatingSystem as OperatingSystemType } from '@/clients/ts/types/types'
import { VirtualMachine } from '@/clients/virtual-machine'
import { instances as annotations } from '@/clients/ts/annotation/annotations.gen'
import styles from "./index.module.less"
import { getVirtualMachineOperatingSystem } from '@/clients/annotation'

interface OperatingSystemProps {
    dv?: DataVolume
    vm?: VirtualMachine
    operatingSystem?: OperatingSystemType
}

const OperatingSystem: React.FC<OperatingSystemProps> = ({ dv, vm, operatingSystem }) => {
    if (dv) {
        const os = getOperatingSystemFromDataVolume(dv)
        if (!os) {
            return
        }
        operatingSystem = { name: os.family, version: os.version }
    } else if (vm) {
        operatingSystem = getVirtualMachineOperatingSystem(vm)
    }
    if (!operatingSystem || !operatingSystem.name || operatingSystem.name.length === 0) {
        return
    }
    return (
        <Flex justify="flex-start" align="center">
            <IconFont type={`icon-${operatingSystem.name}`} className={styles['icon']} />
            <span>{formatOSFamily(operatingSystem.name)} {operatingSystem.version}</span>
        </Flex>
    )
}

export default OperatingSystem
