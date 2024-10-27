
// GENERATED FILE -- DO NOT EDIT

package annotation

type FeatureStatus int

const (
	Alpha FeatureStatus = iota
	Beta
	Stable
)

func (s FeatureStatus) String() string {
	switch s {
	case Alpha:
		return "Alpha"
	case Beta:
		return "Beta"
	case Stable:
		return "Stable"
	}
	return "Unknown"
}

type ResourceTypes int

const (
	Unknown ResourceTypes = iota
    DataVolume
    VirtualMachineInstance
)

func (r ResourceTypes) String() string {
	switch r {
	case 1:
		return "DataVolume"
	case 2:
		return "VirtualMachineInstance"
	}
	return "Unknown"
}

// Instance describes a single resource annotation
type Instance struct {
	// The name of the annotation.
	Name string

	// Description of the annotation.
	Description string

	// FeatureStatus of this annotation.
	FeatureStatus FeatureStatus

	// Hide the existence of this annotation when outputting usage information.
	Hidden bool

	// Mark this annotation as deprecated when generating usage information.
	Deprecated bool

	// The types of resources this annotation applies to.
	Resources []ResourceTypes
}

var (

	IoKubevirtCdiStorageBindImmediateRequested = Instance {
		Name:          "cdi.kubevirt.io/storage.bind.immediate.requested",
		Description:   "CDI executes binding requests immediately.",
		FeatureStatus: Alpha,
		Hidden:        true,
		Deprecated:    false,
		Resources: []ResourceTypes{
			DataVolume,
		},
	}

	VinkVirtualmachineBinding = Instance {
		Name:          "vink.kubevm.io/virtualmachine.binding",
		Description:   "Indicates that this DataVolume is being used by a "+
                        "specific virtual machine.",
		FeatureStatus: Alpha,
		Hidden:        true,
		Deprecated:    false,
		Resources: []ResourceTypes{
			DataVolume,
		},
	}

	VinkVirtualmachineinstanceHost = Instance {
		Name:          "vink.kubevm.io/virtualmachineinstance.host",
		Description:   "",
		FeatureStatus: Alpha,
		Hidden:        true,
		Deprecated:    false,
		Resources: []ResourceTypes{
			VirtualMachineInstance,
		},
	}

)

func AllResourceAnnotations() []*Instance {
	return []*Instance {
		&IoKubevirtCdiStorageBindImmediateRequested,
		&VinkVirtualmachineBinding,
		&VinkVirtualmachineinstanceHost,
	}
}

func AllResourceTypes() []string {
	return []string {
		"DataVolume",
		"VirtualMachineInstance",
	}
}
