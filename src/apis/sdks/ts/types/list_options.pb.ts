/* eslint-disable */
// @ts-nocheck
/*
* This file is a generated Typescript file for GRPC Gateway, DO NOT MODIFY
*/

import * as VinkKubevmIoApisTypesNamespace_name from "./namespace_name.pb"
export type CustomSelector = {
  namespaceNames?: VinkKubevmIoApisTypesNamespace_name.NamespaceName[]
  fieldSelector?: string[]
}

export type ListOptions = {
  labelSelector?: string
  fieldSelector?: string
  limit?: number
  continue?: string
  namespace?: string
  watch?: boolean
  customSelector?: CustomSelector
}