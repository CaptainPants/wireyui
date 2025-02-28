import { type UnionToIntersection } from '@serpentis/ptolemy-utilities';

/**
 * This is not in use but is cool so keeping it around.
 */
export type TupleToIntersection<TArgs extends readonly unknown[]> =
    UnionToIntersection<TArgs[number]>;

// The brute force approach that also works:

// type TupleToIntersection<TArgs extends readonly unknown[]> = TArgs extends [infer Only]
//   ? Only
//   : TArgs extends [infer First, ...infer Rest]
//   ? First & Intersect<Rest>
//   : never;

type PropertyKeys = string | symbol | number;

type _GetExpandoTypeHelper<TObject, TPropertyKeys = PropertyKeys> = {
    [TKey in keyof TObject as TPropertyKeys extends TKey ? TKey : never]: TKey;
};

export type GetExpandoKeys<TObject> =
    _GetExpandoTypeHelper<TObject>[keyof _GetExpandoTypeHelper<TObject>];
export type GetNonExpandoKeys<TObject> = Exclude<
    keyof TObject,
    GetExpandoKeys<TObject>
>;
export type GetExpandoValueType<TObject> = TObject[GetExpandoKeys<TObject>];
