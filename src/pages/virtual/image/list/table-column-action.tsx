import { Dropdown, MenuProps, Modal } from 'antd'
import { EllipsisOutlined } from '@ant-design/icons'
import { DataVolume, DataVolumeManagement } from '@kubevm.io/vink/management/datavolume/v1alpha1/datavolume.pb'
import { useErrorNotification } from '@/components/notification'
import commonTableStyles from '@/common/styles/table.module.less'

interface TableColumnActionProps {
    dv: DataVolume
}

const TableColumnAction: React.FC<TableColumnActionProps> = ({ dv }) => {
    const { contextHolder, showErrorNotification } = useErrorNotification()

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
            onClick: () => handleDelete(dv),
            label: "删除"
        }
    ]

    const handleDelete = async (vm: DataVolume) => {
        Modal.confirm({
            title: "删除镜像？",
            content: `即将删除镜像 "${vm.namespace}/${vm.name}"，请确认。`,
            okText: '确认删除',
            okType: 'danger',
            cancelText: '取消',
            okButtonProps: {
                disabled: false,
            },
            onOk: async () => {
                await doDelete()
            },
            onCancel() { },
        })

        const doDelete = async () => {
            try {
                const request = {
                    namespace: vm.namespace,
                    name: vm.name,
                }
                await DataVolumeManagement.DeleteDataVolume(request)
            } catch (err) {
                showErrorNotification('Delete virtual machine', err)
            } finally {
            }
        }
    }

    return (
        <div className={commonTableStyles['action-bar']} >
            {contextHolder}
            <Dropdown menu={{ items }} trigger={['click']}>
                <EllipsisOutlined className={commonTableStyles['action-bar-icon']} />
            </Dropdown>
        </div>
    )
}

export default TableColumnAction


