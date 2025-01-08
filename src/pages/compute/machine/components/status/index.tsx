import { VirtualMachine } from '@/clients/virtual-machine'
import { Badge } from 'antd'

interface Props {
    vm: VirtualMachine
}

const VirtualMachineStatus: React.FC<Props> = ({ vm }) => {
    const status = vm.status?.printableStatus
    if (!status) {
        return
    }
    const badgeStatus = statusMap[status]
    if (!badgeStatus) {
        return
    }
    return (
        <Badge status={badgeStatus.badge} text={badgeStatus.text} />
    )
}

export default VirtualMachineStatus

export const statusMap: { [key: string]: { badge: "default" | "processing" | "success" | "warning" | "error", text: string } } = {
    'Stopped': { badge: "default", text: '已停止' },
    'Provisioning': { badge: "processing", text: '正在创建' },
    'Starting': { badge: "processing", text: '正在启动' },
    'Running': { badge: "success", text: '正在运行' },
    'Paused': { badge: "warning", text: '已暂停' },
    'Stopping': { badge: "processing", text: '正在停止' },
    'Terminating': { badge: "processing", text: '正在删除' },
    'CrashLoopBackOff': { badge: "error", text: '异常' },
    'Migrating': { badge: "processing", text: '正在迁移' },
    'Unknown': { badge: "default", text: '未知' },
    'ErrorUnschedulable': { badge: "error", text: '异常' },
    'ErrImagePull': { badge: "error", text: '异常' },
    'ImagePullBackOff': { badge: "error", text: '异常' },
    'ErrorPvcNotFound': { badge: "error", text: '异常' },
    'DataVolumeError': { badge: "error", text: '异常' },
    'WaitingForVolumeBinding': { badge: "processing", text: "等待绑定卷" },
}
