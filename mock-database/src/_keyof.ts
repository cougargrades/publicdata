/**
 * From:
 * - https://dev.to/pffigueiredo/typescript-utility-keyof-nested-object-2pa3#comment-1nm58
 * - https://github.com/react-hook-form/react-hook-form/blob/274d8fb950f9944547921849fb6b3ee6e879e358/src/types/utils.ts#L119
 * - https://www.typescriptlang.org/play?#code/KYDwDg9gTgLgBDAnmYcBiBLYAbAJgNQENsBXYAZzgF44AlYAY2lwB5yYoMA7AcwBo4hLogB8AbgCwAKGmhIsBMlQAFTgFsMMDADdUVaXDgAfOFxLZsB43BJdcwAGbdguKyfadeb0yTUAjYChvPwgIbGAhb3JEfzDgjB5uGEkZKSQUOABJcgAVEjBwlhy4UBhgO0p6QlwILmxEAEEoKEJEFiFREWoff0CSkDKKuByAbQBycN4YAAsxgF0rAH44B2JyYCsALgQoMhT01DyC4ABpYDbi0vLcSoiausbm1vbhES6aAFEQBlJ7FgBrc4QBzDASAxDAwTCEZzcTSA5wJotRBnRDdMy9KApeFKODKQgzTJqAosE79QY3OAebg8awYgJQAT4d5wfDk66UVQYDRaXRLOAAAwAJABvE4AXwFW0FoolAuswrF4oAdKL8TMWMzJdipHJoPAEerpkUWZcBhy6HdavUkc9uA4+sz+dkjoUcl0rkMOGR+SKrIYRmTuMN8uFUSa5gBaRbbI1EklkgBkVI4NIEoxOsJShnFI1dp3OEelceJ2BYtpR5yZImlfqkhgDQa4cHBkJyUZjeIJ03jZaTKc8-GGgazVlzrZB7Z1eoUCMwOFwRqK87wRFIFHZQxXBGIZHILKXOW3a73cNSCIrJYTm8p1N4dN8DOr3TZnspXJ5Og29bgyy4wF0IIf22V9zSGKp7htJ42ntPoAFUax-ZY4JvTl1E0L9+X-QDpUVOUFVlFVRUvbtNRESVcMI1URRIjUtQFadwH1RQMlo413W6M0KVuaprUeZEWFgqBWUQwxlhdUNgBNVCdh9JC4DrBs4EDOBg3zcN3Q7bY2N7Uk4GTO8hwzUcf1zdTC006UdNLctoNRata39ZSmxbIFJy0xFoKvPt9IHNNh0zM8cxGCdhjmRj5ANXEjRPKScgEZQZMPLoTDYk1TRkjp+USt9KEVIS4AlaiCtoCj5LJXLXIhSd+VoJLSOM0Tfy7GZYqKEcBFoJrtmwwJpQqsDKUVCtUTKsThhkiC+IrQSuAdYSnXkmLdyk-BOt8pdmW60wAL64Cdpw-acsGyhQpyflRmUBYjpk4a7POMbmq4i0poeGaCsW8b8GlXqgMMHrdr+uAAcAiLmLnLA8GW9cWCsI9IZ3ddKEq48VvIPg4e3I0ZKxhrUaRkQMZ-A9uza+GF1i9HhlxmYz1kJjZ1xGnpkp2Gf3J1c0ZxhHKaJwwcmxlGEcPfHTxhawoCtB50GFvGebRkQYT5uAWRFcVfMUhsVODM6jTmbZmbapz+dFihlaUgXuxHXzmeXeWCacoK4HFHUAHpXeGaZUDKdgcQyL5CFLPQFMIbYACJDLDgQ-HD+lAijuAGG2EYRXIGlwm2b1gHFOYBEIZpthFf92BcTPdmzmFxT9w4KHgGhbYDoPEOkBxbAYLRajgWoAGFpiEHgpIAOW5hcl0b443gACicBdB8D4BtkHgRtBWg3ZdalaWHH8IBEHkQAEoFKr1J3YQaYMEoVYMGwShCGR8BGDKVwpFPjAQUlgpCAYFw4AAd00aYslUCaD-hAcwuBQFQH+NIHufdeDAEnmHfOUBlQAAZlTFyfgnVYN9gD7yAA
 */

export type FieldValues = Record<string, any>;

export type Primitive =
  | null
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint;

type IsTuple<T extends ReadonlyArray<any>> = number extends T['length']
  ? false
  : true;
type TupleKey<T extends ReadonlyArray<any>> = Exclude<keyof T, keyof any[]>;
type ArrayKey = number;

type PathImpl<K extends string | number, V> = V extends Primitive
  ? `${K}`
  : `${K}` | `${K}.${Path<V>}`;

export type Path<T> = T extends ReadonlyArray<infer V>
  ? IsTuple<T> extends true
  ? {
    [K in TupleKey<T>]-?: PathImpl<K & string, T[K]>;
  }[TupleKey<T>]
  : PathImpl<ArrayKey, V>
  : {
    [K in keyof T]-?: PathImpl<K & string, T[K]>;
  }[keyof T];

export type FieldPath<TFieldValues extends FieldValues> = Path<TFieldValues>;

type ArrayPathImpl<K extends string | number, V> = V extends Primitive
  ? never
  : V extends ReadonlyArray<infer U>
  ? U extends Primitive
  ? never
  : `${K}` | `${K}.${ArrayPath<V>}`
  : `${K}.${ArrayPath<V>}`;

export type ArrayPath<T> = T extends ReadonlyArray<infer V>
  ? IsTuple<T> extends true
  ? {
    [K in TupleKey<T>]-?: ArrayPathImpl<K & string, T[K]>;
  }[TupleKey<T>]
  : ArrayPathImpl<ArrayKey, V>
  : {
    [K in keyof T]-?: ArrayPathImpl<K & string, T[K]>;
  }[keyof T];

export type PathValue<T, P extends Path<T> | ArrayPath<T>> = T extends any
  ? P extends `${infer K}.${infer R}`
  ? K extends keyof T
  ? R extends Path<T[K]>
  ? PathValue<T[K], R>
  : never
  : K extends `${ArrayKey}`
  ? T extends ReadonlyArray<infer V>
  ? PathValue<V, R & Path<V>>
  : never
  : never
  : P extends keyof T
  ? T[P]
  : P extends `${ArrayKey}`
  ? T extends ReadonlyArray<infer V>
  ? V
  : never
  : never
  : never;

export type FieldPathValue<
  TFieldValues extends FieldValues,
  TFieldPath extends FieldPath<TFieldValues>,
  > = PathValue<TFieldValues, TFieldPath>;

export type FieldPathValues<
  TFieldValues extends FieldValues,
  TPath extends FieldPath<TFieldValues>[] | readonly FieldPath<TFieldValues>[],
  > = {} & {
    [K in keyof TPath]: FieldPathValue<
      TFieldValues,
      TPath[K] & FieldPath<TFieldValues>
    >;
  };

// export type FieldPathValueRestrict<T extends FieldValues, P extends Path<T>, R extends Primitive> = 
//   FieldPathValue<T, P> extends R ? FieldPathValue<T, P> : never;

// The test
type Example = {a: "string", b: "number", c: [{single: true}], arr: {nested: true}[], d: number }
type Test = FieldPath<Example>

function demo() {
  function onChange<N extends FieldPath<Example>>(fieldName: N, value: FieldPathValue<Example, N>) {}
  //increment<T extends object>(documentPath: string, increments: { [path: FieldPath<T>]: number })
  function Foo<T extends object>(increments: Partial<{[ path in FieldPath<T>]: number }>) {}

  // this fails as expected
  // if replaced with true it would work
  onChange("arr.0.nested", true)
  Foo<Example>({
    'd': 1
  })
}

/**
 * Godsend type from: https://dev.to/pffigueiredo/typescript-utility-keyof-nested-object-2pa3
 */
export type NestedKeyOf<ObjectType extends object> = 
  {[Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
  ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
  : `${Key}`
  }[keyof ObjectType & (string | number)];
