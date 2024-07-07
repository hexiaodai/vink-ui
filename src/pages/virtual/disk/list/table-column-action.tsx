import { Dropdown, MenuProps, Modal } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'
import { DataVolume } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import { useDataVolumeNotification } from '@/components/notification'
import { DataVolumeManagement } from '@/apis-management/datavolume'
import commonTableStyles from '@/common/styles/table.module.less'

interface TableColumnActionProps {
    dv: DataVolume
}

interface Handler {
    deleteVirtualMachine: () => void
}

class TableColumeActionHandler implements Handler {
    private props: TableColumnActionProps
    private notification: any

    constructor(props: TableColumnActionProps, notification: any) {
        this.props = props
        this.notification = notification
    }

    deleteVirtualMachine = async () => {
        Modal.confirm({
            title: "删除磁盘？",
            content: `即将删除 "${this.props.dv.namespace}/${this.props.dv.name}" 磁盘，请确认。`,
            okText: '确认删除',
            okType: 'danger',
            cancelText: '取消',
            okButtonProps: {
                disabled: false,
            },
            onOk: async () => {
                await DataVolumeManagement.DeleteDataVolumeWithNotification(this.props.dv, this.notification)
            },
            onCancel() { }
        })
    }
}

const TableColumnAction: React.FC<TableColumnActionProps> = ({ dv }) => {
    const { notificationContext, showDataVolumeNotification } = useDataVolumeNotification()

    const handler = new TableColumeActionHandler({ dv }, showDataVolumeNotification)

    const items: MenuProps['items'] = [
        {
            key: 'edit',
            label: "编辑"
        },
        {
            key: 'divider-2',
            type: 'divider'
        },
        {
            key: 'delete',
            danger: true,
            onClick: () => handler.deleteVirtualMachine(),
            label: "删除"
        }
    ]

    return (
        <div className={commonTableStyles['action-bar']} >
            {notificationContext}
            <Dropdown menu={{ items }} trigger={['click']}>
                <EllipsisOutlined className={commonTableStyles['action-bar-icon']} />
            </Dropdown>
        </div>
    )
}

export default TableColumnAction


