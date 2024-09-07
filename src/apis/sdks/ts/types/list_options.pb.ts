/* eslint-disable */
// @ts-nocheck
/*
* This file is a generated Typescript file for GRPC Gateway, DO NOT MODIFY
*/

import * as VinkKubevmIoApisTypesNamespace_name from "./namespace_name.pb"
export type ListOptions = {
  labelSelector?: string
  fieldSelector?: string
  limit?: number
  continue?: string
  namespaceNames?: VinkKubevmIoApisTypesNamespace_name.NamespaceName[]
  watch?: boolean
}