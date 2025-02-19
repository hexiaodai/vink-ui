
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
  DataVolume,Node,VirtualMachine,
}

export function resourceTypesToString(type: ResourceTypes): string {
  switch (type) {
    case 1:
      return "DataVolume";
    case 2:
      return "Node";
    case 3:
      return "VirtualMachine";
    
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
  VinkDisks: {
    name: "vink.kubevm.io/disks",
    description: "",
    featureStatus: FeatureStatus.Alpha,
    deprecated: false,
    resources: [
      ResourceTypes.VirtualMachine,
    ]
  },
  VinkHost: {
    name: "vink.kubevm.io/host",
    description: "Specifies the host machine where the virtual machine is "+
                        "scheduled to run.",
    featureStatus: FeatureStatus.Alpha,
    deprecated: false,
    resources: [
      ResourceTypes.VirtualMachine,
    ]
  },
  VinkMonitor: {
    name: "vink.kubevm.io/monitor",
    description: "",
    featureStatus: FeatureStatus.Alpha,
    deprecated: false,
    resources: [
      ResourceTypes.VirtualMachine,
    ]
  },
  VinkNetworks: {
    name: "vink.kubevm.io/networks",
    description: "",
    featureStatus: FeatureStatus.Alpha,
    deprecated: false,
    resources: [
      ResourceTypes.VirtualMachine,
    ]
  },
  VinkOperatingSystem: {
    name: "vink.kubevm.io/operating-system",
    description: "",
    featureStatus: FeatureStatus.Alpha,
    deprecated: false,
    resources: [
      ResourceTypes.VirtualMachine,
    ]
  },
  VinkStorage: {
    name: "vink.kubevm.io/storage",
    description: "",
    featureStatus: FeatureStatus.Alpha,
    deprecated: false,
    resources: [
      ResourceTypes.Node,
    ]
  },
};

export function allResourceAnnotations(): Instance[] {
  return [
    instances.IoKubevirtCdiStorageBindImmediateRequested,instances.VinkDatavolumeOwner,instances.VinkDisks,instances.VinkHost,instances.VinkMonitor,instances.VinkNetworks,instances.VinkOperatingSystem,instances.VinkStorage,
  ];
}

export function allResourceTypes(): string[] {
  return [
    "DataVolume","Node","VirtualMachine",
  ];
}
