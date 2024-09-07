
// GENERATED FILE -- DO NOT EDIT

package label

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
)

func (r ResourceTypes) String() string {
	switch r {
	case 1:
		return "DataVolume"
	}
	return "Unknown"
}

// Instance describes a single resource label
type Instance struct {
	// The name of the label.
	Name string

	// Description of the label.
	Description string

	// FeatureStatus of this label.
	FeatureStatus FeatureStatus

	// Hide the existence of this label when outputting usage information.
	Hidden bool

	// Mark this label as deprecated when generating usage information.
	Deprecated bool

	// The types of resources this label applies to.
	Resources []ResourceTypes
}

var (

	VinkDatavolumeType = Instance {
		Name:          "vink.kubevm.io/datavolume.type",
		Description:   "Defines the type of datavolume, such as root for the "+
                        "system datavolume, image for the system image, and data "+
                        "for the data datavolume.",
		FeatureStatus: Alpha,
		Hidden:        true,
		Deprecated:    false,
		Resources: []ResourceTypes{
			DataVolume,
		},
	}

	VinkVirtualmachineOs = Instance {
		Name:          "vink.kubevm.io/virtualmachine.os",
		Description:   "Defines the operating system of the virtual machine, "+
                        "where 'windows' represents the Windows operating system, "+
                        "and 'linux' represents the Linux operating system.",
		FeatureStatus: Alpha,
		Hidden:        true,
		Deprecated:    false,
		Resources: []ResourceTypes{
			DataVolume,
		},
	}

	VinkVirtualmachineVersion = Instance {
		Name:          "vink.kubevm.io/virtualmachine.version",
		Description:   "Defines the operating system version of the virtual "+
                        "machine.",
		FeatureStatus: Alpha,
		Hidden:        true,
		Deprecated:    false,
		Resources: []ResourceTypes{
			DataVolume,
		},
	}

)

func AllResourceLabels() []*Instance {
	return []*Instance {
		&VinkDatavolumeType,
		&VinkVirtualmachineOs,
		&VinkVirtualmachineVersion,
	}
}

func AllResourceTypes() []string {
	return []string {
		"DataVolume",
	}
}
