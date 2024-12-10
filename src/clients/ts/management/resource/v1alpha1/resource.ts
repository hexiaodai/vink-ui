// @generated by protobuf-ts 2.9.4
// @generated from protobuf file "management/resource/v1alpha1/resource.proto" (package "vink.kubevm.io.apis.management.resource.v1alpha1", syntax proto3)
// tslint:disable
import { Empty } from "../../../google/protobuf/empty";
import { ServiceType } from "@protobuf-ts/runtime-rpc";
import type { BinaryWriteOptions } from "@protobuf-ts/runtime";
import type { IBinaryWriter } from "@protobuf-ts/runtime";
import { WireType } from "@protobuf-ts/runtime";
import type { BinaryReadOptions } from "@protobuf-ts/runtime";
import type { IBinaryReader } from "@protobuf-ts/runtime";
import { UnknownFieldHandler } from "@protobuf-ts/runtime";
import type { PartialMessage } from "@protobuf-ts/runtime";
import { reflectionMergePartial } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
import { FieldSelectorGroup } from "../../../types/types";
import { NamespaceName } from "../../../types/types";
import { ResourceType } from "../../../types/types";
/**
 * @generated from protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.Resource
 */
export interface Resource {
    /**
     * @generated from protobuf field: string data = 1;
     */
    data: string;
}
/**
 * @generated from protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.GetRequest
 */
export interface GetRequest {
    /**
     * @generated from protobuf field: vink.kubevm.io.apis.types.ResourceType resource_type = 1;
     */
    resourceType: ResourceType;
    /**
     * @generated from protobuf field: vink.kubevm.io.apis.types.NamespaceName namespace_name = 2;
     */
    namespaceName?: NamespaceName;
}
/**
 * @generated from protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.ListRequest
 */
export interface ListRequest {
    /**
     * @generated from protobuf field: vink.kubevm.io.apis.types.ResourceType resource_type = 1;
     */
    resourceType: ResourceType;
    /**
     * @generated from protobuf field: vink.kubevm.io.apis.management.resource.v1alpha1.ListOptions options = 2;
     */
    options?: ListOptions;
}
/**
 * @generated from protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.ListResponse
 */
export interface ListResponse {
    /**
     * @generated from protobuf field: repeated string items = 1;
     */
    items: string[];
}
/**
 * @generated from protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.CreateRequest
 */
export interface CreateRequest {
    /**
     * @generated from protobuf field: vink.kubevm.io.apis.types.ResourceType resource_type = 1;
     */
    resourceType: ResourceType;
    /**
     * @generated from protobuf field: string data = 2;
     */
    data: string;
}
/**
 * @generated from protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.UpdateRequest
 */
export interface UpdateRequest {
    /**
     * @generated from protobuf field: vink.kubevm.io.apis.types.ResourceType resource_type = 1;
     */
    resourceType: ResourceType;
    /**
     * @generated from protobuf field: string data = 2;
     */
    data: string;
}
/**
 * @generated from protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.DeleteRequest
 */
export interface DeleteRequest {
    /**
     * @generated from protobuf field: vink.kubevm.io.apis.types.ResourceType resource_type = 1;
     */
    resourceType: ResourceType;
    /**
     * @generated from protobuf field: vink.kubevm.io.apis.types.NamespaceName namespace_name = 2;
     */
    namespaceName?: NamespaceName;
}
/**
 * @generated from protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.ListOptions
 */
export interface ListOptions {
    /**
     * @generated from protobuf field: string label_selector = 1;
     */
    labelSelector: string;
    /**
     * @generated from protobuf field: string field_selector = 2;
     */
    fieldSelector: string;
    /**
     * repeated string arbitrary_field_selectors = 3;
     *
     * @generated from protobuf field: vink.kubevm.io.apis.types.FieldSelectorGroup field_selector_group = 3;
     */
    fieldSelectorGroup?: FieldSelectorGroup;
    /**
     * @generated from protobuf field: int32 limit = 4;
     */
    limit: number;
    /**
     * @generated from protobuf field: string continue = 5;
     */
    continue: string;
    /**
     * @generated from protobuf field: string namespace = 6;
     */
    namespace: string;
}
// @generated message type with reflection information, may provide speed optimized methods
class Resource$Type extends MessageType<Resource> {
    constructor() {
        super("vink.kubevm.io.apis.management.resource.v1alpha1.Resource", [
            { no: 1, name: "data", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<Resource>): Resource {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.data = "";
        if (value !== undefined)
            reflectionMergePartial<Resource>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: Resource): Resource {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string data */ 1:
                    message.data = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: Resource, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string data = 1; */
        if (message.data !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.data);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.Resource
 */
export const Resource = new Resource$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetRequest$Type extends MessageType<GetRequest> {
    constructor() {
        super("vink.kubevm.io.apis.management.resource.v1alpha1.GetRequest", [
            { no: 1, name: "resource_type", kind: "enum", T: () => ["vink.kubevm.io.apis.types.ResourceType", ResourceType] },
            { no: 2, name: "namespace_name", kind: "message", T: () => NamespaceName }
        ]);
    }
    create(value?: PartialMessage<GetRequest>): GetRequest {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.resourceType = 0;
        if (value !== undefined)
            reflectionMergePartial<GetRequest>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: GetRequest): GetRequest {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* vink.kubevm.io.apis.types.ResourceType resource_type */ 1:
                    message.resourceType = reader.int32();
                    break;
                case /* vink.kubevm.io.apis.types.NamespaceName namespace_name */ 2:
                    message.namespaceName = NamespaceName.internalBinaryRead(reader, reader.uint32(), options, message.namespaceName);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: GetRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* vink.kubevm.io.apis.types.ResourceType resource_type = 1; */
        if (message.resourceType !== 0)
            writer.tag(1, WireType.Varint).int32(message.resourceType);
        /* vink.kubevm.io.apis.types.NamespaceName namespace_name = 2; */
        if (message.namespaceName)
            NamespaceName.internalBinaryWrite(message.namespaceName, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.GetRequest
 */
export const GetRequest = new GetRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ListRequest$Type extends MessageType<ListRequest> {
    constructor() {
        super("vink.kubevm.io.apis.management.resource.v1alpha1.ListRequest", [
            { no: 1, name: "resource_type", kind: "enum", T: () => ["vink.kubevm.io.apis.types.ResourceType", ResourceType] },
            { no: 2, name: "options", kind: "message", T: () => ListOptions }
        ]);
    }
    create(value?: PartialMessage<ListRequest>): ListRequest {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.resourceType = 0;
        if (value !== undefined)
            reflectionMergePartial<ListRequest>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ListRequest): ListRequest {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* vink.kubevm.io.apis.types.ResourceType resource_type */ 1:
                    message.resourceType = reader.int32();
                    break;
                case /* vink.kubevm.io.apis.management.resource.v1alpha1.ListOptions options */ 2:
                    message.options = ListOptions.internalBinaryRead(reader, reader.uint32(), options, message.options);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: ListRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* vink.kubevm.io.apis.types.ResourceType resource_type = 1; */
        if (message.resourceType !== 0)
            writer.tag(1, WireType.Varint).int32(message.resourceType);
        /* vink.kubevm.io.apis.management.resource.v1alpha1.ListOptions options = 2; */
        if (message.options)
            ListOptions.internalBinaryWrite(message.options, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.ListRequest
 */
export const ListRequest = new ListRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ListResponse$Type extends MessageType<ListResponse> {
    constructor() {
        super("vink.kubevm.io.apis.management.resource.v1alpha1.ListResponse", [
            { no: 1, name: "items", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<ListResponse>): ListResponse {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.items = [];
        if (value !== undefined)
            reflectionMergePartial<ListResponse>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ListResponse): ListResponse {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* repeated string items */ 1:
                    message.items.push(reader.string());
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: ListResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* repeated string items = 1; */
        for (let i = 0; i < message.items.length; i++)
            writer.tag(1, WireType.LengthDelimited).string(message.items[i]);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.ListResponse
 */
export const ListResponse = new ListResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class CreateRequest$Type extends MessageType<CreateRequest> {
    constructor() {
        super("vink.kubevm.io.apis.management.resource.v1alpha1.CreateRequest", [
            { no: 1, name: "resource_type", kind: "enum", T: () => ["vink.kubevm.io.apis.types.ResourceType", ResourceType] },
            { no: 2, name: "data", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<CreateRequest>): CreateRequest {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.resourceType = 0;
        message.data = "";
        if (value !== undefined)
            reflectionMergePartial<CreateRequest>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: CreateRequest): CreateRequest {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* vink.kubevm.io.apis.types.ResourceType resource_type */ 1:
                    message.resourceType = reader.int32();
                    break;
                case /* string data */ 2:
                    message.data = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: CreateRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* vink.kubevm.io.apis.types.ResourceType resource_type = 1; */
        if (message.resourceType !== 0)
            writer.tag(1, WireType.Varint).int32(message.resourceType);
        /* string data = 2; */
        if (message.data !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.data);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.CreateRequest
 */
export const CreateRequest = new CreateRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class UpdateRequest$Type extends MessageType<UpdateRequest> {
    constructor() {
        super("vink.kubevm.io.apis.management.resource.v1alpha1.UpdateRequest", [
            { no: 1, name: "resource_type", kind: "enum", T: () => ["vink.kubevm.io.apis.types.ResourceType", ResourceType] },
            { no: 2, name: "data", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<UpdateRequest>): UpdateRequest {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.resourceType = 0;
        message.data = "";
        if (value !== undefined)
            reflectionMergePartial<UpdateRequest>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: UpdateRequest): UpdateRequest {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* vink.kubevm.io.apis.types.ResourceType resource_type */ 1:
                    message.resourceType = reader.int32();
                    break;
                case /* string data */ 2:
                    message.data = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: UpdateRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* vink.kubevm.io.apis.types.ResourceType resource_type = 1; */
        if (message.resourceType !== 0)
            writer.tag(1, WireType.Varint).int32(message.resourceType);
        /* string data = 2; */
        if (message.data !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.data);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.UpdateRequest
 */
export const UpdateRequest = new UpdateRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DeleteRequest$Type extends MessageType<DeleteRequest> {
    constructor() {
        super("vink.kubevm.io.apis.management.resource.v1alpha1.DeleteRequest", [
            { no: 1, name: "resource_type", kind: "enum", T: () => ["vink.kubevm.io.apis.types.ResourceType", ResourceType] },
            { no: 2, name: "namespace_name", kind: "message", T: () => NamespaceName }
        ]);
    }
    create(value?: PartialMessage<DeleteRequest>): DeleteRequest {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.resourceType = 0;
        if (value !== undefined)
            reflectionMergePartial<DeleteRequest>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: DeleteRequest): DeleteRequest {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* vink.kubevm.io.apis.types.ResourceType resource_type */ 1:
                    message.resourceType = reader.int32();
                    break;
                case /* vink.kubevm.io.apis.types.NamespaceName namespace_name */ 2:
                    message.namespaceName = NamespaceName.internalBinaryRead(reader, reader.uint32(), options, message.namespaceName);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: DeleteRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* vink.kubevm.io.apis.types.ResourceType resource_type = 1; */
        if (message.resourceType !== 0)
            writer.tag(1, WireType.Varint).int32(message.resourceType);
        /* vink.kubevm.io.apis.types.NamespaceName namespace_name = 2; */
        if (message.namespaceName)
            NamespaceName.internalBinaryWrite(message.namespaceName, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.DeleteRequest
 */
export const DeleteRequest = new DeleteRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ListOptions$Type extends MessageType<ListOptions> {
    constructor() {
        super("vink.kubevm.io.apis.management.resource.v1alpha1.ListOptions", [
            { no: 1, name: "label_selector", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "field_selector", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "field_selector_group", kind: "message", T: () => FieldSelectorGroup },
            { no: 4, name: "limit", kind: "scalar", T: 5 /*ScalarType.INT32*/, options: { "validate.rules": { int32: { gte: 0 } } } },
            { no: 5, name: "continue", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 6, name: "namespace", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<ListOptions>): ListOptions {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.labelSelector = "";
        message.fieldSelector = "";
        message.limit = 0;
        message.continue = "";
        message.namespace = "";
        if (value !== undefined)
            reflectionMergePartial<ListOptions>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ListOptions): ListOptions {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string label_selector */ 1:
                    message.labelSelector = reader.string();
                    break;
                case /* string field_selector */ 2:
                    message.fieldSelector = reader.string();
                    break;
                case /* vink.kubevm.io.apis.types.FieldSelectorGroup field_selector_group */ 3:
                    message.fieldSelectorGroup = FieldSelectorGroup.internalBinaryRead(reader, reader.uint32(), options, message.fieldSelectorGroup);
                    break;
                case /* int32 limit */ 4:
                    message.limit = reader.int32();
                    break;
                case /* string continue */ 5:
                    message.continue = reader.string();
                    break;
                case /* string namespace */ 6:
                    message.namespace = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: ListOptions, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string label_selector = 1; */
        if (message.labelSelector !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.labelSelector);
        /* string field_selector = 2; */
        if (message.fieldSelector !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.fieldSelector);
        /* vink.kubevm.io.apis.types.FieldSelectorGroup field_selector_group = 3; */
        if (message.fieldSelectorGroup)
            FieldSelectorGroup.internalBinaryWrite(message.fieldSelectorGroup, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        /* int32 limit = 4; */
        if (message.limit !== 0)
            writer.tag(4, WireType.Varint).int32(message.limit);
        /* string continue = 5; */
        if (message.continue !== "")
            writer.tag(5, WireType.LengthDelimited).string(message.continue);
        /* string namespace = 6; */
        if (message.namespace !== "")
            writer.tag(6, WireType.LengthDelimited).string(message.namespace);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.ListOptions
 */
export const ListOptions = new ListOptions$Type();
/**
 * @generated ServiceType for protobuf service vink.kubevm.io.apis.management.resource.v1alpha1.ResourceManagement
 */
export const ResourceManagement = new ServiceType("vink.kubevm.io.apis.management.resource.v1alpha1.ResourceManagement", [
    { name: "Get", options: {}, I: GetRequest, O: Resource },
    { name: "List", options: {}, I: ListRequest, O: ListResponse },
    { name: "Create", options: {}, I: CreateRequest, O: Resource },
    { name: "Update", options: {}, I: UpdateRequest, O: Resource },
    { name: "Delete", options: {}, I: DeleteRequest, O: Empty }
]);
