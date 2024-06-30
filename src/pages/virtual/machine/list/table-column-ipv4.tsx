import { Tooltip } from 'antd'
import { VirtualMachine } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'
import { extractIPFromCIDR } from '@/utils/ip'
import styles from '@/pages/virtual/machine/list/styles/table-colume.module.less'

interface TableColumnIPv4Props {
    vm: VirtualMachine
}

const TableColumnIPv4: React.FC<TableColumnIPv4Props> = ({ vm }) => {
    const interfaces = vm.virtualMachineInstance?.status?.interfaces || []
    let firstIP = interfaces[0]?.ipAddress
    let ips = interfaces.flatMap((iface: any) => iface.ipAddresses).join('\n')
    return (<Tooltip title={<span className={styles.ip}>{extractIPFromCIDR(ips)}</span>}>{extractIPFromCIDR(firstIP)}</Tooltip>)
}

export default TableColumnIPv4
