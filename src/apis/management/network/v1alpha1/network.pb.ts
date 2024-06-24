/* eslint-disable */
// @ts-nocheck
/*
* This file is a generated Typescript file for GRPC Gateway, DO NOT MODIFY
*/

import * as VinkCommonCommon from "../../../common/common.pb"
import * as fm from "../../../fetch.pb"
import * as GoogleProtobufStruct from "../../../google/protobuf/struct.pb"
import * as GoogleProtobufTimestamp from "../../../google/protobuf/timestamp.pb"
export type NodeNetworkInterfaceNode = {
  name?: string
}

export type NodeNetworkInterfaceNetworkInterface = {
  name?: string
  ip?: string
  subnet?: string
  gateway?: string
  state?: string
}

export type NodeNetworkInterface = {
  node?: NodeNetworkInterfaceNode
  networkInterface?: NodeNetworkInterfaceNetworkInterface[]
}

export type MultusConfig = {
  name?: string
  creationTimestamp?: GoogleProtobufTimestamp.Timestamp
  spec?: GoogleProtobufStruct.Struct
  status?: GoogleProtobufStruct.Struct
}

export type ListNodesNetworkInterfacesRequest = {
  options?: VinkCommonCommon.ListOptions
}

export type ListNodesNetworkInterfacesResponse = {
  items?: NodeNetworkInterface[]
  options?: VinkCommonCommon.ListOptions
}

export type CreateMultusConfigRequest = {
  name?: string
  nic?: string
}

export type UpdateMultusConfigRequest = {
  name?: string
  nic?: string
}

export type Subnet = {
  name?: string
  creationTimestamp?: GoogleProtobufTimestamp.Timestamp
  spec?: GoogleProtobufStruct.Struct
  status?: GoogleProtobufStruct.Struct
}

export type IPPool = {
  name?: string
  creationTimestamp?: GoogleProtobufTimestamp.Timestamp
  spec?: GoogleProtobufStruct.Struct
  status?: GoogleProtobufStruct.Struct
}

export type SubnetConfigRoute = {
  dst?: string
  gw?: string
}

export type SubnetConfig = {
  gateway?: string
  ips?: string[]
  excludeIps?: string[]
  subnet?: string
  routes?: SubnetConfigRoute[]
}

export type IPPoolConfigRoute = {
  dst?: string
  gw?: string
}

export type IPPoolConfig = {
  gateway?: string
  ips?: string[]
  excludeIps?: string[]
  subnet?: string
  routes?: IPPoolConfigRoute[]
}

export type CreateSubnetRequest = {
  name?: string
  config?: SubnetConfig
}

export type UpdateSubnetRequest = {
  name?: string
  config?: SubnetConfig
}

export type CreateIPPoolRequest = {
  name?: string
  config?: IPPoolConfig
}

export type UpdateIPPoolRequest = {
  name?: string
  config?: IPPoolConfig
}

export type DeleteMultusConfigRequest = {
  name?: string
}

export type DeleteMultusConfigResponse = {
}

export type DeleteSubnetRequest = {
  name?: string
}

export type DeleteSubnetResponse = {
}

export type DeleteIPPoolRequest = {
  name?: string
}

export type DeleteIPPoolResponse = {
}

export type ListMultusConfigsRequest = {
  options?: VinkCommonCommon.ListOptions
}

export type ListMultusConfigsResponse = {
  items?: MultusConfig[]
  options?: VinkCommonCommon.ListOptions
}

export type ListSubnetsRequest = {
  options?: VinkCommonCommon.ListOptions
}

export type ListSubnetsResponse = {
  items?: Subnet[]
  options?: VinkCommonCommon.ListOptions
}

export type ListIPPoolsRequest = {
  options?: VinkCommonCommon.ListOptions
}

export type ListIPPoolsResponse = {
  items?: IPPool[]
  options?: VinkCommonCommon.ListOptions
}

export class NetworkManagement {
  static ListNodesNetworkInterfaces(req: ListNodesNetworkInterfacesRequest, initReq?: fm.InitReq): Promise<ListNodesNetworkInterfacesResponse> {
    return fm.fetchReq<ListNodesNetworkInterfacesRequest, ListNodesNetworkInterfacesResponse>(`/apis/vink.io/v1alpha1/network/nodes/network-interfaces?${fm.renderURLSearchParams(req, [])}`, {...initReq, method: "GET"})
  }
  static CreateMultusConfig(req: CreateMultusConfigRequest, initReq?: fm.InitReq): Promise<MultusConfig> {
    return fm.fetchReq<CreateMultusConfigRequest, MultusConfig>(`/apis/vink.io/v1alpha1/network/multus-configs/${req["name"]}`, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
  static CreateSubnet(req: CreateSubnetRequest, initReq?: fm.InitReq): Promise<Subnet> {
    return fm.fetchReq<CreateSubnetRequest, Subnet>(`/apis/vink.io/v1alpha1/network/subnets/${req["name"]}`, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
  static CreateIPPool(req: CreateIPPoolRequest, initReq?: fm.InitReq): Promise<IPPool> {
    return fm.fetchReq<CreateIPPoolRequest, IPPool>(`/apis/vink.io/v1alpha1/network/ippools/${req["name"]}`, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
  static UpdateMultusConfig(req: UpdateMultusConfigRequest, initReq?: fm.InitReq): Promise<MultusConfig> {
    return fm.fetchReq<UpdateMultusConfigRequest, MultusConfig>(`/apis/vink.io/v1alpha1/network/multus-configs/${req["name"]}`, {...initReq, method: "PUT", body: JSON.stringify(req, fm.replacer)})
  }
  static UpdateSubnet(req: UpdateSubnetRequest, initReq?: fm.InitReq): Promise<Subnet> {
    return fm.fetchReq<UpdateSubnetRequest, Subnet>(`/apis/vink.io/v1alpha1/network/subnets/${req["name"]}`, {...initReq, method: "PUT", body: JSON.stringify(req, fm.replacer)})
  }
  static UpdateIPPool(req: UpdateIPPoolRequest, initReq?: fm.InitReq): Promise<IPPool> {
    return fm.fetchReq<UpdateIPPoolRequest, IPPool>(`/apis/vink.io/v1alpha1/network/ippools/${req["name"]}`, {...initReq, method: "PUT", body: JSON.stringify(req, fm.replacer)})
  }
  static DeleteMultusConfig(req: DeleteMultusConfigRequest, initReq?: fm.InitReq): Promise<DeleteMultusConfigResponse> {
    return fm.fetchReq<DeleteMultusConfigRequest, DeleteMultusConfigResponse>(`/apis/vink.io/v1alpha1/network/multus-configs/${req["name"]}`, {...initReq, method: "DELETE"})
  }
  static DeleteSubnet(req: DeleteSubnetRequest, initReq?: fm.InitReq): Promise<DeleteSubnetResponse> {
    return fm.fetchReq<DeleteSubnetRequest, DeleteSubnetResponse>(`/apis/vink.io/v1alpha1/network/subnets/${req["name"]}`, {...initReq, method: "DELETE"})
  }
  static DeleteIPPool(req: DeleteIPPoolRequest, initReq?: fm.InitReq): Promise<DeleteIPPoolResponse> {
    return fm.fetchReq<DeleteIPPoolRequest, DeleteIPPoolResponse>(`/apis/vink.io/v1alpha1/network/ippools/${req["name"]}`, {...initReq, method: "DELETE"})
  }
  static ListMultusConfigs(req: ListMultusConfigsRequest, initReq?: fm.InitReq): Promise<ListMultusConfigsResponse> {
    return fm.fetchReq<ListMultusConfigsRequest, ListMultusConfigsResponse>(`/apis/vink.io/v1alpha1/network/multus-configs?${fm.renderURLSearchParams(req, [])}`, {...initReq, method: "GET"})
  }
  static ListSubnets(req: ListSubnetsRequest, initReq?: fm.InitReq): Promise<ListSubnetsResponse> {
    return fm.fetchReq<ListSubnetsRequest, ListSubnetsResponse>(`/apis/vink.io/v1alpha1/network/subnets?${fm.renderURLSearchParams(req, [])}`, {...initReq, method: "GET"})
  }
  static ListIPPools(req: ListIPPoolsRequest, initReq?: fm.InitReq): Promise<ListIPPoolsResponse> {
    return fm.fetchReq<ListIPPoolsRequest, ListIPPoolsResponse>(`/apis/vink.io/v1alpha1/network/ippools?${fm.renderURLSearchParams(req, [])}`, {...initReq, method: "GET"})
  }
}