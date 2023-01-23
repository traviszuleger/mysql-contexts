//@ts-check

import { GroupBuilder, OrderBuilder, WhereBuilder } from './builders.js';
import { MySqlTableContext } from './contexts.js';

/** @typedef {import('mysql2').QueryError} MySql2QueryError */

/** @typedef {{[key: string]: any}} AbstractModel */

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

/**
 * Used to specify the metadata required to create a MySqlJoinContext class object.
 * @typedef {Object} TableJoinMetadata
 * @template {AbstractModel} TModel Model object that the key should represent.
 * @property {keyof TModel} key Key of the TModel object to join on.
 * @property {string?} name Name of the table to reference the key from.
 */

/**
 * Represents the model object of two tables joined where both table models maintain their original types.
 * @template {AbstractModel} TLeftModel table model represented by the left table being joined.
 * @template {AbstractModel} TRightModel table model represented by the right table being joined.
 * @typedef {TLeftModel & TRightModel} InnerJoinModel
 */

/**
 * Represents the model object of two tables joined where the left table model maintains its original types.
 * @template {AbstractModel} TLeftModel table model represented by the left table being joined.
 * @template {AbstractModel} TRightModel table model represented by the right table being joined.
 * @typedef {TLeftModel & Partial<TRightModel>} LeftJoinModel
 */

/**
 * Represents the model object of two tables joined where the right table model maintains its original types.
 * @template {AbstractModel} TLeftModel table model represented by the left table being joined.
 * @template {AbstractModel} TRightModel table model represented by the right table being joined.
 * @typedef {Partial<TLeftModel> & TRightModel} RightJoinModel
*/

/**
 * Represents the model object of two tables joined where the both table models maintain their original types.
 * @template {AbstractModel} TLeftModel table model represented by the left table being joined.
 * @template {AbstractModel} TRightModel table model represented by the right table being joined.
 * @typedef {Partial<TLeftModel> & Partial<TRightModel>} FullJoinModel
 */

/**
 * Extracts the generic parameter, TTableModel, from the given TTable MySqlTableContext class object. 
 * @template {MySqlTableContext} TTable MySqlTableContext to extract the model from.
 * @typedef {TTable extends MySqlTableContext<infer TTableModel> ? TTableModel : never} ExtractModel
 */

/**
 * Function template that accepts a WhereBuilder class object argument parameter and returns a WhereBuilder class object.
 * @template TTableModel Model that represents the Table where the WHERE clause is being built.
 * @callback WhereBuilderFunction
 * @param {WhereBuilder<TTableModel>} where WhereBuilder class object that can be used to assist in building a WHERE clause.
 * @returns {WhereBuilder<TTableModel>} The WhereBuilder class object that was built.
 */

/**
 * Function template that accepts a OrderBuilder class object argument parameter and returns a WhereBuilder class object.
 * @template TTableModel Model that represents the Table where the WHERE clause is being built.
 * @callback OrderByBuilderFunction
 * @param {OrderBuilder<TTableModel>} order OrderBuilder class object that can be used to assist in building an ORDER BY clause.
 * @returns {OrderBuilder<TTableModel>|OrderByFunction<TTableModel>} The OrderBuilder class object that was built.
 */

/**
 * Function template that accepts a GroupBuilder class object argument parameter and returns a WhereBuilder class object.
 * @template TTableModel Model that represents the Table where the WHERE clause is being built.
 * @callback GroupByBuilderFunction
 * @param {GroupBuilder<TTableModel>} group GroupBuilder class object that can be used to assist in building an ORDER BY clause.
 * @returns {GroupBuilder<TTableModel>} The GroupBuilder class object that was built.
 */

/**
 * All of the options available to pass into the "options" argument in the constructor for MySqlTableContext.
 * @typedef {Object} TableContextOptions
 * @property {boolean=} allowUpdateOnAll Permit updating to all records in the Table.
 * @property {boolean=} allowTruncation Permit truncation of the Table.
 */

/**
 * Callback function on a Connection Pool handled by the emission of when a context connects to the Connection Pool.
 * @callback OnConnectHandler
 * @param {string} dateIso Date in ISO string format
 * @param {string} host Host of the MySQL server
 * @param {string} schema Schema of database and table in format of [database].[dbo].[table]
 */

/**
 * Callback function on a Connection Pool handled by the emission of when a context sends a command to be executed.
 * @callback CommandHandler
 * @param {string} dateIso Date in ISO string format
 * @param {string} host Host of the MySQL server
 * @param {string} schema Schema of database and table in format of [database].[dbo].[table]
 * @param {string} cmdRaw Command in its raw format, including arguments.
 * @param {string} cmdSanitized Command in its sanitized format.
 * @param {any[]} args Arguments that were passed in with the sanitized format.
 */

/**
 * Callback function on a Connection Pool handled by the emission of when a context sends a command and that command fails.
 * @callback CommandFailedHandler
 * @param {MySql2QueryError} error Error thrown by mysql2
 * @param {string} dateIso Date in ISO string format
 * @param {string} host Host of the MySQL server
 * @param {string} schema Schema of database and table in format of [database].[dbo].[table]
 * @param {string} cmdRaw Command in its raw format, including arguments.
 * @param {string} cmdSanitized Command in its sanitized format.
 * @param {any[]} args Arguments that were passed in with the sanitized format.
 */

/** 
 * Aliases for special fields that are returned when a GROUP BY clause is included in a query.
 * @typedef {Object} GroupByAliases
 * @property {number=} $count Count of records in the group. Only accessible if the group => group.by() function was used. If no clause was provided, then this will be undefined.
 * @property {string=} $yearDay The date of the group specified in 'YYYY/dd'. Only accessible if the group => group.byDay() function was used. If no clause was provided, then this will be undefined.
 * @property {string=} $yearWeek The date of the group specified in 'YYYY/mm/dd'. Only accessible if the group => group.byWeek() function was used. If no clause was provided, then this will be undefined.
 * @property {string=} $yearMonth The date of the group specified in 'YYYY/mm'. Only accessible if the group => group.byMonth() function was used. If no clause was provided, then this will be undefined.
 * @property {string=} $year The date of the group specified in 'YYYY'. Only accessible if the group => group.byYear() function was used. If no clause was provided, then this will be undefined.
 */

/**
 * Used to provide context to multiple ORDER BY keys and the sort order it is in.
 * @template {AbstractModel} TTableModel Table model object that is used to help ascension/descension.
 * @typedef {Object} OrderByFunction
 * @property {ByCallback<TTableModel>} by Specifies a key to sort by. (If .asc() nor .desc() is followed, the default is ascending order)
 * @property {AscendingCallback<TTableModel>} asc Specifies the sort order to be ascending.
 * @property {DescendingCallback<TTableModel>} desc Specifies the sort order to be descending.
 */

/**
 * Specifies a key to sort by. (If .asc() nor .desc() is followed, the default is ascending order)
 * @template {AbstractModel} TTableModel 
 * @callback ByCallback
 * @param {keyof TTableModel} tKey
 * @returns {OrderBuilder<TTableModel>} The reference to the original builder building the ORDER BY clause.
 */

/**
 * Specifies the sort order to be ascending.
 * @template {AbstractModel} TTableModel 
 * @callback AscendingCallback
 * @returns {OrderBuilder<TTableModel>} The reference to the original builder building the ORDER BY clause.
 */

/**
 * Specifies the sort order to be descending.
 * @template {AbstractModel} TTableModel 
 * @callback DescendingCallback
 * @returns {OrderBuilder<TTableModel>} The reference to the original builder building the ORDER BY clause.
 */

export default {};