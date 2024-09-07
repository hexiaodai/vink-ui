# This is a wrapper to set common variables
#
# All make targets related to common variables are defined in this file.

# ====================================================================================================
# Configure Make itself:
# ====================================================================================================

# Turn off .INTERMEDIATE file removal by marking all files as
# .SECONDARY.  .INTERMEDIATE file removal is a space-saving hack from
# a time when drives were small; on modern computers with plenty of
# storage, it causes nothing but headaches.
#
# https://news.ycombinator.com/item?id=16486331
.SECONDARY:

# SHELL:=/bin/bash
SHELL:=/bin/bash -o pipefail
# SHELL:=/bin/bash -o pipefail -x

# Define a default value for SEDI if it's not already set.
ifeq ($(shell uname),Darwin)
SEDI=sed -i ""
else
SEDI=sed -i
endif

# ====================================================================================================
# ROOT Options:
# ====================================================================================================

# Set Root Directory Path
ifeq ($(origin ROOT_DIR),undefined)
ROOT_DIR := $(abspath $(shell pwd -P))
endif

# ====================================================================================================
# ENV Options:
# ====================================================================================================
# Version is the tag to use for build and push image targets.
VERSION ?= $(shell git describe --tags --abbrev=8)
ifeq ($(VERSION),)
VERSION = 0.0.0-$(shell git rev-parse --short=8 HEAD)
endif

NPM_TOKEN ?=

.PHONY: help
help: ## Show this help info.
	@$(LOG_TARGET)
	@echo -e "Virtual Machines in Kubernetes\n"
	@echo -e "Usage:\n  make \033[36m<Target>\033[0m \033[36m<Option>\033[0m\n\nTargets:"
	@awk 'BEGIN {FS = ":.*##"; printf ""} /^[a-zA-Z_0-9\.-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

# ====================================================================================================
# Includes:
# ====================================================================================================
include tools/make/grpc.mk
include tools/make/label_annotation.mk

# Log the running target
LOG_TARGET = echo -e "\033[0;32m===========> Running $@ ... \033[0m"

# Log debugging info
define log
echo -e "\033[36m===========>$1\033[0m"
endef

define errorlog
echo -e "\033[0;31m===========>$1\033[0m"
endef
