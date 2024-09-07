/* eslint-disable */
// @ts-nocheck
/*
* This file is a generated Typescript file for GRPC Gateway, DO NOT MODIFY
*/
export type OwnerReference = {
  apiVersion?: string
  kind?: string
  name?: string
  uid?: string
  controller?: boolean
  blockOwnerDeletion?: boolean
}

export type ObjectMeta = {
  name?: string
  generateName?: string
  namespace?: string
  selfLink?: string
  uid?: string
  resourceVersion?: string
  generation?: string
  creationTimestamp?: string
  deletionTimestamp?: string
  deletionGracePeriodSeconds?: string
  labels?: {[key: string]: string}
  annotations?: {[key: string]: string}
  ownerReferences?: OwnerReference[]
  finalizers?: string[]
}

export type Selector = {
  matchLabels?: {[key: string]: string}
}

export type LabelSelector = {
  matchLabels?: {[key: string]: string}
  matchExpressions?: LabelSelectorRequirement[]
}

export type LabelSelectorRequirement = {
  key?: string
  operator?: string
  values?: string[]
}