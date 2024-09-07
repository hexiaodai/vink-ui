
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
)

func (r ResourceTypes) String() string {
	switch r {
	case 1:
		return "DataVolume"
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

)

func AllResourceAnnotations() []*Instance {
	return []*Instance {
		&IoKubevirtCdiStorageBindImmediateRequested,
	}
}

func AllResourceTypes() []string {
	return []string {
		"DataVolume",
	}
}
