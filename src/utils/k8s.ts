import type { DataVolume } from "@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb"

const group = 'vink.io'

export const osFamilyLabel = group + '/os-family'
export const osVersionLabel = group + '/os-version'
export const descriptionLabel = group + '/description'
export const diskTypeLabel = group + '/disk'

export const defaultNamespace = 'default'

export const getOperatingSystem = (dv?: DataVolume): { family: string, version: string } => {
    const info = { family: 'linux', version: '' }
    if (!dv || !dv.dataVolume?.metadata?.labels) {
        return info
    }
    const labels = dv.dataVolume.metadata.labels
    if (labels[osFamilyLabel]) {
        info.family = labels[osFamilyLabel].toLowerCase()
    }
    if (labels[osVersionLabel]) {
        info.version = labels[osVersionLabel].toLowerCase()
    }
    return info
}

export const GetDescription = (labels: { [key: string]: string }): string => {
    return labels[descriptionLabel]
}

export const formatOSFamily = (family?: string): string => {
    if (!family) {
        return ''
    }
    // 首字母大写
    let result = family.charAt(0).toUpperCase() + family.slice(1)
    // 如果末尾是 "os"，则改成 "OS"
    if (result.endsWith('os')) {
        result = `${result.slice(0, -2)}OS`
    }
    return result
}

export const formatMemory = (value?: string): [string, string] => {
    if (!value) {
        return ['', '']
    }
    const match = value.match(/^(\d+)(\w+)$/)
    if (match) {
        return [match[1], match[2]]
    }
    return ['', '']
}

export const namespaceName = <T extends { namespace?: string; name?: string }>(obj: T) => {
    return `${obj.namespace}/${obj.name}`
}


export const statusMap: { [key: string]: 'default' | 'processing' | 'success' | 'warning' | 'error' } = {
    'Stopped': 'default',
    'Provisioning': 'processing',
    'Starting': 'processing',
    'Running': 'success',
    'Paused': 'warning',
    'Stopping': 'processing',
    'Terminating': 'processing',
    'CrashLoopBackOff': 'error',
    'Migrating': 'processing',
    'Unknown': 'default',
    'ErrorUnschedulable': 'error',
    'ErrImagePull': 'error',
    'ImagePullBackOff': 'error',
    'ErrorPvcNotFound': 'error',
    'DataVolumeError': 'error',
    'WaitingForVolumeBinding': 'processing',
}
