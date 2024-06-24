/* eslint-disable */
// @ts-nocheck
/*
* This file is a generated Typescript file for GRPC Gateway, DO NOT MODIFY
*/

import * as VinkCommonCommon from "../../../common/common.pb"
import * as fm from "../../../fetch.pb"
import * as GoogleProtobufStruct from "../../../google/protobuf/struct.pb"
import * as GoogleProtobufTimestamp from "../../../google/protobuf/timestamp.pb"

export enum ManageVirtualMachinePowerStateRequestPowerState {
  UNSPECIFIED = "UNSPECIFIED",
  ON = "ON",
  OFF = "OFF",
}

export type VirtualMachineDisk = {
  root?: GoogleProtobufStruct.Struct
  data?: GoogleProtobufStruct.Struct[]
}

export type VirtualMachine = {
  namespace?: string
  name?: string
  virtualMachine?: GoogleProtobufStruct.Struct
  virtualMachineInstance?: GoogleProtobufStruct.Struct
  virtualMachineDisk?: VirtualMachineDisk
  creationTimestamp?: GoogleProtobufTimestamp.Timestamp
}

export type VirtualMachineInstance = {
  namespace?: string
  name?: string
  spec?: GoogleProtobufStruct.Struct
  status?: GoogleProtobufStruct.Struct
}

export type VirtualMachineConfignamespaceNamed = {
  namespace?: string
  name?: string
}

export type VirtualMachineConfigStorageBootDisk = {
  dataVolumeRef?: VirtualMachineConfignamespaceNamed
  capacity?: string
  storageClassName?: string
}

export type VirtualMachineConfigStorageDataDisk = {
  dataVolumeRef?: string
}

export type VirtualMachineConfigStorage = {
  bootDisk?: VirtualMachineConfigStorageBootDisk
  dataDisks?: VirtualMachineConfigStorageDataDisk[]
}

export type VirtualMachineConfigNetwork = {
  multusConfigRef?: string
  ippoolRef?: string
}

export type VirtualMachineConfigResources = {
  cpuCores?: number
  memory?: string
}

export type VirtualMachineConfigUserConfig = {
  cloudInitBase64?: string
  sshPublicKeys?: string[]
}

export type VirtualMachineConfig = {
  storage?: VirtualMachineConfigStorage
  network?: VirtualMachineConfigNetwork
  resources?: VirtualMachineConfigResources
  userConfig?: VirtualMachineConfigUserConfig
}

export type CreateVirtualMachineRequest = {
  namespace?: string
  name?: string
  config?: VirtualMachineConfig
}

export type DeleteVirtualMachineRequest = {
  namespace?: string
  name?: string
}

export type DeleteVirtualMachineResponse = {
}

export type ListVirtualMachinesRequest = {
  namespace?: string
  options?: VinkCommonCommon.ListOptions
}

export type ListVirtualMachinesResponse = {
  items?: VirtualMachine[]
  options?: VinkCommonCommon.ListOptions
}

export type ManageVirtualMachinePowerStateRequest = {
  namespace?: string
  name?: string
  powerState?: ManageVirtualMachinePowerStateRequestPowerState
}

export class VirtualMachineManagement {
  static CreateVirtualMachine(req: CreateVirtualMachineRequest, initReq?: fm.InitReq): Promise<VirtualMachine> {
    return fm.fetchReq<CreateVirtualMachineRequest, VirtualMachine>(`/apis/vink.io/v1alpha1/namespaces/${req["namespace"]}/virtualmachines/${req["name"]}`, { ...initReq, method: "POST", body: JSON.stringify(req, fm.replacer) })
  }
  static DeleteVirtualMachine(req: DeleteVirtualMachineRequest, initReq?: fm.InitReq): Promise<DeleteVirtualMachineResponse> {
    return fm.fetchReq<DeleteVirtualMachineRequest, DeleteVirtualMachineResponse>(`/apis/vink.io/v1alpha1/namespaces/${req["namespace"]}/virtualmachines/${req["name"]}`, { ...initReq, method: "DELETE" })
  }
  static ListVirtualMachines(req: ListVirtualMachinesRequest, initReq?: fm.InitReq): Promise<ListVirtualMachinesResponse> {
    return fm.fetchReq<ListVirtualMachinesRequest, ListVirtualMachinesResponse>(`/apis/vink.io/v1alpha1/namespaces/${req["namespace"]}/virtualmachines?${fm.renderURLSearchParams(req, ["namespace"])}`, { ...initReq, method: "GET" })
  }
  static ManageVirtualMachinePowerState(req: ManageVirtualMachinePowerStateRequest, initReq?: fm.InitReq): Promise<VirtualMachine> {
    return fm.fetchReq<ManageVirtualMachinePowerStateRequest, VirtualMachine>(`/apis/vink.io/v1alpha1/namespaces/${req["namespace"]}/virtualmachines/${req["name"]}/power`, { ...initReq, method: "PUT", body: JSON.stringify(req, fm.replacer) })
  }
}