/* eslint-disable */
// @ts-nocheck
/*
* This file is a generated Typescript file for GRPC Gateway, DO NOT MODIFY
*/

import * as VinkKubevmIoApisApiextensionsV1alpha1Custom_resource_definition from "../../../apiextensions/v1alpha1/custom_resource_definition.pb"
import * as fm from "../../../fetch.pb"
import * as VinkKubevmIoApisTypesGroup_version from "../../../types/group_version.pb"
import * as VinkKubevmIoApisTypesList_options from "../../../types/list_options.pb"
import * as VinkKubevmIoApisTypesNamespace_name from "../../../types/namespace_name.pb"

export enum EventType {
  ADDED = "ADDED",
  MODIFIED = "MODIFIED",
  DELETED = "DELETED",
}

export type ListWatchRequest = {
  groupVersionResource?: VinkKubevmIoApisTypesGroup_version.GroupVersionResourceIdentifier
  options?: VinkKubevmIoApisTypesList_options.ListOptions
}

export type ListWatchResponse = {
  eventType?: EventType
  items?: VinkKubevmIoApisApiextensionsV1alpha1Custom_resource_definition.CustomResourceDefinition[]
  deleted?: VinkKubevmIoApisTypesNamespace_name.NamespaceName
  options?: VinkKubevmIoApisTypesList_options.ListOptions
}

export class ResourceListWatchManagement {
  static ListWatch(req: ListWatchRequest, entityNotifier?: fm.NotifyStreamEntityArrival<ListWatchResponse>, initReq?: fm.InitReq): Promise<void> {
    return fm.fetchStreamingRequest<ListWatchRequest, ListWatchResponse>(`/vink.kubevm.io.apis.management.resource.v1alpha1.ResourceListWatchManagement/ListWatch`, entityNotifier, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
}