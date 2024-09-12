/* eslint-disable */
// @ts-nocheck
/*
* This file is a generated Typescript file for GRPC Gateway, DO NOT MODIFY
*/

import * as VinkKubevmIoApisApiextensionsV1alpha1Custom_resource_definition from "../../../apiextensions/v1alpha1/custom_resource_definition.pb"
import * as fm from "../../../fetch.pb"
import * as GoogleProtobufEmpty from "../../../google/protobuf/empty.pb"
import * as VinkKubevmIoApisTypesGroup_version from "../../../types/group_version.pb"
import * as VinkKubevmIoApisTypesNamespace_name from "../../../types/namespace_name.pb"
export type GetRequest = {
  groupVersionResource?: VinkKubevmIoApisTypesGroup_version.GroupVersionKind
  namespaceName?: VinkKubevmIoApisTypesNamespace_name.NamespaceName
}

export type CreateRequest = {
  groupVersionResource?: VinkKubevmIoApisTypesGroup_version.GroupVersionResourceIdentifier
  data?: string
}

export type UpdateRequest = {
}

export type DeleteRequest = {
  groupVersionResource?: VinkKubevmIoApisTypesGroup_version.GroupVersionResourceIdentifier
  namespaceName?: VinkKubevmIoApisTypesNamespace_name.NamespaceName
}

export class ResourceManagement {
  static Get(req: GetRequest, initReq?: fm.InitReq): Promise<VinkKubevmIoApisApiextensionsV1alpha1Custom_resource_definition.CustomResourceDefinition> {
    return fm.fetchReq<GetRequest, VinkKubevmIoApisApiextensionsV1alpha1Custom_resource_definition.CustomResourceDefinition>(`/vink.kubevm.io.apis.management.resource.v1alpha1.ResourceManagement/Get`, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
  static Create(req: CreateRequest, initReq?: fm.InitReq): Promise<VinkKubevmIoApisApiextensionsV1alpha1Custom_resource_definition.CustomResourceDefinition> {
    return fm.fetchReq<CreateRequest, VinkKubevmIoApisApiextensionsV1alpha1Custom_resource_definition.CustomResourceDefinition>(`/vink.kubevm.io.apis.management.resource.v1alpha1.ResourceManagement/Create`, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
  static Update(req: UpdateRequest, initReq?: fm.InitReq): Promise<VinkKubevmIoApisApiextensionsV1alpha1Custom_resource_definition.CustomResourceDefinition> {
    return fm.fetchReq<UpdateRequest, VinkKubevmIoApisApiextensionsV1alpha1Custom_resource_definition.CustomResourceDefinition>(`/vink.kubevm.io.apis.management.resource.v1alpha1.ResourceManagement/Update`, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
  static Delete(req: DeleteRequest, initReq?: fm.InitReq): Promise<GoogleProtobufEmpty.Empty> {
    return fm.fetchReq<DeleteRequest, GoogleProtobufEmpty.Empty>(`/vink.kubevm.io.apis.management.resource.v1alpha1.ResourceManagement/Delete`, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
}