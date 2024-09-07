// Copyright Istio Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// A simple program that consumes a YAML file describing Kubernetes resource annotations and produces as output
// a Go source file providing references to those annotations, and an HTML documentation file describing those
// annotations (for use on kubevm.io)

package main

import (
	"bytes"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"text/template"

	"github.com/spf13/cobra"
	"sigs.k8s.io/yaml"
)

const outputTemplateGo = `
// GENERATED FILE -- DO NOT EDIT

package {{ .Package }}

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
	{{- range .KnownTypes }}
    {{ . }}
    {{- end }}
)

func (r ResourceTypes) String() string {
	switch r {
	{{- range $i, $t := .KnownTypes }}
	case {{ add $i 1 }}:
		return "{{$t}}"
	{{- end }}
	}
	return "Unknown"
}

// Instance describes a single resource {{ .Collection.NameLowercase }}
type Instance struct {
	// The name of the {{ .Collection.NameLowercase }}.
	Name string

	// Description of the {{ .Collection.NameLowercase }}.
	Description string

	// FeatureStatus of this {{ .Collection.NameLowercase }}.
	FeatureStatus FeatureStatus

	// Hide the existence of this {{ .Collection.NameLowercase }} when outputting usage information.
	Hidden bool

	// Mark this {{ .Collection.NameLowercase }} as deprecated when generating usage information.
	Deprecated bool

	// The types of resources this {{ .Collection.NameLowercase }} applies to.
	Resources []ResourceTypes
}

var (
{{ range .Variables }}
	{{ .GoName }} = Instance {
		Name:          "{{ .Name }}",
		Description:   {{ processGoDescription .Description 24 }},
		FeatureStatus: {{ .FeatureStatus }},
		Hidden:        {{ .Hidden }},
		Deprecated:    {{ .Deprecated }},
		Resources: []ResourceTypes{
			{{- range .Resources }}
			{{ . }},
			{{- end }}
		},
	}
{{ end }}
)

func AllResource{{ .Collection.NamePlural }}() []*Instance {
	return []*Instance {
		{{- range .Variables }}
		&{{ .GoName }},
		{{- end }}
	}
}

func AllResourceTypes() []string {
	return []string {
		{{- range .KnownTypes }}
		"{{ . }}",
		{{- end }}
	}
}
`

const outputTemplateTs = `
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
  {{ range .KnownTypes }}{{ . }},{{ end }}
}

export function resourceTypesToString(type: ResourceTypes): string {
  switch (type) {
    {{ range $i, $t := .KnownTypes }}case {{ add $i 1 }}:
      return "{{ $t }}";
    {{ end }}
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
  {{ range .Variables }}
  {{ .GoName }}: {
    name: "{{ .Name }}",
    description: {{ processGoDescription .Description 24 }},
    featureStatus: FeatureStatus.{{ .FeatureStatus }},
    hidden: {{ .Hidden }},
    deprecated: {{ .Deprecated }},
    resources: [
      {{ range .Resources }}ResourceTypes.{{ . }},{{ end }}
    ]
  },{{ end }}
};

export function allResource{{ .Collection.NamePlural }}(): Instance[] {
  return [
    {{ range .Variables }}instances.{{ .GoName }},{{ end }}
  ];
}

export function allResourceTypes(): string[] {
  return [
    {{ range .KnownTypes }}"{{ . }}",{{ end }}
  ];
}
`

type FeatureStatus string

const (
	Alpha  FeatureStatus = "Alpha"
	Beta   FeatureStatus = "Beta"
	Stable FeatureStatus = "Stable"
)

// Collection represents template fields for either annotations or labels.
type Collection struct {
	Name                string
	NamePlural          string
	NameLowercase       string
	NameLowercasePlural string
	// Link is the location of the generated page on kubevm.io.
	Link string
	// ConceptLink is the link to the concept page for the collection type.
	ConceptLink string
}

var (
	annotations = Collection{
		Name:                "Annotation",
		NamePlural:          "Annotations",
		NameLowercase:       "annotation",
		NameLowercasePlural: "annotations",
		Link:                "https://github.com/kubevm-io/vink/docs/reference/config/annotations/",
		ConceptLink:         "todo",
	}

	labels = Collection{
		Name:                "Label",
		NamePlural:          "Labels",
		NameLowercase:       "label",
		NameLowercasePlural: "labels",
		Link:                "https://github.com/kubevm-io/vink/docs/reference/config/labels/",
		ConceptLink:         "todo",
	}
)

func collectionForType(typ string) (Collection, error) {
	switch typ {
	case annotations.NameLowercase:
		return annotations, nil
	case labels.NameLowercase:
		return labels, nil
	default:
		return Collection{}, fmt.Errorf("unrecognized variable_type: %s", typ)
	}
}

var (
	input          string
	outputGo       string
	outputTs       string
	collectionType string
	collection     Collection

	nameSeparator = regexp.MustCompile(`[._\-]`)

	rootCmd = cobra.Command{
		Use:   "annotations_prep",
		Short: "Generates a Go source file and HTML file containing annotations/labels.",
		Long: "Generates a Go source file and HTML file containing annotation/label definitions based " +
			"on an input YAML file.",
		Run: func(cmd *cobra.Command, args []string) {
			processFlags()
			yamlContent, err := ioutil.ReadFile(input)
			if err != nil {
				log.Fatalf("unable to read input YAML file: %v", err)
			}

			// Unmarshal the file.
			var variables []Variable
			switch collectionType {
			case annotations.NameLowercase:
				var cfg AnnotationConfiguration
				if err = yaml.Unmarshal(yamlContent, &cfg); err != nil {
					log.Fatalf("error parsing input YAML file: %v", err)
				}
				variables = cfg.Variables
			case labels.NameLowercase:
				var cfg LabelConfiguration
				if err = yaml.Unmarshal(yamlContent, &cfg); err != nil {
					log.Fatalf("error parsing input YAML file: %v", err)
				}
				variables = cfg.Variables
			default:
				log.Fatalf("invalid value for collection_type: %s", collectionType)
			}

			// Find all the known resource types
			m := make(map[string]bool)
			for _, a := range variables {
				for _, r := range a.Resources {
					m[r] = true
				}
			}
			knownTypes := make([]string, 0, len(m))
			for k := range m {
				knownTypes = append(knownTypes, k)
			}
			sort.Strings(knownTypes)

			// Process/cleanup the values read in from YAML.
			for i := range variables {
				if variables[i].Name == "" {
					log.Fatalf("variable %d in input YAML file missing name", i)
				}

				// Generate sensible defaults for values if not provided in the yaml.
				variables[i].GoName = generateVariableName(variables[i])
				variables[i].FeatureStatus = generateFeatureStatus(variables[i])
			}

			// sort by name
			sort.Slice(variables, func(i, j int) bool {
				return strings.Compare(variables[i].Name, variables[j].Name) < 0
			})

			generateTemplate := func(outputTemplate, outputFileName string) {
				// Create the output file template.
				t, err := template.New("varTemplate").Funcs(template.FuncMap{
					"processGoDescription": processGoDescription, "add": add,
				}).Parse(outputTemplate)
				if err != nil {
					log.Fatalf("failed parsing variable template: %v", err)
				}

				// Generate the Go source.
				var goSource bytes.Buffer
				if err := t.Execute(&goSource, map[string]interface{}{
					"Package":    getPackage(outputGo),
					"KnownTypes": knownTypes,
					"Variables":  variables,
					"Collection": collection,
				}); err != nil {
					log.Fatalf("failed generating output Go source code %s: %v", outputFileName, err)
				}

				if err := ioutil.WriteFile(outputFileName, goSource.Bytes(), 0o666); err != nil {
					log.Fatalf("Failed writing to output file %s: %v", outputFileName, err)
				}
			}

			generateTemplate(outputTemplateGo, outputGo)
			generateTemplate(outputTemplateTs, outputTs)
		},
	}
)

func init() {
	rootCmd.PersistentFlags().StringVar(&input, "input", "",
		"Input YAML file to be parsed.")
	rootCmd.PersistentFlags().StringVar(&outputGo, "output_go", "",
		"Output Go file to be generated.")
	rootCmd.PersistentFlags().StringVar(&outputTs, "output_ts", "",
		"Output Go file to be generated.")
	rootCmd.PersistentFlags().StringVar(&collectionType, "collection_type", annotations.NameLowercase,
		fmt.Sprintf("Output type for the generated collection. Allowed values are '%s' or '%s'.",
			annotations.NameLowercase, labels.NameLowercase))

	flag.CommandLine.VisitAll(func(gf *flag.Flag) {
		rootCmd.PersistentFlags().AddGoFlag(gf)
	})
}

func processFlags() {
	var err error
	collection, err = collectionForType(collectionType)
	if err != nil {
		log.Fatal(err)
	}
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(-1)
	}
}

type Variable struct {
	// The name of the generated golang variable.
	GoName string `json:"variableName"`

	// The name of the collection variable.
	Name string `json:"name"`

	// FeatureStatus of the collection variable.
	FeatureStatus string `json:"featureStatus"`

	// Description of the collection variable.
	Description string `json:"description"`

	// Hide the existence of this collection variable when outputting usage information.
	Hidden bool `json:"hidden"`

	// Mark this annotation as deprecated when generating usage information.
	Deprecated bool `json:"deprecated"`

	// Indicates the types of resources this collection variable can be applied to.
	Resources []string `json:"resources"`
}

type AnnotationConfiguration struct {
	Variables []Variable `json:"annotations"`
}

type LabelConfiguration struct {
	Variables []Variable `json:"labels"`
}

func getPackage(output string) string {
	path, _ := filepath.Abs(output)
	return filepath.Base(filepath.Dir(path))
}

func generateVariableName(v Variable) string {
	if len(v.GoName) > 0 {
		return v.GoName
	}

	// Split the annotation name to separate the namespace/name portions.
	parts := strings.Split(v.Name, "/")
	ns := parts[0]
	name := parts[1]

	// First, process the namespace portion ...

	// Strip .kubevm.io from the namespace portion of the annotation name.
	ns = strings.TrimSuffix(ns, ".kubevm.io")

	// Separate the words by spaces and capitalize each word.
	ns = strings.ReplaceAll(strings.ReplaceAll(ns, ".", " "), "-", " ")
	ns = strings.Title(ns) // nolint: staticcheck

	// Reverse the namespace words so that they increase in specificity from left to right.
	nsParts := strings.Split(ns, " ")
	ns = ""
	for i := len(nsParts) - 1; i >= 0; i-- {
		ns += nsParts[i]
	}

	// Now, process the name portion ...

	// Separate the words with spaces and capitalize each word.
	name = nameSeparator.ReplaceAllString(name, " ")
	name = strings.Title(name) // nolint: staticcheck

	// Remove the spaces to generate a camel case variable name.
	name = strings.ReplaceAll(name, " ", "")

	// Concatenate the names together.
	return ns + name
}

func getFeatureStatus(fs string) (FeatureStatus, error) {
	asTitle := strings.Title(fs) // nolint: staticcheck
	switch FeatureStatus(asTitle) {
	case Alpha:
		return Alpha, nil
	case Beta:
		return Beta, nil
	case Stable:
		return Stable, nil
	}
	return "", fmt.Errorf("invalid feature status string: `%s` (stings.Title=`%s`)", fs, asTitle)
}

func generateFeatureStatus(v Variable) string {
	if len(v.FeatureStatus) > 0 {
		fs, err := getFeatureStatus(v.FeatureStatus)
		if err != nil {
			log.Fatal(err)
		}
		return string(fs)
	}

	// If the name begins with the feature status, use it.
	firstPart := strings.Split(v.Name, ".")
	fs, err := getFeatureStatus(firstPart[0])
	if err == nil {
		return string(fs)
	}

	// Default to Alpha
	return string(Alpha)
}

func processHTMLDescription(in string) string {
	return strings.ReplaceAll(in, "\n", "<br>")
}

func processGoDescription(in string, indent int) string {
	if strings.Contains(in, "\n") {
		return lineWrap(in)
	}
	return wordWrap(in, indent)
}

func wordWrap(in string, indent int) string {
	// We use double quotes (") around each line, so replace any double quotes embedded
	// in the string with back ticks (`).
	in = strings.ReplaceAll(in, "\"", "`")

	indentPrefix := strings.Repeat(" ", indent)
	words := strings.Split(in, " ")

	maxLineLength := 80

	out := ""
	line := ""
	for len(words) > 0 {
		// Take the next word.
		word := words[0]
		words = words[1:]

		if indent+len(line)+len(word) > maxLineLength {
			// Need to word wrap - emit the current line.
			out += "\"" + line + " \""
			line = ""

			// Wrap to the start of the next line.
			out += "+\n" + indentPrefix
		}

		// Add the word to the current line.
		if len(line) > 0 {
			line += " "
		}
		line += word
	}

	// Emit the final line
	out += "\"" + line + "\""

	return out
}

func lineWrap(in string) string {
	// We use back tick (`) around the entire string, so replace any back ticks embedded
	// in the string with double quotes (").
	in = strings.ReplaceAll(in, "`", "\"")

	lines := strings.Split(in, "\n")
	out := "`"
	for i, line := range lines {
		out += line
		if i < len(lines)-1 {
			out += "\n"
		}
	}
	out += "`"
	return out
}

func add(x, y int) int {
	return x + y
}
