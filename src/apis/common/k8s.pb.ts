/* eslint-disable */
// @ts-nocheck
/*
* This file is a generated Typescript file for GRPC Gateway, DO NOT MODIFY
*/

export enum KubeVolumeVolumeType {
  VOLUME_TYPE_UNSPECIFIED = "VOLUME_TYPE_UNSPECIFIED",
  PERSISTENT_VOLUME_CLAIM = "PERSISTENT_VOLUME_CLAIM",
  DATASET = "DATASET",
}

export type Resources = {
  requests?: {[key: string]: string}
  limits?: {[key: string]: string}
}

export type KubeEnv = {
  name?: string
  value?: string
}

export type KubeVolume = {
  type?: KubeVolumeVolumeType
  name?: string
  mountPath?: string
  readOnly?: boolean
}

export type PodConfig = {
  kubeEnvs?: KubeEnv[]
  kubeVolumes?: KubeVolume[]
  resources?: Resources
  affinity?: Affinity
  schedulerName?: string
  priorityClass?: string
  queue?: string
  tolerationSeconds?: string
}

export type Affinity = {
  nodeAffinity?: NodeAffinity
  podAffinity?: PodAffinity
  podAntiAffinity?: PodAntiAffinity
}

export type PodAntiAffinity = {
  requiredDuringSchedulingIgnoredDuringExecution?: PodAffinityTerm[]
  preferredDuringSchedulingIgnoredDuringExecution?: WeightedPodAffinityTerm[]
}

export type PodAffinityTerm = {
  labelSelector?: LabelSelector
  namespaces?: string[]
  topologyKey?: string
  namespaceSelector?: LabelSelector
}

export type LabelSelector = {
  matchLabels?: {[key: string]: string}
  matchExpressions?: LabelSelectorRequirement[]
}

export type WeightedPodAffinityTerm = {
  weight?: number
  podAffinityTerm?: PodAffinityTerm
}

export type PodAffinity = {
  requiredDuringSchedulingIgnoredDuringExecution?: PodAffinityTerm[]
  preferredDuringSchedulingIgnoredDuringExecution?: WeightedPodAffinityTerm[]
}

export type NodeAffinity = {
  requiredDuringSchedulingIgnoredDuringExecution?: NodeSelector
  preferredDuringSchedulingIgnoredDuringExecution?: PreferredSchedulingTerm[]
}

export type NodeSelector = {
  nodeSelectorTerms?: NodeSelectorTerm[]
}

export type PreferredSchedulingTerm = {
  weight?: number
  preference?: NodeSelectorTerm
}

export type NodeSelectorTerm = {
  matchExpressions?: NodeSelectorRequirement[]
  matchFields?: NodeSelectorRequirement[]
}

export type NodeSelectorRequirement = {
  key?: string
  operator?: string
  values?: string[]
}

export type LabelSelectorRequirement = {
  key?: string
  operator?: string
  values?: string[]
}