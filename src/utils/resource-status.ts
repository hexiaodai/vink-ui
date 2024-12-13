interface Status { badge: 'default' | 'processing' | 'success' | 'warning' | 'error', text: string }

export const virtualMachineStatusMap: { [key: string]: Status } = {
    '': { badge: "default", text: '未知' },
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

export const dataVolumeStatusMap: { [key: string]: Status } = {
    '': { badge: "default", text: '未知' },
    'Pending': { badge: "processing", text: '等待绑定卷' },
    'PVCBound': { badge: "processing", text: '等待绑定卷' },
    'ImportScheduled': { badge: "processing", text: '等待导入' },
    'ImportInProgress': { badge: "processing", text: '正在导入' },
    'CloneScheduled': { badge: "processing", text: '等待克隆' },
    'CloneInProgress': { badge: "processing", text: '正在克隆' },
    'SnapshotForSmartCloneInProgress': { badge: "processing", text: '正在快照' },
    'CloneFromSnapshotSourceInProgress': { badge: "processing", text: '正在克隆' },
    'SmartClonePVCInProgress': { badge: "processing", text: '正在克隆' },
    'CSICloneInProgress': { badge: "processing", text: '正在克隆' },
    'ExpansionInProgress': { badge: "processing", text: '正在扩容' },
    'NamespaceTransferInProgress': { badge: "processing", text: '正在迁移' },
    'UploadScheduled': { badge: "processing", text: '等待上传' },
    'UploadReady': { badge: "processing", text: '等待上传' },
    'WaitForFirstConsumer': { badge: "processing", text: '等待绑定卷' },
    'PendingPopulation': { badge: "processing", text: '等待绑定卷' },
    'Succeeded': { badge: "success", text: '就绪' },
    'Failed': { badge: "error", text: '异常' },
    'Unknown': { badge: "default", text: '未知' },
    'Paused': { badge: "warning", text: '已暂停' },
    'PrepClaimInProgress': { badge: "processing", text: '正在迁移' },
    'RebindInProgress': { badge: "processing", text: '正在迁移' },
}

export const subnetStatus = (subnet: any): Status => {
    let output: Status = { badge: "warning", text: "未就绪" }

    const result = subnet.status.conditions?.find((item: any) => {
        if (item.type == "Ready") {
            return true
        }
    })
    if (!result) {
        return output
    }

    output = { badge: "success", text: "就绪" }
    return output
}
