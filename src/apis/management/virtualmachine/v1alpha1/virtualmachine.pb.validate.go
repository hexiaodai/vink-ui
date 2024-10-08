// Code generated by protoc-gen-validate. DO NOT EDIT.
// source: management/virtualmachine/v1alpha1/virtualmachine.proto

package v1alpha1

import (
	"bytes"
	"errors"
	"fmt"
	"net"
	"net/mail"
	"net/url"
	"regexp"
	"sort"
	"strings"
	"time"
	"unicode/utf8"

	"google.golang.org/protobuf/types/known/anypb"
)

// ensure the imports are used
var (
	_ = bytes.MinRead
	_ = errors.New("")
	_ = fmt.Print
	_ = utf8.UTFMax
	_ = (*regexp.Regexp)(nil)
	_ = (*strings.Reader)(nil)
	_ = net.IPv4len
	_ = time.Duration(0)
	_ = (*url.URL)(nil)
	_ = (*mail.Address)(nil)
	_ = anypb.Any{}
	_ = sort.Sort
)

// Validate checks the field values on VirtualMachinePowerStateRequest with the
// rules defined in the proto definition for this message. If any rules are
// violated, the first error encountered is returned, or nil if there are no violations.
func (m *VirtualMachinePowerStateRequest) Validate() error {
	return m.validate(false)
}

// ValidateAll checks the field values on VirtualMachinePowerStateRequest with
// the rules defined in the proto definition for this message. If any rules
// are violated, the result is a list of violation errors wrapped in
// VirtualMachinePowerStateRequestMultiError, or nil if none found.
func (m *VirtualMachinePowerStateRequest) ValidateAll() error {
	return m.validate(true)
}

func (m *VirtualMachinePowerStateRequest) validate(all bool) error {
	if m == nil {
		return nil
	}

	var errors []error

	if all {
		switch v := interface{}(m.GetNamespaceName()).(type) {
		case interface{ ValidateAll() error }:
			if err := v.ValidateAll(); err != nil {
				errors = append(errors, VirtualMachinePowerStateRequestValidationError{
					field:  "NamespaceName",
					reason: "embedded message failed validation",
					cause:  err,
				})
			}
		case interface{ Validate() error }:
			if err := v.Validate(); err != nil {
				errors = append(errors, VirtualMachinePowerStateRequestValidationError{
					field:  "NamespaceName",
					reason: "embedded message failed validation",
					cause:  err,
				})
			}
		}
	} else if v, ok := interface{}(m.GetNamespaceName()).(interface{ Validate() error }); ok {
		if err := v.Validate(); err != nil {
			return VirtualMachinePowerStateRequestValidationError{
				field:  "NamespaceName",
				reason: "embedded message failed validation",
				cause:  err,
			}
		}
	}

	// no validation rules for PowerState

	if len(errors) > 0 {
		return VirtualMachinePowerStateRequestMultiError(errors)
	}

	return nil
}

// VirtualMachinePowerStateRequestMultiError is an error wrapping multiple
// validation errors returned by VirtualMachinePowerStateRequest.ValidateAll()
// if the designated constraints aren't met.
type VirtualMachinePowerStateRequestMultiError []error

// Error returns a concatenation of all the error messages it wraps.
func (m VirtualMachinePowerStateRequestMultiError) Error() string {
	var msgs []string
	for _, err := range m {
		msgs = append(msgs, err.Error())
	}
	return strings.Join(msgs, "; ")
}

// AllErrors returns a list of validation violation errors.
func (m VirtualMachinePowerStateRequestMultiError) AllErrors() []error { return m }

// VirtualMachinePowerStateRequestValidationError is the validation error
// returned by VirtualMachinePowerStateRequest.Validate if the designated
// constraints aren't met.
type VirtualMachinePowerStateRequestValidationError struct {
	field  string
	reason string
	cause  error
	key    bool
}

// Field function returns field value.
func (e VirtualMachinePowerStateRequestValidationError) Field() string { return e.field }

// Reason function returns reason value.
func (e VirtualMachinePowerStateRequestValidationError) Reason() string { return e.reason }

// Cause function returns cause value.
func (e VirtualMachinePowerStateRequestValidationError) Cause() error { return e.cause }

// Key function returns key value.
func (e VirtualMachinePowerStateRequestValidationError) Key() bool { return e.key }

// ErrorName returns error name.
func (e VirtualMachinePowerStateRequestValidationError) ErrorName() string {
	return "VirtualMachinePowerStateRequestValidationError"
}

// Error satisfies the builtin error interface
func (e VirtualMachinePowerStateRequestValidationError) Error() string {
	cause := ""
	if e.cause != nil {
		cause = fmt.Sprintf(" | caused by: %v", e.cause)
	}

	key := ""
	if e.key {
		key = "key for "
	}

	return fmt.Sprintf(
		"invalid %sVirtualMachinePowerStateRequest.%s: %s%s",
		key,
		e.field,
		e.reason,
		cause)
}

var _ error = VirtualMachinePowerStateRequestValidationError{}

var _ interface {
	Field() string
	Reason() string
	Key() bool
	Cause() error
	ErrorName() string
} = VirtualMachinePowerStateRequestValidationError{}
