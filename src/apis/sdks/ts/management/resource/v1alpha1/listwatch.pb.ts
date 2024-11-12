/* eslint-disable */
// @ts-nocheck
/*
* This file is a generated Typescript file for GRPC Gateway, DO NOT MODIFY
*/

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
  resourceType?: VinkKubevmIoApisTypesGroup_version.ResourceType
  options?: VinkKubevmIoApisTypesList_options.ListOptions
}

export type ListWatchResponse = {
  eventType?: EventType
  items?: string[]
  deleted?: VinkKubevmIoApisTypesNamespace_name.NamespaceName
  options?: VinkKubevmIoApisTypesList_options.ListOptions
}

export class ResourceListWatchManagement {
  static ListWatch(req: ListWatchRequest, entityNotifier?: fm.NotifyStreamEntityArrival<ListWatchResponse>, initReq?: fm.InitReq): Promise<void> {
    return fm.fetchStreamingRequest<ListWatchRequest, ListWatchResponse>(`/vink.kubevm.io.apis.management.resource.v1alpha1.ResourceListWatchManagement/ListWatch`, entityNotifier, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
}