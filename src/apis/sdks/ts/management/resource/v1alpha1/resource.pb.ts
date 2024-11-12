/* eslint-disable */
// @ts-nocheck
/*
* This file is a generated Typescript file for GRPC Gateway, DO NOT MODIFY
*/

import * as fm from "../../../fetch.pb"
import * as GoogleProtobufEmpty from "../../../google/protobuf/empty.pb"
import * as VinkKubevmIoApisTypesGroup_version from "../../../types/group_version.pb"
import * as VinkKubevmIoApisTypesNamespace_name from "../../../types/namespace_name.pb"
export type CustomResourceDefinitionResponse = {
  data?: string
}

export type GetRequest = {
  resourceType?: VinkKubevmIoApisTypesGroup_version.ResourceType
  namespaceName?: VinkKubevmIoApisTypesNamespace_name.NamespaceName
}

export type CreateRequest = {
  resourceType?: VinkKubevmIoApisTypesGroup_version.ResourceType
  data?: string
}

export type UpdateRequest = {
  resourceType?: VinkKubevmIoApisTypesGroup_version.ResourceType
  data?: string
}

export type DeleteRequest = {
  resourceType?: VinkKubevmIoApisTypesGroup_version.ResourceType
  namespaceName?: VinkKubevmIoApisTypesNamespace_name.NamespaceName
}

export class ResourceManagement {
  static Get(req: GetRequest, initReq?: fm.InitReq): Promise<CustomResourceDefinitionResponse> {
    return fm.fetchReq<GetRequest, CustomResourceDefinitionResponse>(`/vink.kubevm.io.apis.management.resource.v1alpha1.ResourceManagement/Get`, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
  static Create(req: CreateRequest, initReq?: fm.InitReq): Promise<CustomResourceDefinitionResponse> {
    return fm.fetchReq<CreateRequest, CustomResourceDefinitionResponse>(`/vink.kubevm.io.apis.management.resource.v1alpha1.ResourceManagement/Create`, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
  static Update(req: UpdateRequest, initReq?: fm.InitReq): Promise<CustomResourceDefinitionResponse> {
    return fm.fetchReq<UpdateRequest, CustomResourceDefinitionResponse>(`/vink.kubevm.io.apis.management.resource.v1alpha1.ResourceManagement/Update`, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
  static Delete(req: DeleteRequest, initReq?: fm.InitReq): Promise<GoogleProtobufEmpty.Empty> {
    return fm.fetchReq<DeleteRequest, GoogleProtobufEmpty.Empty>(`/vink.kubevm.io.apis.management.resource.v1alpha1.ResourceManagement/Delete`, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
}