import { type MapObjectType, type RigidObjectType } from '../index.js';
import { type IsUnion } from '../internal/unions.js';
import { type ArrayType } from '../types/ArrayType.js';
import {
    type BooleanConstantType,
    type NullConstantType,
    type NumberConstantType,
    type StringConstantType,
    type UndefinedConstantType,
} from '../types/ConstantTypes.js';
import { type NumberType } from '../types/NumberType.js';
import { type StringType } from '../types/StringType.js';
import { type Type } from '../types/Type.js';
import { type UnionType } from '../types/UnionType.js';
import { type UnknownType } from '../types/UnknownType.js';

import { type ParentTypeInfo } from './parents.js';
import { type PropertyModel } from './PropertyModel.js';

export interface ModelBase<T, TTypeType extends Type<unknown>> {
    readonly value: T;
    readonly type: TTypeType;
    readonly parentInfo: ParentTypeInfo | null;
    readonly archetype: string;

    asUnknown: () => Model<unknown>;
}

export interface SimpleModel<T, TType extends Type<unknown>>
    extends ModelBase<T, TType> {
    readonly archetype: string;
}

export interface StringModel extends SimpleModel<string, StringType> {}
export interface NumberModel extends SimpleModel<number, NumberType> {}

// Constants

export interface StringConstantModel<TString extends string>
    extends SimpleModel<TString, StringConstantType<TString>> {}

export interface NumberConstantModel<TNumber extends number>
    extends SimpleModel<TNumber, NumberConstantType<TNumber>> {}

export interface BooleanConstantModel<TBoolean extends boolean>
    extends SimpleModel<TBoolean, BooleanConstantType<TBoolean>> {}

export interface NullModel extends SimpleModel<null, NullConstantType> {}

export interface UndefinedModel
    extends SimpleModel<undefined, UndefinedConstantType> {}

export interface ArrayModel<TElement>
    extends ModelBase<readonly TElement[], ArrayType<TElement>> {
    getElementType: () => Type<TElement>;

    getElement: (index: number) => Model<TElement> | undefined;

    getElements: () => ReadonlyArray<Model<TElement>>;

    spliceElements: (
        start: number,
        deleteCount: number,
        newElements: ReadonlyArray<TElement | Model<TElement>>,
        validate?: boolean,
    ) => Promise<this>;

    moveElement: (
        from: number,
        to: number,
        validate?: boolean,
    ) => Promise<this>;
}

/**
 * Type of property modes expected from an object. Adds in undefined for Record<string, unknown> models.
 */
export type PropertyModelFor<TObject, TKey extends keyof TObject> =
    | PropertyModel<TObject[TKey]>
    | (string extends keyof TObject ? undefined : never);

export interface RigidObjectModel<TObject extends Record<string, unknown>>
    extends ModelBase<Readonly<TObject>, RigidObjectType<TObject>> {
    getProperty<TKey extends keyof TObject & string>(
        key: TKey,
    ): PropertyModelFor<TObject, TKey>;

    getProperties(): Array<PropertyModel<unknown>>;

    setProperty<TKey extends keyof TObject & string>(
        key: TKey,
        value: unknown,
        triggerValidation?: boolean,
    ): Promise<this>;
}

export type ReadonlyRecord<
    TKey extends string | number | symbol,
    TValue,
> = Readonly<Record<TKey, TValue>>;
export type MapObjectEntry<TValue> = readonly [
    name: string,
    model: Model<TValue>,
];

export interface MapObjectModel<TValue>
    extends ModelBase<Readonly<TValue>, MapObjectType<TValue>> {
    getItemType(): Type<Record<string, TValue>>;

    setProperty(
        key: string,
        value: unknown,
        triggerValidation?: boolean,
    ): Promise<this>;

    getProperty(key: string): Model<unknown> | undefined;

    deleteProperty(key: string, validate?: boolean): Promise<this>;

    moveProperty(from: string, to: string, validate?: boolean): Promise<this>;

    getEntries(): readonly MapObjectEntry<TValue>[];
}

export interface UnionModelProperties<TUnion> {
    as: <TAs>(type: Type<TAs>) => Model<TAs> | null;

    getDirectlyResolved: () => Model<unknown>;

    getRecursivelyResolved: () => SpreadModel<TUnion>;

    getTypes: () => ReadonlyArray<Type<unknown>>;

    replace: (value: unknown, validate?: boolean) => Promise<this>;
}

export type UnionModel<TUnion> = ModelBase<TUnion, UnionType<TUnion>> &
    UnionModelProperties<TUnion>;

/**
 * Use conditional to convert Model<T1 | T2> to Model<T1> | Model<T2>
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SpreadModel<T> = T extends any ? Model<T> : never;

export interface RealUnknownModel extends ModelBase<unknown, UnknownType> {}

export type UnknownModel =
    | ArrayModel<unknown>
    | MapObjectModel<unknown>
    | RigidObjectModel<Record<string, unknown>>
    | UnionModel<unknown>
    | StringModel
    | StringConstantModel<string>
    | NumberModel
    | NumberConstantModel<number>
    // Note that BooleanModel is actually UnionModel<true | false>
    | BooleanConstantModel<true>
    | BooleanConstantModel<false>
    | NullModel
    | UndefinedModel
    | RealUnknownModel;

export type AnyModelConstraint =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | ArrayModel<any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | MapObjectModel<any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | RigidObjectModel<any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | UnionModel<any>
    | StringModel
    | StringConstantModel<string>
    | NumberModel
    | NumberConstantModel<number>
    // Note that BooleanModel is actually UnionModel<true | false>
    | BooleanConstantModel<true>
    | BooleanConstantModel<false>
    | NullModel
    | UndefinedModel
    | RealUnknownModel;

export type Model<T> = IsUnion<T> extends true
    ? UnionModel<T>
    : T extends Array<infer TElement>
      ? ArrayModel<TElement>
      : T extends Record<string, infer InferredValue>
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          Record<string, any> extends T
            ? MapObjectModel<InferredValue>
            : RigidObjectModel<T>
        : T extends string
          ? string extends T
              ? StringModel
              : StringConstantModel<T>
          : T extends number
            ? number extends T
                ? NumberModel
                : NumberConstantModel<T>
            : T extends boolean
              ? BooleanConstantModel<T>
              : T extends null
                ? NullModel
                : T extends undefined
                  ? UndefinedModel
                  : UnknownModel;
