
// GENERATED FILE -- DO NOT EDIT

export enum FeatureStatus {
  Alpha,
  Beta,
  Stable
}

export function featureStatusToString(status: FeatureStatus): string {
  switch (status) {
    case FeatureStatus.Alpha:
      return "Alpha";
    case FeatureStatus.Beta:
      return "Beta";
    case FeatureStatus.Stable:
      return "Stable";
    default:
      return "Unknown";
  }
}

export enum ResourceTypes {
  Unknown,
  DataVolume,VirtualMachineInstance,
}

export function resourceTypesToString(type: ResourceTypes): string {
  switch (type) {
    case 1:
      return "DataVolume";
    case 2:
      return "VirtualMachineInstance";
    
    default:
      return "Unknown";
  }
}

export interface Instance {
  name: string;
  description: string;
  featureStatus: FeatureStatus;
  hidden: boolean;
  deprecated: boolean;
  resources: ResourceTypes[];
}

export const instances: { [key: string]: Instance } = {
  
  IoKubevirtCdiStorageBindImmediateRequested: {
    name: "cdi.kubevirt.io/storage.bind.immediate.requested",
    description: "CDI executes binding requests immediately.",
    featureStatus: FeatureStatus.Alpha,
    hidden: true,
    deprecated: false,
    resources: [
      ResourceTypes.DataVolume,
    ]
  },
  VinkVirtualmachineBinding: {
    name: "vink.kubevm.io/virtualmachine.binding",
    description: "Indicates that this DataVolume is being used by a "+
                        "specific virtual machine.",
    featureStatus: FeatureStatus.Alpha,
    hidden: true,
    deprecated: false,
    resources: [
      ResourceTypes.DataVolume,
    ]
  },
  VinkVirtualmachineinstanceHost: {
    name: "vink.kubevm.io/virtualmachineinstance.host",
    description: "",
    featureStatus: FeatureStatus.Alpha,
    hidden: true,
    deprecated: false,
    resources: [
      ResourceTypes.VirtualMachineInstance,
    ]
  },
};

export function allResourceAnnotations(): Instance[] {
  return [
    instances.IoKubevirtCdiStorageBindImmediateRequested,instances.VinkVirtualmachineBinding,instances.VinkVirtualmachineinstanceHost,
  ];
}

export function allResourceTypes(): string[] {
  return [
    "DataVolume","VirtualMachineInstance",
  ];
}
