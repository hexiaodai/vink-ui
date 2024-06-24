/* eslint-disable */
// @ts-nocheck
/*
* This file is a generated Typescript file for GRPC Gateway, DO NOT MODIFY
*/

import * as VinkCommonCommon from "../../../common/common.pb"
import * as fm from "../../../fetch.pb"
import * as GoogleProtobufStruct from "../../../google/protobuf/struct.pb"
import * as GoogleProtobufTimestamp from "../../../google/protobuf/timestamp.pb"

type Absent<T, K extends keyof T> = { [k in Exclude<keyof T, K>]?: undefined };
type OneOf<T> =
  | { [k in keyof T]?: undefined }
  | (
    keyof T extends infer K ?
      (K extends string & keyof T ? { [k in K]: T[K] } & Absent<T, K>
        : never)
    : never);

export enum DataVolumeConfigDisk {
  DATA = "DATA",
  BOOT = "BOOT",
}

export type DataVolumeConfigDataSourceBlank = {
}

export type DataVolumeConfigDataSourceUpload = {
}

export type DataVolumeConfigDataSourceHttp = {
  url?: string
  headers?: {[key: string]: string}
}

export type DataVolumeConfigDataSourceRegistry = {
  url?: string
}

export type DataVolumeConfigDataSourceS3 = {
  url?: string
}


/* vink modified */ export type BaseDataVolumeConfigDataSource = {
}

export type DataVolumeConfigDataSource = BaseDataVolumeConfigDataSource
  & OneOf<{ http: DataVolumeConfigDataSourceHttp; registry: DataVolumeConfigDataSourceRegistry; s3: DataVolumeConfigDataSourceS3; blank: DataVolumeConfigDataSourceBlank; upload: DataVolumeConfigDataSourceUpload }>

export type DataVolumeConfigBoundPVC = {
  storageClassName?: string
  capacity?: string
}

export type DataVolumeConfigOSFamilyCentos = {
  version?: string
}

export type DataVolumeConfigOSFamilyUbuntu = {
  version?: string
}

export type DataVolumeConfigOSFamilyDebian = {
  version?: string
}

export type DataVolumeConfigOSFamilyWindows = {
  version?: string
}


/* vink modified */ export type BaseDataVolumeConfigOSFamily = {
}

export type DataVolumeConfigOSFamily = BaseDataVolumeConfigOSFamily
  & OneOf<{ centos: DataVolumeConfigOSFamilyCentos; ubuntu: DataVolumeConfigOSFamilyUbuntu; debian: DataVolumeConfigOSFamilyDebian; windows: DataVolumeConfigOSFamilyWindows }>

export type DataVolumeConfig = {
  disk?: DataVolumeConfigDisk
  osFamily?: DataVolumeConfigOSFamily
  dataSource?: DataVolumeConfigDataSource
  boundPvc?: DataVolumeConfigBoundPVC
}

export type DataVolume = {
  namespace?: string
  name?: string
  dataVolume?: GoogleProtobufStruct.Struct
  creationTimestamp?: GoogleProtobufTimestamp.Timestamp
}

export type CreateDataVolumeRequest = {
  namespace?: string
  name?: string
  config?: DataVolumeConfig
}

export type DeleteDataVolumeRequest = {
  namespace?: string
  name?: string
}

export type DeleteDataVolumeResponse = {
}

export type ListDataVolumesRequest = {
  namespace?: string
  options?: VinkCommonCommon.ListOptions
}

export type ListDataVolumesResponse = {
  items?: DataVolume[]
  options?: VinkCommonCommon.ListOptions
}

export class DataVolumeManagement {
  static CreateDataVolume(req: CreateDataVolumeRequest, initReq?: fm.InitReq): Promise<DataVolume> {
    return fm.fetchReq<CreateDataVolumeRequest, DataVolume>(`/apis/vink.io/v1alpha1/namespaces/${req["namespace"]}/datavolumes/${req["name"]}`, {...initReq, method: "POST", body: JSON.stringify(req, fm.replacer)})
  }
  static DeleteDataVolume(req: DeleteDataVolumeRequest, initReq?: fm.InitReq): Promise<DeleteDataVolumeResponse> {
    return fm.fetchReq<DeleteDataVolumeRequest, DeleteDataVolumeResponse>(`/apis/vink.io/v1alpha1/namespaces/${req["namespace"]}/datavolumes/${req["name"]}`, {...initReq, method: "DELETE"})
  }
  static ListDataVolumes(req: ListDataVolumesRequest, initReq?: fm.InitReq): Promise<ListDataVolumesResponse> {
    return fm.fetchReq<ListDataVolumesRequest, ListDataVolumesResponse>(`/apis/vink.io/v1alpha1/namespaces/${req["namespace"]}/datavolumes?${fm.renderURLSearchParams(req, ["namespace"])}`, {...initReq, method: "GET"})
  }
}