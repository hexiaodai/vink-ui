import { List, Popover } from 'antd'
import { VirtualMachine } from '@kubevm.io/vink/management/virtualmachine/v1alpha1/virtualmachine.pb'
import styles from '@/pages/virtual/machine/list/styles/table-column-status.module.less'

interface TableColumnStatusProps {
    vm: VirtualMachine
}

interface Handler {
    status: () => string
    conditions: () => { message: string, status: string }[]
}

class TableColumnStatusHandler implements Handler {
    private props: TableColumnStatusProps

    constructor(props: TableColumnStatusProps) {
        this.props = props
    }

    status = () => {
        return this.props.vm.virtualMachine?.status?.printableStatus as string
    }

    conditions = () => {
        return this.props.vm.virtualMachine?.status?.conditions
            ?.filter((c: any) => c.message?.length > 0)
            .map((c: any) => ({ message: c.message, status: c.status })) || []
    }
}

const TableColumnStatus: React.FC<TableColumnStatusProps> = ({ vm }) => {
    const handler = new TableColumnStatusHandler({ vm })

    const content = (
        <List
            className={styles["status-tips"]}
            size="small"
            dataSource={handler.conditions()}
            renderItem={(item: any, index: number) => (
                <List.Item className={item.status === "False" ? styles["warning-color"] : ""}>
                    {index + 1}. {item.message}.
                </List.Item>
            )}
        />
    )

    return (
        <Popover content={content}>
            {handler.status()}
        </Popover>
    )
}

export default TableColumnStatus
