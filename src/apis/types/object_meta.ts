// @generated by protobuf-ts 2.9.4
// @generated from protobuf file "types/object_meta.proto" (package "vink.kubevm.io.apis.types", syntax proto3)
// tslint:disable
import type { BinaryWriteOptions } from "@protobuf-ts/runtime";
import type { IBinaryWriter } from "@protobuf-ts/runtime";
import { WireType } from "@protobuf-ts/runtime";
import type { BinaryReadOptions } from "@protobuf-ts/runtime";
import type { IBinaryReader } from "@protobuf-ts/runtime";
import { UnknownFieldHandler } from "@protobuf-ts/runtime";
import type { PartialMessage } from "@protobuf-ts/runtime";
import { reflectionMergePartial } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
/**
 * OwnerReference contains enough information to let you identify an owning
 * object. An owning object must be in the same namespace as the dependent, or
 * be cluster-scoped, so there is no namespace field.
 *
 * @generated from protobuf message vink.kubevm.io.apis.types.OwnerReference
 */
export interface OwnerReference {
    /**
     * API version of the referent.
     *
     * @generated from protobuf field: string apiVersion = 1;
     */
    apiVersion: string;
    /**
     * Kind of the referent.
     * More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds
     *
     * @generated from protobuf field: string kind = 2;
     */
    kind: string;
    /**
     * Name of the referent.
     * More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#names
     *
     * @generated from protobuf field: string name = 3;
     */
    name: string;
    /**
     * UID of the referent.
     * More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names#uids
     *
     * @generated from protobuf field: string uid = 4;
     */
    uid: string;
    /**
     * If true, this reference points to the managing controller.
     * +optional
     *
     * @generated from protobuf field: bool controller = 5;
     */
    controller: boolean;
    /**
     * If true, AND if the owner has the "foregroundDeletion" finalizer, then
     * the owner cannot be deleted from the key-value store until this
     * reference is removed.
     * See https://kubernetes.io/docs/concepts/architecture/garbage-collection/#foreground-deletion
     * for how the garbage collector interacts with this field and enforces the foreground deletion.
     * Defaults to false.
     * To set this field, a user needs "delete" permission of the owner,
     * otherwise 422 (Unprocessable Entity) will be returned.
     * +optional
     *
     * @generated from protobuf field: bool blockOwnerDeletion = 6;
     */
    blockOwnerDeletion: boolean;
}
/**
 * ObjectMeta is metadata that all persisted resources must have, which includes
 * all objects users must create.
 *
 * @generated from protobuf message vink.kubevm.io.apis.types.ObjectMeta
 */
export interface ObjectMeta {
    /**
     * Name must be unique within a namespace. Is required when creating
     * resources, although some resources may allow a client to request the
     * generation of an appropriate name automatically. Name is primarily intended
     * for creation idempotence and configuration definition. Cannot be updated.
     * More info: http://kubernetes.io/docs/user-guide/identifiers#names
     * +optional
     *
     * @generated from protobuf field: string name = 1;
     */
    name: string;
    /**
     * GenerateName is an optional prefix, used by the server, to generate a unique
     * name ONLY IF the Name field has not been provided.
     * If this field is used, the name returned to the client will be different
     * than the name passed. This value will also be combined with a unique suffix.
     * The provided value has the same validation rules as the Name field,
     * and may be truncated by the length of the suffix required to make the value
     * unique on the server.
     *
     * If this field is specified and the generated name exists, the server will return a 409.
     *
     * Applied only if Name is not specified.
     * More info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#idempotency
     * +optional
     *
     * @generated from protobuf field: string generateName = 2;
     */
    generateName: string;
    /**
     * Namespace defines the space within each name must be unique. An empty
     * namespace is equivalent to the "default" namespace, but "default" is the
     * canonical representation. Not all objects are required to be scoped to a
     * namespace - the value of this field for those objects will be empty.
     *
     * Must be a DNS_LABEL.
     * Cannot be updated.
     * More info: http://kubernetes.io/docs/user-guide/namespaces
     * +optional
     *
     * @generated from protobuf field: string namespace = 3;
     */
    namespace: string;
    /**
     * Deprecated: selfLink is a legacy read-only field that is no longer populated by the system.
     * +optional
     *
     * @generated from protobuf field: string selfLink = 4;
     */
    selfLink: string;
    /**
     * UID is the unique in time and space value for this object. It is typically
     * generated by the server on successful creation of a resource and is not
     * allowed to change on PUT operations.
     *
     * Populated by the system.
     * Read-only.
     * More info: http://kubernetes.io/docs/user-guide/identifiers#uids
     * +optional
     *
     * @generated from protobuf field: string uid = 5;
     */
    uid: string;
    /**
     * An opaque value that represents the internal version of this object that
     * can be used by clients to determine when objects have changed. May be used
     * for optimistic concurrency, change detection, and the watch operation on a
     * resource or set of resources. Clients must treat these values as opaque and
     * passed unmodified back to the server. They may only be valid for a
     * particular resource or set of resources.
     *
     * Populated by the system.
     * Read-only.
     * Value must be treated as opaque by clients and .
     * More info:
     * https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#concurrency-control-and-consistency
     *
     * @generated from protobuf field: string resourceVersion = 6;
     */
    resourceVersion: string;
    /**
     * A sequence number representing a specific generation of the desired state.
     * Populated by the system. Read-only.
     * +optional
     *
     * @generated from protobuf field: int64 generation = 7;
     */
    generation: bigint;
    /**
     * CreationTimestamp is a timestamp representing the server time when this
     * object was created. It is not guaranteed to be set in happens-before order
     * across separate operations. Clients may not set this value. It is
     * represented in RFC3339 form and is in UTC.
     *
     * Populated by the system.
     * Read-only.
     * Null for lists.
     * More info:
     * https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * +optional
     *
     * @generated from protobuf field: int64 creationTimestamp = 8;
     */
    creationTimestamp: bigint;
    /**
     * DeletionTimestamp is RFC 3339 date and time at which this resource will be
     * deleted. This field is set by the server when a graceful deletion is
     * requested by the user, and is not directly settable by a client. The
     * resource is expected to be deleted (no longer visible from resource lists,
     * and not reachable by name) after the time in this field, once the
     * finalizers list is empty. As long as the finalizers list contains items,
     * deletion is blocked. Once the deletionTimestamp is set, this value may not
     * be unset or be set further into the future, although it may be shortened or
     * the resource may be deleted prior to this time. For example, a user may
     * request that a pod is deleted in 30 seconds. The Kubelet will react by
     * sending a graceful termination signal to the containers in the pod. After
     * that 30 seconds, the Kubelet will send a hard termination signal (SIGKILL)
     * to the container and after cleanup, remove the pod from the API. In the
     * presence of network partitions, this object may still exist after this
     * timestamp, until an administrator or automated process can determine the
     * resource is fully terminated.
     * If not set, graceful deletion of the object has not been requested.
     *
     * Populated by the system when a graceful deletion is requested.
     * Read-only.
     * More info:
     * https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#metadata
     * +optional
     *
     * @generated from protobuf field: int64 deletionTimestamp = 9;
     */
    deletionTimestamp: bigint;
    /**
     * Number of seconds allowed for this object to gracefully terminate before
     * it will be removed from the system. Only set when deletionTimestamp is also set.
     * May only be shortened.
     * Read-only.
     * +optional
     *
     * @generated from protobuf field: int64 deletionGracePeriodSeconds = 10;
     */
    deletionGracePeriodSeconds: bigint;
    /**
     * Map of string keys and values that can be used to organize and categorize
     * (scope and select) objects. May match selectors of replication controllers
     * and services.
     * More info: http://kubernetes.io/docs/user-guide/labels
     * +optional
     *
     * @generated from protobuf field: map<string, string> labels = 11;
     */
    labels: {
        [key: string]: string;
    };
    /**
     * Annotations is an unstructured key value map stored with a resource that
     * may be set by external tools to store and retrieve arbitrary metadata. They
     * are not queryable and should be preserved when modifying objects. More
     * info: http://kubernetes.io/docs/user-guide/annotations +optional
     *
     * @generated from protobuf field: map<string, string> annotations = 12;
     */
    annotations: {
        [key: string]: string;
    };
    /**
     * List of objects depended by this object. If ALL objects in the list have
     * been deleted, this object will be garbage collected. If this object is
     * managed by a controller, then an entry in this list will point to this
     * controller, with the controller field set to true. There cannot be more
     * than one managing controller. +optional +patchMergeKey=uid
     *
     * @generated from protobuf field: repeated vink.kubevm.io.apis.types.OwnerReference ownerReferences = 13;
     */
    ownerReferences: OwnerReference[];
    /**
     * Must be empty before the object is deleted from the registry. Each entry
     * is an identifier for the responsible component that will remove the entry
     * from the list. If the deletionTimestamp of the object is non-nil, entries
     * in this list can only be removed.
     * Finalizers may be processed and removed in any order.  Order is NOT enforced
     * because it introduces significant risk of stuck finalizers.
     * finalizers is a shared field, any actor with permission can reorder it.
     * If the finalizer list is processed in order, then this can lead to a situation
     * in which the component responsible for the first finalizer in the list is
     * waiting for a signal (field value, external system, or other) produced by a
     * component responsible for a finalizer later in the list, resulting in a deadlock.
     * Without enforced ordering finalizers are free to order amongst themselves and
     * are not vulnerable to ordering changes in the list.
     * +optional
     *
     * @generated from protobuf field: repeated string finalizers = 14;
     */
    finalizers: string[];
}
/**
 * A Selector is a label query over a set of resources.
 *
 * @generated from protobuf message vink.kubevm.io.apis.types.Selector
 */
export interface Selector {
    /**
     * matchLabels is a map of {key,value} pairs.
     *
     * @generated from protobuf field: map<string, string> matchLabels = 1;
     */
    matchLabels: {
        [key: string]: string;
    };
}
/**
 * A label selector is a label query over a set of resources. The result of
 * matchLabels and matchExpressions are ANDed. An empty label selector matches
 * all objects. A null label selector matches no objects.
 *
 * @generated from protobuf message vink.kubevm.io.apis.types.LabelSelector
 */
export interface LabelSelector {
    /**
     * matchLabels is a map of {key,value} pairs. A single {key,value} in the
     * matchLabels map is equivalent to an element of matchExpressions, whose key
     * field is "key", the operator is "In", and the values array contains only
     * "value". The requirements are ANDed. +optional
     *
     * @generated from protobuf field: map<string, string> matchLabels = 1;
     */
    matchLabels: {
        [key: string]: string;
    };
    /**
     * matchExpressions is a list of label selector requirements. The requirements
     * are ANDed. +optional
     *
     * @generated from protobuf field: repeated vink.kubevm.io.apis.types.LabelSelectorRequirement matchExpressions = 2;
     */
    matchExpressions: LabelSelectorRequirement[];
}
/**
 * A label selector requirement is a selector that contains values, a key, and
 * an operator that relates the key and values.
 *
 * @generated from protobuf message vink.kubevm.io.apis.types.LabelSelectorRequirement
 */
export interface LabelSelectorRequirement {
    /**
     * key is the label key that the selector applies to.
     *
     * @generated from protobuf field: string key = 1;
     */
    key: string;
    /**
     * operator represents a key's relationship to a set of values.
     * Valid operators are In, NotIn, Exists and DoesNotExist.
     *
     * @generated from protobuf field: string operator = 2;
     */
    operator: string;
    /**
     * values is an array of string values. If the operator is In or NotIn,
     * the values array must be non-empty. If the operator is Exists or
     * DoesNotExist, the values array must be empty. This array is replaced during
     * a strategic merge patch. +optional
     *
     * @generated from protobuf field: repeated string values = 3;
     */
    values: string[];
}
// @generated message type with reflection information, may provide speed optimized methods
class OwnerReference$Type extends MessageType<OwnerReference> {
    constructor() {
        super("vink.kubevm.io.apis.types.OwnerReference", [
            { no: 1, name: "apiVersion", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "kind", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "uid", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "controller", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 6, name: "blockOwnerDeletion", kind: "scalar", T: 8 /*ScalarType.BOOL*/ }
        ]);
    }
    create(value?: PartialMessage<OwnerReference>): OwnerReference {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.apiVersion = "";
        message.kind = "";
        message.name = "";
        message.uid = "";
        message.controller = false;
        message.blockOwnerDeletion = false;
        if (value !== undefined)
            reflectionMergePartial<OwnerReference>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: OwnerReference): OwnerReference {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string apiVersion */ 1:
                    message.apiVersion = reader.string();
                    break;
                case /* string kind */ 2:
                    message.kind = reader.string();
                    break;
                case /* string name */ 3:
                    message.name = reader.string();
                    break;
                case /* string uid */ 4:
                    message.uid = reader.string();
                    break;
                case /* bool controller */ 5:
                    message.controller = reader.bool();
                    break;
                case /* bool blockOwnerDeletion */ 6:
                    message.blockOwnerDeletion = reader.bool();
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
    internalBinaryWrite(message: OwnerReference, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string apiVersion = 1; */
        if (message.apiVersion !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.apiVersion);
        /* string kind = 2; */
        if (message.kind !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.kind);
        /* string name = 3; */
        if (message.name !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.name);
        /* string uid = 4; */
        if (message.uid !== "")
            writer.tag(4, WireType.LengthDelimited).string(message.uid);
        /* bool controller = 5; */
        if (message.controller !== false)
            writer.tag(5, WireType.Varint).bool(message.controller);
        /* bool blockOwnerDeletion = 6; */
        if (message.blockOwnerDeletion !== false)
            writer.tag(6, WireType.Varint).bool(message.blockOwnerDeletion);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message vink.kubevm.io.apis.types.OwnerReference
 */
export const OwnerReference = new OwnerReference$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ObjectMeta$Type extends MessageType<ObjectMeta> {
    constructor() {
        super("vink.kubevm.io.apis.types.ObjectMeta", [
            { no: 1, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "generateName", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "namespace", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "selfLink", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "uid", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 6, name: "resourceVersion", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 7, name: "generation", kind: "scalar", T: 3 /*ScalarType.INT64*/, L: 0 /*LongType.BIGINT*/ },
            { no: 8, name: "creationTimestamp", kind: "scalar", T: 3 /*ScalarType.INT64*/, L: 0 /*LongType.BIGINT*/ },
            { no: 9, name: "deletionTimestamp", kind: "scalar", T: 3 /*ScalarType.INT64*/, L: 0 /*LongType.BIGINT*/ },
            { no: 10, name: "deletionGracePeriodSeconds", kind: "scalar", T: 3 /*ScalarType.INT64*/, L: 0 /*LongType.BIGINT*/ },
            { no: 11, name: "labels", kind: "map", K: 9 /*ScalarType.STRING*/, V: { kind: "scalar", T: 9 /*ScalarType.STRING*/ } },
            { no: 12, name: "annotations", kind: "map", K: 9 /*ScalarType.STRING*/, V: { kind: "scalar", T: 9 /*ScalarType.STRING*/ } },
            { no: 13, name: "ownerReferences", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => OwnerReference },
            { no: 14, name: "finalizers", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<ObjectMeta>): ObjectMeta {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.name = "";
        message.generateName = "";
        message.namespace = "";
        message.selfLink = "";
        message.uid = "";
        message.resourceVersion = "";
        message.generation = 0n;
        message.creationTimestamp = 0n;
        message.deletionTimestamp = 0n;
        message.deletionGracePeriodSeconds = 0n;
        message.labels = {};
        message.annotations = {};
        message.ownerReferences = [];
        message.finalizers = [];
        if (value !== undefined)
            reflectionMergePartial<ObjectMeta>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ObjectMeta): ObjectMeta {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string name */ 1:
                    message.name = reader.string();
                    break;
                case /* string generateName */ 2:
                    message.generateName = reader.string();
                    break;
                case /* string namespace */ 3:
                    message.namespace = reader.string();
                    break;
                case /* string selfLink */ 4:
                    message.selfLink = reader.string();
                    break;
                case /* string uid */ 5:
                    message.uid = reader.string();
                    break;
                case /* string resourceVersion */ 6:
                    message.resourceVersion = reader.string();
                    break;
                case /* int64 generation */ 7:
                    message.generation = reader.int64().toBigInt();
                    break;
                case /* int64 creationTimestamp */ 8:
                    message.creationTimestamp = reader.int64().toBigInt();
                    break;
                case /* int64 deletionTimestamp */ 9:
                    message.deletionTimestamp = reader.int64().toBigInt();
                    break;
                case /* int64 deletionGracePeriodSeconds */ 10:
                    message.deletionGracePeriodSeconds = reader.int64().toBigInt();
                    break;
                case /* map<string, string> labels */ 11:
                    this.binaryReadMap11(message.labels, reader, options);
                    break;
                case /* map<string, string> annotations */ 12:
                    this.binaryReadMap12(message.annotations, reader, options);
                    break;
                case /* repeated vink.kubevm.io.apis.types.OwnerReference ownerReferences */ 13:
                    message.ownerReferences.push(OwnerReference.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                case /* repeated string finalizers */ 14:
                    message.finalizers.push(reader.string());
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
    private binaryReadMap11(map: ObjectMeta["labels"], reader: IBinaryReader, options: BinaryReadOptions): void {
        let len = reader.uint32(), end = reader.pos + len, key: keyof ObjectMeta["labels"] | undefined, val: ObjectMeta["labels"][any] | undefined;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case 1:
                    key = reader.string();
                    break;
                case 2:
                    val = reader.string();
                    break;
                default: throw new globalThis.Error("unknown map entry field for field vink.kubevm.io.apis.types.ObjectMeta.labels");
            }
        }
        map[key ?? ""] = val ?? "";
    }
    private binaryReadMap12(map: ObjectMeta["annotations"], reader: IBinaryReader, options: BinaryReadOptions): void {
        let len = reader.uint32(), end = reader.pos + len, key: keyof ObjectMeta["annotations"] | undefined, val: ObjectMeta["annotations"][any] | undefined;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case 1:
                    key = reader.string();
                    break;
                case 2:
                    val = reader.string();
                    break;
                default: throw new globalThis.Error("unknown map entry field for field vink.kubevm.io.apis.types.ObjectMeta.annotations");
            }
        }
        map[key ?? ""] = val ?? "";
    }
    internalBinaryWrite(message: ObjectMeta, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string name = 1; */
        if (message.name !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.name);
        /* string generateName = 2; */
        if (message.generateName !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.generateName);
        /* string namespace = 3; */
        if (message.namespace !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.namespace);
        /* string selfLink = 4; */
        if (message.selfLink !== "")
            writer.tag(4, WireType.LengthDelimited).string(message.selfLink);
        /* string uid = 5; */
        if (message.uid !== "")
            writer.tag(5, WireType.LengthDelimited).string(message.uid);
        /* string resourceVersion = 6; */
        if (message.resourceVersion !== "")
            writer.tag(6, WireType.LengthDelimited).string(message.resourceVersion);
        /* int64 generation = 7; */
        if (message.generation !== 0n)
            writer.tag(7, WireType.Varint).int64(message.generation);
        /* int64 creationTimestamp = 8; */
        if (message.creationTimestamp !== 0n)
            writer.tag(8, WireType.Varint).int64(message.creationTimestamp);
        /* int64 deletionTimestamp = 9; */
        if (message.deletionTimestamp !== 0n)
            writer.tag(9, WireType.Varint).int64(message.deletionTimestamp);
        /* int64 deletionGracePeriodSeconds = 10; */
        if (message.deletionGracePeriodSeconds !== 0n)
            writer.tag(10, WireType.Varint).int64(message.deletionGracePeriodSeconds);
        /* map<string, string> labels = 11; */
        for (let k of globalThis.Object.keys(message.labels))
            writer.tag(11, WireType.LengthDelimited).fork().tag(1, WireType.LengthDelimited).string(k).tag(2, WireType.LengthDelimited).string(message.labels[k]).join();
        /* map<string, string> annotations = 12; */
        for (let k of globalThis.Object.keys(message.annotations))
            writer.tag(12, WireType.LengthDelimited).fork().tag(1, WireType.LengthDelimited).string(k).tag(2, WireType.LengthDelimited).string(message.annotations[k]).join();
        /* repeated vink.kubevm.io.apis.types.OwnerReference ownerReferences = 13; */
        for (let i = 0; i < message.ownerReferences.length; i++)
            OwnerReference.internalBinaryWrite(message.ownerReferences[i], writer.tag(13, WireType.LengthDelimited).fork(), options).join();
        /* repeated string finalizers = 14; */
        for (let i = 0; i < message.finalizers.length; i++)
            writer.tag(14, WireType.LengthDelimited).string(message.finalizers[i]);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message vink.kubevm.io.apis.types.ObjectMeta
 */
export const ObjectMeta = new ObjectMeta$Type();
// @generated message type with reflection information, may provide speed optimized methods
class Selector$Type extends MessageType<Selector> {
    constructor() {
        super("vink.kubevm.io.apis.types.Selector", [
            { no: 1, name: "matchLabels", kind: "map", K: 9 /*ScalarType.STRING*/, V: { kind: "scalar", T: 9 /*ScalarType.STRING*/ } }
        ]);
    }
    create(value?: PartialMessage<Selector>): Selector {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.matchLabels = {};
        if (value !== undefined)
            reflectionMergePartial<Selector>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: Selector): Selector {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* map<string, string> matchLabels */ 1:
                    this.binaryReadMap1(message.matchLabels, reader, options);
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
    private binaryReadMap1(map: Selector["matchLabels"], reader: IBinaryReader, options: BinaryReadOptions): void {
        let len = reader.uint32(), end = reader.pos + len, key: keyof Selector["matchLabels"] | undefined, val: Selector["matchLabels"][any] | undefined;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case 1:
                    key = reader.string();
                    break;
                case 2:
                    val = reader.string();
                    break;
                default: throw new globalThis.Error("unknown map entry field for field vink.kubevm.io.apis.types.Selector.matchLabels");
            }
        }
        map[key ?? ""] = val ?? "";
    }
    internalBinaryWrite(message: Selector, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* map<string, string> matchLabels = 1; */
        for (let k of globalThis.Object.keys(message.matchLabels))
            writer.tag(1, WireType.LengthDelimited).fork().tag(1, WireType.LengthDelimited).string(k).tag(2, WireType.LengthDelimited).string(message.matchLabels[k]).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message vink.kubevm.io.apis.types.Selector
 */
export const Selector = new Selector$Type();
// @generated message type with reflection information, may provide speed optimized methods
class LabelSelector$Type extends MessageType<LabelSelector> {
    constructor() {
        super("vink.kubevm.io.apis.types.LabelSelector", [
            { no: 1, name: "matchLabels", kind: "map", K: 9 /*ScalarType.STRING*/, V: { kind: "scalar", T: 9 /*ScalarType.STRING*/ } },
            { no: 2, name: "matchExpressions", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => LabelSelectorRequirement }
        ]);
    }
    create(value?: PartialMessage<LabelSelector>): LabelSelector {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.matchLabels = {};
        message.matchExpressions = [];
        if (value !== undefined)
            reflectionMergePartial<LabelSelector>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: LabelSelector): LabelSelector {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* map<string, string> matchLabels */ 1:
                    this.binaryReadMap1(message.matchLabels, reader, options);
                    break;
                case /* repeated vink.kubevm.io.apis.types.LabelSelectorRequirement matchExpressions */ 2:
                    message.matchExpressions.push(LabelSelectorRequirement.internalBinaryRead(reader, reader.uint32(), options));
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
    private binaryReadMap1(map: LabelSelector["matchLabels"], reader: IBinaryReader, options: BinaryReadOptions): void {
        let len = reader.uint32(), end = reader.pos + len, key: keyof LabelSelector["matchLabels"] | undefined, val: LabelSelector["matchLabels"][any] | undefined;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case 1:
                    key = reader.string();
                    break;
                case 2:
                    val = reader.string();
                    break;
                default: throw new globalThis.Error("unknown map entry field for field vink.kubevm.io.apis.types.LabelSelector.matchLabels");
            }
        }
        map[key ?? ""] = val ?? "";
    }
    internalBinaryWrite(message: LabelSelector, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* map<string, string> matchLabels = 1; */
        for (let k of globalThis.Object.keys(message.matchLabels))
            writer.tag(1, WireType.LengthDelimited).fork().tag(1, WireType.LengthDelimited).string(k).tag(2, WireType.LengthDelimited).string(message.matchLabels[k]).join();
        /* repeated vink.kubevm.io.apis.types.LabelSelectorRequirement matchExpressions = 2; */
        for (let i = 0; i < message.matchExpressions.length; i++)
            LabelSelectorRequirement.internalBinaryWrite(message.matchExpressions[i], writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message vink.kubevm.io.apis.types.LabelSelector
 */
export const LabelSelector = new LabelSelector$Type();
// @generated message type with reflection information, may provide speed optimized methods
class LabelSelectorRequirement$Type extends MessageType<LabelSelectorRequirement> {
    constructor() {
        super("vink.kubevm.io.apis.types.LabelSelectorRequirement", [
            { no: 1, name: "key", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "operator", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "values", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<LabelSelectorRequirement>): LabelSelectorRequirement {
        const message = globalThis.Object.create((this.messagePrototype!));
        message.key = "";
        message.operator = "";
        message.values = [];
        if (value !== undefined)
            reflectionMergePartial<LabelSelectorRequirement>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: LabelSelectorRequirement): LabelSelectorRequirement {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string key */ 1:
                    message.key = reader.string();
                    break;
                case /* string operator */ 2:
                    message.operator = reader.string();
                    break;
                case /* repeated string values */ 3:
                    message.values.push(reader.string());
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
    internalBinaryWrite(message: LabelSelectorRequirement, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string key = 1; */
        if (message.key !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.key);
        /* string operator = 2; */
        if (message.operator !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.operator);
        /* repeated string values = 3; */
        for (let i = 0; i < message.values.length; i++)
            writer.tag(3, WireType.LengthDelimited).string(message.values[i]);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message vink.kubevm.io.apis.types.LabelSelectorRequirement
 */
export const LabelSelectorRequirement = new LabelSelectorRequirement$Type();
