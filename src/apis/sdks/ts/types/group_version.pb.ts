/* eslint-disable */
// @ts-nocheck
/*
* This file is a generated Typescript file for GRPC Gateway, DO NOT MODIFY
*/

type Absent<T, K extends keyof T> = { [k in Exclude<keyof T, K>]?: undefined };
type OneOf<T> =
  | { [k in keyof T]?: undefined }
  | (
    keyof T extends infer K ?
      (K extends string & keyof T ? { [k in K]: T[K] } & Absent<T, K>
        : never)
    : never);

export enum GroupVersionResourceEnum {
  UNSPECIFIED = "UNSPECIFIED",
  VIRTUAL_MACHINE = "VIRTUAL_MACHINE",
  VIRTUAL_MACHINE_INSTANCE = "VIRTUAL_MACHINE_INSTANCE",
  DATA_VOLUME = "DATA_VOLUME",
  NODE = "NODE",
  NAMESPACE = "NAMESPACE",
  MULTUS = "MULTUS",
  SUBNET = "SUBNET",
  VPC = "VPC",
  IPPOOL = "IPPOOL",
  STORAGE_CLASS = "STORAGE_CLASS",
  IPS = "IPS",
  VIRTUAL_MACHINE_INSTANCE_SUMMARY = "VIRTUAL_MACHINE_INSTANCE_SUMMARY",
}

export type GroupVersionResource = {
  group?: string
  version?: string
  resource?: string
}

export type GroupVersionKind = {
  group?: string
  version?: string
  kind?: string
}


type BaseGroupVersionResourceIdentifier = {
}

export type GroupVersionResourceIdentifier = BaseGroupVersionResourceIdentifier
  & OneOf<{ enum: GroupVersionResourceEnum; custom: GroupVersionResource }>