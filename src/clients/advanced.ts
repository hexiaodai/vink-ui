// import { ResourceType } from "@/apis/types/group_version"
// import { clients, powerStateTypeName, resourceTypeName } from "./clients"
// import { Modal } from "antd"
// import { namespaceNameKey } from "@/utils/k8s"
// import { NamespaceName } from "@/apis/types/namespace_name"
// import { NotificationInstance } from "antd/lib/notification/interface"
// import { generateMessage, getErrorMessage } from "@/utils/utils"
// import { VirtualMachinePowerStateRequest_PowerState } from "@/apis/management/virtualmachine/v1alpha1/virtualmachine"
// import { ListOptions } from "@/apis/types/list_options"

// export const deleteResourceWithNotification = (resourceType: ResourceType, namespaceName: NamespaceName, notification: NotificationInstance) => {
//     const resourceName = resourceTypeName.get(resourceType)
//     Modal.confirm({
//         title: `Delete ${resourceName}?`,
//         content: `Are you sure you want to delete "${namespaceNameKey(namespaceName)}" ${resourceName}? This action cannot be undone.`,
//         okText: "Delete",
//         okType: "danger",
//         cancelText: "Cancel",
//         onOk: async () => {
//             try {
//                 await clients.deleteResource(resourceType, namespaceName)
//             } catch (err) {
//                 notification.error({
//                     message: `Failed to delete ${resourceName}`,
//                     description: getErrorMessage(err)
//                 })
//             }
//         }
//     })
// }

// export const getResourceWithNotification = async (resourceType: ResourceType, namespaceName: NamespaceName, notification: NotificationInstance) => {
//     return new Promise((resolve, reject) => {
//         clients.getResource(resourceType, namespaceName).then(crd => {
//             resolve(crd)
//         }).catch(err => {
//             notification.error({
//                 message: `Failed to get ${resourceTypeName.get(resourceType)} ${namespaceNameKey(namespaceName)}`,
//                 description: getErrorMessage(err)
//             })
//             reject(err)
//         })
//     })
// }

// export const updateResourceWithNotification = async (resourceType: ResourceType, crd: any, notification: NotificationInstance) => {
//     return new Promise((resolve, reject) => {
//         clients.updateResource(resourceType, crd).then(crd => {
//             resolve(crd)
//         }).catch(err => {
//             notification.error({
//                 message: `Failed to update ${resourceTypeName.get(resourceType)} ${namespaceNameKey(crd)}`,
//                 description: getErrorMessage(err)
//             })
//             reject(err)
//         })
//     })
// }

// export const manageVirtualMachinePowerStateWithNotification = async (namespaceName: NamespaceName, state: VirtualMachinePowerStateRequest_PowerState, notification: NotificationInstance) => {
//     return clients.manageVirtualMachinePowerState(namespaceName, state).catch(err => {
//         notification.error({
//             message: `Failed to ${powerStateTypeName.get(state)} virtual machine ${namespaceNameKey(namespaceName)}`,
//             description: getErrorMessage(err)
//         })
//     })
// }

// export const listResourcesWithNotification = async (resourceType: ResourceType, notification: NotificationInstance, opts?: ListOptions): Promise<any[]> => {
//     return new Promise((resolve, reject) => {
//         clients.listResources(resourceType, opts).then(crds => {
//             resolve(crds)
//         }).catch(err => {
//             notification.error({
//                 message: `Failed to list ${resourceTypeName.get(resourceType)}`,
//                 description: getErrorMessage(err)
//             })
//             reject(err)
//         })
//     })
// }

// export const batchManageVirtualMachinePowerStateWithNotification = async (vms: any[], state: VirtualMachinePowerStateRequest_PowerState, notification: NotificationInstance) => {
//     const statusText = powerStateTypeName.get(state)
//     Modal.confirm({
//         title: `批量${statusText}虚拟机？`,
//         content: generateMessage(vms, `即将${statusText} "{names}" 虚拟机，请确认`, `即将${statusText} "{names}" 等 {count} 台虚拟机，请确认。`),
//         okText: `确认${statusText}`,
//         okType: 'danger',
//         cancelText: '取消',
//         okButtonProps: { disabled: false },
//         onOk: async () => {
//             clients.batchManageVirtualMachinePowerState(vms, state).catch(err => {
//                 notification.error({
//                     message: `批量${statusText}虚拟机失败`,
//                     description: getErrorMessage(err)
//                 })
//             })
//         }
//     })
// }

// export const batchDeleteResourcesWithConfirm = async (resourceType: ResourceType, crds: any[], notification: NotificationInstance) => {
//     Modal.confirm({
//         title: "批量删除虚拟机？",
//         content: generateMessage(crds, `即将删除 "{names}" 虚拟机，请确认`, `即将删除 "{names}" 等 {count} 台虚拟机，请确认。`),
//         okText: '确认删除',
//         okType: 'danger',
//         cancelText: '取消',
//         okButtonProps: { disabled: false },
//         onOk: async () => {
//             clients.batchDeleteResources(resourceType, crds).catch(err => {
//                 notification.error({
//                     message: `批量删除${resourceTypeName.get(resourceType)}失败`,
//                     description: getErrorMessage(err)
//                 })
//             })
//         }
//     })
// }
