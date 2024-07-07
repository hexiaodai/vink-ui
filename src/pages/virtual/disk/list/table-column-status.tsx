import { List, Popover } from 'antd'
import { DataVolume } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import styles from '@/pages/virtual/image/list/styles/table-column-status.module.less'

interface TableColumnStatusProps {
    dv: DataVolume
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
        const status = this.props.dv.dataVolume?.status
        const displayStatus = status?.phase === 'ImportInProgress' ? status?.progress : status?.phase
        return displayStatus
    }

    conditions = () => {
        return this.props.dv.dataVolume?.status?.conditions
            ?.filter((c: any) => c.message?.length > 0)
            .map((c: any) => ({ message: c.message, status: c.status })) || []
    }
}

const TableColumnStatus: React.FC<TableColumnStatusProps> = ({ dv }) => {
    const handler = new TableColumnStatusHandler({ dv })

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
