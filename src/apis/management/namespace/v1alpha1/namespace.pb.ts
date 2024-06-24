/* eslint-disable */
// @ts-nocheck
/*
* This file is a generated Typescript file for GRPC Gateway, DO NOT MODIFY
*/

import * as VinkCommonCommon from "../../../common/common.pb"
import * as fm from "../../../fetch.pb"
import * as GoogleProtobufStruct from "../../../google/protobuf/struct.pb"
import * as GoogleProtobufTimestamp from "../../../google/protobuf/timestamp.pb"
export type NamespaceConfig = {
}

export type Namespace = {
  name?: string
  creationTimestamp?: GoogleProtobufTimestamp.Timestamp
  namespace?: GoogleProtobufStruct.Struct
}

export type CreateNamespaceRequest = {
  name?: string
  namespaceConfig?: NamespaceConfig
}

export type DeleteNamespaceRequest = {
  name?: string
}

export type DeleteNamespaceResponse = {
}

export type ListNamespacesRequest = {
  options?: VinkCommonCommon.ListOptions
}

export type ListNamespacesResponse = {
  items?: Namespace[]
  options?: VinkCommonCommon.ListOptions
}

export class NamespaceManagement {
  static CreateNamespace(req: CreateNamespaceRequest, initReq?: fm.InitReq): Promise<Namespace> {
    return fm.fetchReq<CreateNamespaceRequest, Namespace>(`/apis/vink.io/v1alpha1/namespaces/${req["name"]}`, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
  static DeleteNamespace(req: DeleteNamespaceRequest, initReq?: fm.InitReq): Promise<DeleteNamespaceResponse> {
    return fm.fetchReq<DeleteNamespaceRequest, DeleteNamespaceResponse>(`/apis/vink.io/v1alpha1/namespaces/${req["name"]}`, {...initReq, method: "DELETE"})
  }
  static ListNamespaces(req: ListNamespacesRequest, initReq?: fm.InitReq): Promise<ListNamespacesResponse> {
    return fm.fetchReq<ListNamespacesRequest, ListNamespacesResponse>(`/apis/vink.io/v1alpha1/namespaces?${fm.renderURLSearchParams(req, [])}`, {...initReq, method: "GET"})
  }
}