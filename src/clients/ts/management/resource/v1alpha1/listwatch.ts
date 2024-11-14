// @generated by protobuf-ts 2.9.4
// @generated from protobuf file "management/resource/v1alpha1/listwatch.proto" (package "vink.kubevm.io.apis.management.resource.v1alpha1", syntax proto3)
// tslint:disable
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
import { NamespaceName } from "../../../types/namespace_name";
import { ListOptions } from "../../../types/list_options";
import { ResourceType } from "../../../types/resource";
/**
 * @generated from protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.ListWatchRequest
 */
export interface ListWatchRequest {
    /**
     * @generated from protobuf field: vink.kubevm.io.apis.types.ResourceType resource_type = 1;
     */
    resourceType: ResourceType;
    /**
     * @generated from protobuf field: vink.kubevm.io.apis.types.ListOptions options = 2;
     */
    options?: ListOptions;
}
/**
 * @generated from protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.ListWatchResponse
 */
export interface ListWatchResponse {
    /**
     * @generated from protobuf field: vink.kubevm.io.apis.management.resource.v1alpha1.EventType event_type = 1;
     */
    eventType: EventType;
    /**
     * @generated from protobuf field: repeated string items = 2;
     */
    items: string[];
    /**
     * @generated from protobuf field: vink.kubevm.io.apis.types.NamespaceName deleted = 3;
     */
    deleted?: NamespaceName;
    /**
     * @generated from protobuf field: vink.kubevm.io.apis.types.ListOptions options = 4;
     */
    options?: ListOptions;
}
/**
 * @generated from protobuf enum vink.kubevm.io.apis.management.resource.v1alpha1.EventType
 */
export enum EventType {
    /**
     * @generated from protobuf enum value: ADDED = 0;
     */
    ADDED = 0,
    /**
     * @generated from protobuf enum value: MODIFIED = 1;
     */
    MODIFIED = 1,
    /**
     * @generated from protobuf enum value: DELETED = 2;
     */
    DELETED = 2
}
// @generated message type with reflection information, may provide speed optimized methods
class ListWatchRequest$Type extends MessageType<ListWatchRequest> {
    constructor() {
        super("vink.kubevm.io.apis.management.resource.v1alpha1.ListWatchRequest", [
            { no: 1, name: "resource_type", kind: "enum", T: () => ["vink.kubevm.io.apis.types.ResourceType", ResourceType] },
            { no: 2, name: "options", kind: "message", T: () => ListOptions }
        ]);
    }
    create(value?: PartialMessage<ListWatchRequest>): ListWatchRequest {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.resourceType = 0;
        if (value !== undefined)
            reflectionMergePartial<ListWatchRequest>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ListWatchRequest): ListWatchRequest {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* vink.kubevm.io.apis.types.ResourceType resource_type */ 1:
                    message.resourceType = reader.int32();
                    break;
                case /* vink.kubevm.io.apis.types.ListOptions options */ 2:
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
    internalBinaryWrite(message: ListWatchRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* vink.kubevm.io.apis.types.ResourceType resource_type = 1; */
        if (message.resourceType !== 0)
            writer.tag(1, WireType.Varint).int32(message.resourceType);
        /* vink.kubevm.io.apis.types.ListOptions options = 2; */
        if (message.options)
            ListOptions.internalBinaryWrite(message.options, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.ListWatchRequest
 */
export const ListWatchRequest = new ListWatchRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ListWatchResponse$Type extends MessageType<ListWatchResponse> {
    constructor() {
        super("vink.kubevm.io.apis.management.resource.v1alpha1.ListWatchResponse", [
            { no: 1, name: "event_type", kind: "enum", T: () => ["vink.kubevm.io.apis.management.resource.v1alpha1.EventType", EventType] },
            { no: 2, name: "items", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "deleted", kind: "message", T: () => NamespaceName },
            { no: 4, name: "options", kind: "message", T: () => ListOptions }
        ]);
    }
    create(value?: PartialMessage<ListWatchResponse>): ListWatchResponse {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.eventType = 0;
        message.items = [];
        if (value !== undefined)
            reflectionMergePartial<ListWatchResponse>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ListWatchResponse): ListWatchResponse {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* vink.kubevm.io.apis.management.resource.v1alpha1.EventType event_type */ 1:
                    message.eventType = reader.int32();
                    break;
                case /* repeated string items */ 2:
                    message.items.push(reader.string());
                    break;
                case /* vink.kubevm.io.apis.types.NamespaceName deleted */ 3:
                    message.deleted = NamespaceName.internalBinaryRead(reader, reader.uint32(), options, message.deleted);
                    break;
                case /* vink.kubevm.io.apis.types.ListOptions options */ 4:
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
    internalBinaryWrite(message: ListWatchResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* vink.kubevm.io.apis.management.resource.v1alpha1.EventType event_type = 1; */
        if (message.eventType !== 0)
            writer.tag(1, WireType.Varint).int32(message.eventType);
        /* repeated string items = 2; */
        for (let i = 0; i < message.items.length; i++)
            writer.tag(2, WireType.LengthDelimited).string(message.items[i]);
        /* vink.kubevm.io.apis.types.NamespaceName deleted = 3; */
        if (message.deleted)
            NamespaceName.internalBinaryWrite(message.deleted, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        /* vink.kubevm.io.apis.types.ListOptions options = 4; */
        if (message.options)
            ListOptions.internalBinaryWrite(message.options, writer.tag(4, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message vink.kubevm.io.apis.management.resource.v1alpha1.ListWatchResponse
 */
export const ListWatchResponse = new ListWatchResponse$Type();
/**
 * @generated ServiceType for protobuf service vink.kubevm.io.apis.management.resource.v1alpha1.ResourceListWatchManagement
 */
export const ResourceListWatchManagement = new ServiceType("vink.kubevm.io.apis.management.resource.v1alpha1.ResourceListWatchManagement", [
    { name: "ListWatch", serverStreaming: true, options: {}, I: ListWatchRequest, O: ListWatchResponse }
]);
