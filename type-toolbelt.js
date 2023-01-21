//@ts-check

/**
 * Replaces an old key of TModel with a new key.
 * @template TModel Model to replace the key.
 * @template {keyof TModel} TOldKey Old key name to remove.
 * @template {string} TNewKey New key name to take place of the old key.
 * @typedef {TNewKey extends keyof TModel ? never : {[K in keyof Record<keyof Omit<TModel, TOldKey>|TNewKey, unknown>]: K extends keyof TModel ? TModel[K] : TModel[TOldKey]}} ReplaceKey
 */

/** 
 * Augment a single key to be optional in TModel. Everything else remains their original type.
 * @template TModel Model to restrict a key to be optional.
 * @template {keyof TModel} TModelKey Key in TModel to make optional.
 * @typedef {Omit<TModel, TModelKey> & Partial<Pick<TModel, TModelKey>>} OptionalKey 
 */

/** 
 * Augments all keys in TModel to be optional, except TModelKey. TModelKey will become a required Key.
 * @template TModel Model to augment.
 * @template {keyof TModel} TModelKey Key in TModel to make required.
 * @typedef {RequiredKey<Partial<TModel>, TModelKey>} AllOptionalExcept 
 */

/** 
 * Augment a single key to be required in TModel. Everything else remains their original type.
 * @template TModel Model to restrict a key to be required.
 * @template {keyof TModel} TModelKey Key in TModel to make required.
 * @typedef {Omit<TModel, TModelKey> & Required<Pick<TModel, TModelKey>>} RequiredKey 
 */

/**
 * Augments all keys in TModel to be required, except TModelKey. TModelKey will become an optional Key.
 * @template TModel Model to augment.
 * @template {keyof TModel} TModelKey Key in TModel to make optional.
 * @typedef {OptionalKey<Required<TModel>, TModelKey>} AllRequiredExcept 
 */

/** 
 * Get all the Keys of TModel where the value specified by the key is of type ValueType.
 * @template TModel Model to check keys from.
 * @template ValueType Type of the value that the keys should be filtered on.
 * @typedef {keyof {[Key in keyof TModel as TModel[Key] extends ValueType ? Key : never]: TModel[Key]}} KeyByValueType 
 */
export default {};