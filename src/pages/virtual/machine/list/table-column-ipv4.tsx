import { List, Popover } from 'antd'
import { VirtualMachine } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'

interface TableColumnIPv4Props {
    vm: VirtualMachine
}

interface Handler {
    firstIP: () => string
    ips: () => any[]
}

class TableColumnIPv4Handler implements Handler {
    private props: TableColumnIPv4Props

    constructor(props: TableColumnIPv4Props) {
        this.props = props
    }

    firstIP = () => {
        const interfaces = this.props.vm.virtualMachineInstance?.status?.interfaces || []
        return interfaces[0]?.ipAddress
    }

    ips = () => {
        const interfaces = this.props.vm.virtualMachineInstance?.status?.interfaces || []
        return interfaces.flatMap((iface: any) => iface.ipAddresses)
    }
}

const TableColumnIPv4: React.FC<TableColumnIPv4Props> = ({ vm }) => {
    const handler = new TableColumnIPv4Handler({ vm })

    const content = (
        <List
            size="small"
            dataSource={handler.ips()}
            renderItem={(ip: string) => (
                <List.Item>
                    {ip}
                </List.Item>
            )}
        />
    )

    return (
        <Popover content={content}>
            {handler.firstIP()}
        </Popover>
    )
}

export default TableColumnIPv4
