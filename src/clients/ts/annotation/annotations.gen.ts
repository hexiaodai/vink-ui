
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
  deprecated: boolean;
  resources: ResourceTypes[];
}

export const instances: { [key: string]: Instance } = {
  
  IoKubevirtCdiStorageBindImmediateRequested: {
    name: "cdi.kubevirt.io/storage.bind.immediate.requested",
    description: "CDI executes binding requests immediately.",
    featureStatus: FeatureStatus.Alpha,
    deprecated: false,
    resources: [
      ResourceTypes.DataVolume,
    ]
  },
  VinkDatavolumeOwner: {
    name: "vink.kubevm.io/datavolume.owner",
    description: "Indicates that this DataVolume is being used by a "+
                        "specific virtual machine.",
    featureStatus: FeatureStatus.Alpha,
    deprecated: false,
    resources: [
      ResourceTypes.DataVolume,
    ]
  },
  VinkHost: {
    name: "vink.kubevm.io/host",
    description: "Specifies the host machine where the virtual machine "+
                        "instance is scheduled to run.",
    featureStatus: FeatureStatus.Alpha,
    deprecated: false,
    resources: [
      ResourceTypes.VirtualMachineInstance,
    ]
  },
};

export function allResourceAnnotations(): Instance[] {
  return [
    instances.IoKubevirtCdiStorageBindImmediateRequested,instances.VinkDatavolumeOwner,instances.VinkHost,
  ];
}

export function allResourceTypes(): string[] {
  return [
    "DataVolume","VirtualMachineInstance",
  ];
}
