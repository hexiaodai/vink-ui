.PHONY: label.generate
label.generate: ## Generate label.gen.go and label.gen.ts
	@go run $(ROOT_DIR)/tools/annotations_prep/main.go \
	--input $(ROOT_DIR)/label/labels.yaml \
	--output_go $(ROOT_DIR)/label/labels.gen.go \
	--output_ts $(ROOT_DIR)/sdks/ts/label/labels.gen.ts \
	--collection_type label

.PHONY: annotation.generate
annotation.generate: ## Generate annotation.gen.go and annotation.gen.ts
	@go run $(ROOT_DIR)/tools/annotations_prep/main.go \
	--input $(ROOT_DIR)/annotation/annotations.yaml \
	--output_go $(ROOT_DIR)/annotation/annotations.gen.go \
	--output_ts $(ROOT_DIR)/sdks/ts/annotation/annotations.gen.ts \
	--collection_type annotation

.PHONY: label_annotation.generate
label_annotation.generate:
label_annotation.generate: label.generate annotation.generate
