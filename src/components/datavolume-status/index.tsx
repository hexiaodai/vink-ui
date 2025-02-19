import { Badge } from 'antd'
import { DataVolume } from '@/clients/data-volume'
import { containsErrorKeywords, containsProcessing } from '@/utils/utils'
import { VirtualMachineDisk } from '@/clients/ts/types/virtualmachine'

interface Props {
    dv?: DataVolume
    disk?: VirtualMachineDisk
}

const DataVolumeStatus: React.FC<Props> = ({ dv, disk }) => {
    if (disk) {
        if (!disk.mounted) {
            return <Badge status="warning" text="Not Mounted" />
        }
        if (disk.status === "Ready") {
            return <Badge status="success" text={disk.status} />
        }
        return <Badge status="default" text={disk.status} />
    }

    if (dv) {
        const readyCondition = dv.status?.conditions?.find(c => c.type === 'Ready')

        if (readyCondition && readyCondition.status === 'True') {
            return <Badge status="success" text={readyCondition.type} />
        }

        const phase = dv.status?.phase

        if (!phase) {
            return <Badge status="default" text="Unknown" />
        }

        if (phase === "ImportInProgress") {
            return <Badge status="processing" text={dv.status?.progress} />
        }

        if (containsErrorKeywords(phase)) {
            return <Badge status="error" text={phase} />
        }

        if (containsProcessing(phase)) {
            return <Badge status="processing" text={phase} />
        }

        return <Badge status="default" text={phase} />
    }
}

export default DataVolumeStatus

// import { Badge } from 'antd'
// // import { dataVolumeStatusMap, unknownStatus } from '@/utils/resource-status'
// import { DataVolume } from '@/clients/data-volume'
// import { containsErrorKeywords, containsProcessing } from '@/utils/utils'
// import { VirtualMachine } from '@/clients/virtual-machine'
// import { VirtualMachineDisk } from '@/clients/ts/types/virtualmachine'

// interface Props {
//     dv: DataVolume
//     vm?: VirtualMachine
//     dvName?: string
// }

// const DataVolumeStatus: React.FC<Props> = ({ dv, vm, dvName }) => {
//     if (vm && dvName && !(vm.spec?.template?.spec?.domain?.devices?.disks?.find((item) => item.name === dvName))) {
//         return <Badge status="warning" text="Not Mounted" />
//     }

//     const readyCondition = dv.status?.conditions?.find(c => c.type === 'Ready')

//     if (readyCondition && readyCondition.status === 'True') {
//         return <Badge status="success" text={readyCondition.type} />
//     }

//     const phase = dv.status?.phase

//     if (!phase) {
//         return <Badge status="default" text="Unknown" />
//     }

//     if (phase === "ImportInProgress") {
//         return <Badge status="processing" text={dv.status?.progress} />
//     }

//     if (containsErrorKeywords(phase)) {
//         return <Badge status="error" text={phase} />
//     }

//     if (containsProcessing(phase)) {
//         return <Badge status="processing" text={phase} />
//     }

//     return <Badge status="default" text={phase} />

//     // const status = dv.status?.phase
//     // const progress = dv.status?.progress
//     // if (!status || !progress) {
//     //     return <Badge status={unknownStatus.badge} text={unknownStatus.text} />
//     // }

//     // const badgeStatus = dataVolumeStatusMap[status] || unknownStatus
//     // const displayStatus = parseFloat(progress) === 100 ? badgeStatus.text : progress

//     // return (
//     //     <Badge status={badgeStatus.badge} text={displayStatus} />
//     // )
// }

// export default DataVolumeStatus
