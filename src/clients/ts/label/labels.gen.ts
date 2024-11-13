
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
  DataVolume,
}

export function resourceTypesToString(type: ResourceTypes): string {
  switch (type) {
    case 1:
      return "DataVolume";
    
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
  
  VinkDatavolumeType: {
    name: "vink.kubevm.io/datavolume.type",
    description: "Defines the type of datavolume, such as root for the "+
                        "system datavolume, image for the system image, and data "+
                        "for the data datavolume.",
    featureStatus: FeatureStatus.Alpha,
    hidden: true,
    deprecated: false,
    resources: [
      ResourceTypes.DataVolume,
    ]
  },
  VinkVirtualmachineOs: {
    name: "vink.kubevm.io/virtualmachine.os",
    description: "Defines the operating system of the virtual machine, "+
                        "where 'windows' represents the Windows operating system, "+
                        "and 'linux' represents the Linux operating system.",
    featureStatus: FeatureStatus.Alpha,
    hidden: true,
    deprecated: false,
    resources: [
      ResourceTypes.DataVolume,
    ]
  },
  VinkVirtualmachineVersion: {
    name: "vink.kubevm.io/virtualmachine.version",
    description: "Defines the operating system version of the virtual "+
                        "machine.",
    featureStatus: FeatureStatus.Alpha,
    hidden: true,
    deprecated: false,
    resources: [
      ResourceTypes.DataVolume,
    ]
  },
};

export function allResourceLabels(): Instance[] {
  return [
    instances.VinkDatavolumeType,instances.VinkVirtualmachineOs,instances.VinkVirtualmachineVersion,
  ];
}

export function allResourceTypes(): string[] {
  return [
    "DataVolume",
  ];
}
