/* eslint-disable */
// @ts-nocheck
/*
* This file is a generated Typescript file for GRPC Gateway, DO NOT MODIFY
*/

import * as fm from "../../../fetch.pb"
import * as GoogleProtobufEmpty from "../../../google/protobuf/empty.pb"
import * as VinkKubevmIoApisTypesNamespace_name from "../../../types/namespace_name.pb"

export enum VirtualMachinePowerStateRequestPowerState {
  UNSPECIFIED = "UNSPECIFIED",
  ON = "ON",
  OFF = "OFF",
  REBOOT = "REBOOT",
  FORCE_OFF = "FORCE_OFF",
  FORCE_REBOOT = "FORCE_REBOOT",
}

export type VirtualMachinePowerStateRequest = {
  namespaceName?: VinkKubevmIoApisTypesNamespace_name.NamespaceName
  powerState?: VirtualMachinePowerStateRequestPowerState
}

export class VirtualMachineManagement {
  static VirtualMachinePowerState(req: VirtualMachinePowerStateRequest, initReq?: fm.InitReq): Promise<GoogleProtobufEmpty.Empty> {
    return fm.fetchReq<VirtualMachinePowerStateRequest, GoogleProtobufEmpty.Empty>(`/vink.kubevm.io.apis.management.virtualmachine.v1alpha1.VirtualMachineManagement/VirtualMachinePowerState`, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
}