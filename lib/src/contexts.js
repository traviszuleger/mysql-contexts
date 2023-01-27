//@ts-check
import { WhereBuilder, OrderBuilder, GroupBuilder } from './builders.js';
import { createPool } from "mysql2/promise";

/** @typedef {import('mysql2/promise').PoolOptions} MySql2PoolOptions */
/** @typedef {import('mysql2/promise').Pool} MySql2Pool */
/** @typedef {import('mysql2/promise').Connection} MySql2Connection */
/** @typedef {import('mysql2/promise').ResultSetHeader} MySql2ResultSetHeader */

/** @template TString1 @template TString2 @typedef {import('./toolbelt.js').AugmentString<TString1, TString2>} AugmentString */
/** @template TModel @typedef {import('./toolbelt.js').TableJoinMetadata<TModel>} TableJoinMetadata */
/** @template TModel @typedef {import('./toolbelt.js').WhereBuilderFunction<TModel>} WhereBuilderFunction */
/** @template TModel @typedef {import('./toolbelt.js').OrderByBuilderFunction<TModel>} OrderByBuilderFunction */
/** @template TModel @typedef {import('./toolbelt.js').GroupByBuilderFunction<TModel>} GroupByBuilderFunction */
/** @template TModel @typedef {import('./toolbelt.js').ExtractModel<TModel>} ExtractModel */
/** @typedef {import('./toolbelt.js').SuccessHandler} SuccessHandler */
/** @typedef {import('./toolbelt.js').FailHandler} FailHandler */
/** @typedef {import('./toolbelt.js').TableContextOptions} TableContextOptions */
/** @typedef {import('./toolbelt.js').GroupByAliases} GroupByAliases */
/** @typedef {import('./toolbelt.js').AbstractModel} AbstractModel */

// ??????????????????????????????

/**
 * Object that holds context to a specific Table in your MySQL database. To ensure type-safety in vanilla JavaScript, use JSDOC typing.
 * @template {AbstractModel} TTableModel Model that represents the Table this Context represents.
 */
export class MySqlTableContext {
    /** @private @readonly @type {'table-context-query'} Event fired when the Table Context queries. */
    static EVENT_TABLE_CONTEXT_QUERY = 'table-context-query';
    /** @private @readonly @type {'table-context-query-failed'} Event fired when the Table Context inserts. */
    static EVENT_TABLE_CONTEXT_QUERY_FAILED = 'table-context-query-failed';
    /** @private @readonly @type {'table-context-insert'} Event fired when the Table Context inserts. */
    static EVENT_TABLE_CONTEXT_INSERT = 'table-context-insert';
    /** @private @readonly @type {'table-context-insert-failed'} Event fired when the Table Context inserts. */
    static EVENT_TABLE_CONTEXT_INSERT_FAILED = 'table-context-insert-failed';
    /** @private @readonly @type {'table-context-update'} Event fired when the Table Context updates. */
    static EVENT_TABLE_CONTEXT_UPDATE = 'table-context-update';
    /** @private @readonly @type {'table-context-update-failed'} Event fired when the Table Context inserts. */
    static EVENT_TABLE_CONTEXT_UPDATE_FAILED = 'table-context-update-failed';
    /** @private @readonly @type {'table-context-delete'} Event fired when the Table Context deletes. */
    static EVENT_TABLE_CONTEXT_DELETE = 'table-context-delete';
    /** @private @readonly @type {'table-context-delete-failed'} Event fired when the Table Context inserts. */
    static EVENT_TABLE_CONTEXT_DELETE_FAILED = 'table-context-delete-failed';

    /** @protected @const @type {keyof TTableModel|null} */ _incKey;
    /** @protected @type {MySql2Pool} */_pool;
    /** @protected @type {string} */ _table;
    /** @protected @type {MySql2Connection} */ _cnn;
    /** @protected @type {Promise<MySql2Connection>} */ _cnnPromise;
    /** @protected @type {TableContextOptions} */ _options;
    /** @protected @type {(keyof TTableModel)?} */ _joinKey = null;

    /**
     * Creates a Connection Pool ready for use inside of multiple MySqlTableContext objects.
     * @param {MySql2PoolOptions} config Configuration to create the pool on.
     * @returns {MySql2Pool} Connection Pool.
     */
    static createPool(config) {
        return createPool({ decimalNumbers: true, bigNumberStrings: true, connectionLimit: 20, ...config });
    }

    /**
     * Creates a new MySQL table context given the mysql2 config options. The user may also pass in an existing "Pool" object too, 
     * which allows this context to work alongside other contexts.
     * @param {MySql2Pool|MySql2PoolOptions} configOrPool MySql2 config options to create a Pool object with or an existing Pool.
     * @param {string} table Name of the Table this context is connecting to.
     * @param {(keyof TTableModel)?} autoIncrementKey Primary key of the table that auto increments. If there is none, then leave null.
     * @param {TableContextOptions} options Context options that enable certain features.
     */
    constructor(configOrPool, table, autoIncrementKey=null, options = {}) {
        this._table = table;
        this._incKey = autoIncrementKey;
        if ('query' in configOrPool) {
            this._pool = configOrPool
        } else {
            this._pool = MySqlTableContext.createPool(configOrPool);
        }
        //@ts-ignore Ignoring, since we know cnn won't be null indefinitely, just until the Promise is finished. Wherever cnn is used, we await the promise.
        this._cnn = null;
        this._cnnPromise = this._pool.getConnection();
        this._cnnPromise.then(cnn => {
            this._cnn = cnn;
        });
        this._options = { 
            allowTruncation: false, 
            allowUpdateOnAll: false, 
            sortKeys: false, 
            ...options 
        };
    }

    /**
     * Executes a query command against the Table this context represents.
     * @protected
     * @param {string} cmd Command to execute
     * @param {any[]=} args Arguments to pass to avoid sql injections.
     * @returns {Promise<TTableModel[]>} T models that are returned from the 
     */
    async _query(cmd, args = undefined) {
        let cmdRaw = cmd;
        try {
            await this._cnnPromise;
            if (!cmd.startsWith("SELECT")) {
                throw Error("Unrecognized SQL query.");
            }
            args?.forEach(a => cmdRaw = cmdRaw.replace('?', a));
            this._pool.emit(`${MySqlTableContext.EVENT_TABLE_CONTEXT_QUERY}-${this._table}`, {
                dateIso: new Date().toISOString(),
                host: this._cnn.config.host,
                schema: `[${this._cnn.config.database}].[dbo].[${this._table}]`,
                cmdRaw,
                cmd,
                args
            });
            const [result] = await this._pool.query(cmd, args);
            return /** @type {TTableModel[]} */ (result);
        } catch(err) {
            this._pool.emit(`${MySqlTableContext.EVENT_TABLE_CONTEXT_QUERY_FAILED}-${this._table}`, {
                error: err,
                dateIso: new Date().toISOString(),
                host: this._cnn.config.host,
                schema: `[${this._cnn.config.database}].[dbo].[${this._table}]`,
                cmdRaw,
                cmd,
                args
            })
            throw Error(`An error occurred when attempting to query from ${`[${this._cnn.config.database}].[dbo].[${this._table}]`}. Error: ${err}`);
        }
    }

    /**
     * Executes an insert command against the Table this context represents.
     * @private
     * @param {string} cmd Command to execute
     * @param {any[]=} args Arguments to pass to avoid sql injections.
     * @returns {Promise<number[]>} The insertId of the first item inserted.
     */
    async _insert(cmd, args = undefined) {
        let cmdRaw = cmd;
        try {
            await this._cnnPromise;
            if (!cmd.startsWith("INSERT")) {
                throw Error("Unrecognized SQL insert command.");
            }
            if (args) {
                // Convert UTC Date Strings to MySQL acceptable Date Strings (YYYY-MM-dd HH:mm:ss)
                args = args.map(a => {
                    if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(a)) {
                        return a.replace('T', ' ').replace(/\.[0-9]{3}Z/, '');
                    }
                    return a;
                });
            }
            args?.forEach(a => cmdRaw = cmdRaw.replace('?', typeof (a) === "string" || a instanceof Date ? `'${a}'` : a));
            const [result] = /** @type {MySql2ResultSetHeader[]} */ (await this._pool.execute(cmd, args));
            this._pool.emit(`${MySqlTableContext.EVENT_TABLE_CONTEXT_INSERT}-${this._table}`, {
                affectedRows: result.affectedRows,
                dateIso: new Date().toISOString(),
                host: this._cnn.config.host,
                schema: `[${this._cnn.config.database}].[dbo].[${this._table}]`,
                cmdRaw,
                cmd,
                args,
            });
            return Array.from(Array(result.affectedRows).keys()).map((_,n) => n + result.insertId);
        } catch(err) {
            this._pool.emit(`${MySqlTableContext.EVENT_TABLE_CONTEXT_INSERT_FAILED}-${this._table}`, { 
                error: err, 
                dateIso: new Date().toISOString(), 
                host: this._cnn.config.host, 
                schema: `[${this._cnn.config.database}].[dbo].[${this._table}]`, 
                cmdRaw, 
                cmd, 
                args
            });
            throw Error(`An error occurred when attempting to insert into ${`[${this._cnn.config.database}].[dbo].[${this._table}]`}. Error: ${err}`);
        }
    }

    /**
     * Executes an update command against the Table this context represents.
     * @private
     * @param {string} cmd Command to execute
     * @param {any[]=} args Arguments to pass to avoid sql injections.
     * @returns {Promise<number>} Number of rows that were deleted.
     */
    async _update(cmd, args = undefined) {
        let cmdRaw = cmd;
        try {
            await this._cnnPromise;
            if (!cmd.startsWith("UPDATE")) {
                throw Error("Unrecognized SQL update command.");
            }
            if (args) {
                // Convert UTC Date Strings to MySQL acceptable Date Strings (YYYY-MM-dd HH:mm:ss)
                args = args.map(a => {
                    if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/.test(a)) {
                        return a.replace('T', ' ').replace(/\.[0-9]{3}Z/, '');
                    }
                    return a;
                });
            }
            args?.forEach(a => cmdRaw = cmdRaw.replace('?', typeof (a) === "string" || a instanceof Date ? `'${a}'` : a));
            const result = /** @type {MySql2ResultSetHeader} */ ((await this._pool.execute(cmd, args))[0]);
            this._pool.emit(`${MySqlTableContext.EVENT_TABLE_CONTEXT_UPDATE}-${this._table}`, {
                affectedRows: result.affectedRows,
                dateIso: new Date().toISOString(),
                host: this._cnn.config.host,
                schema: `[${this._cnn.config.database}].[dbo].[${this._table}]`,
                cmdRaw,
                cmd,
                args
            });
            return result.affectedRows;
        } catch(err) {
            this._pool.emit(`${MySqlTableContext.EVENT_TABLE_CONTEXT_UPDATE_FAILED}-${this._table}`, {
                error: err,
                dateIso: new Date().toISOString(),
                host: this._cnn.config.host,
                schema: `[${this._cnn.config.database}].[dbo].[${this._table}]`,
                cmdRaw,
                cmd,
                args
            });
            throw Error(`An error occurred when attempting to update ${`[${this._cnn.config.database}].[dbo].[${this._table}]`}. Error: ${err}`);
        }
    }

    /**
     * Executes a delete command against the Table this context represents.
     * @private
     * @param {string} cmd Delete command to execute
     * @param {any[]=} args Arguments to pass to avoid sql injections.
     * @returns {Promise<number>} Number of rows that were deleted.
     */
    async _delete(cmd, args = undefined) {
        let cmdRaw = cmd;
        try {
            await this._cnnPromise;
            if (!cmd.startsWith("DELETE")) {
                throw Error("Unrecognized SQL update command.");
            }
            args?.forEach(a => cmdRaw = cmdRaw.replace('?', typeof(a) === "string" || a instanceof Date ? `'${a}'` : a));
            const result = /** @type {MySql2ResultSetHeader} */ ((await this._pool.execute(cmd, args))[0]);
            this._pool.emit(`${MySqlTableContext.EVENT_TABLE_CONTEXT_DELETE}-${this._table}`, {
                affectedRows: result.affectedRows,
                dateIso: new Date().toISOString(),
                host: this._cnn.config.host,
                schema: `[${this._cnn.config.database}].[dbo].[${this._table}]`,
                cmdRaw,
                cmd,
                args
            });
            return result.affectedRows;
        } catch(err) {
            this._pool.emit(`${MySqlTableContext.EVENT_TABLE_CONTEXT_DELETE_FAILED}-${this._table}`, {
                error: err,
                dateIso: new Date().toISOString(),
                host: this._cnn.config.host,
                schema: `[${this._cnn.config.database}].[dbo].[${this._table}]`,
                cmdRaw,
                cmd,
                args
            })
            throw Error(`An error occurred when attempting to delete from ${`[${this._cnn.config.database}].[dbo].[${this._table}]`}. Error: ${err}`);
        }
    }

    /**
     * Gets the total number of records that are stored in the Table this context represents.
     * @param {WhereBuilderFunction<TTableModel>?} where Used to filter the results.
     * @param {(keyof TTableModel)[]?} distinct Builder function to help build a GROUP BY clause.
     * @returns {Promise<number>} Number specifying the total count of all records that were queried from this command.
     */
    async count(where = null, distinct = null) {
        const _where = where != null ? where(new WhereBuilder()) : new WhereBuilder();
        let cmd = `SELECT ${distinct != null ? `COUNT(DISTINCT ${distinct.join(',')}) AS count` : "COUNT(*) AS $count"} FROM \`${this._table}\`${_where.toString()}`;
        const ts = await this._query(cmd, _where.getArgs());
        return ts[0]["$count"];
    }

    /**
     * Get a specific quantity of records from the Table this context represents.
     * @param {number|string} limit Number of records to grab.
     * @param {number|string} offset Number specified to offset from the beginning.
     * @param {WhereBuilderFunction<TTableModel>?} where Builder function to help build a WHERE clause.
     * @param {GroupByBuilderFunction<TTableModel>?} groupBy Builder function to help build a GROUP BY clause.
     * @param {OrderByBuilderFunction<(TTableModel & GroupByAliases)>?} orderBy Builder function to help build an ORDER BY clause.
     * @param {(keyof (TTableModel & GroupByAliases))[]?} distinct List of column names under this TableContext to select distinctively off of.
     * @returns {Promise<(TTableModel & GroupByAliases)[]>} A list of TTableModel models. If a GROUP BY clause was built, then some extra aliases are added.
     */
    async get(limit, offset = 0, where = null, groupBy = null, orderBy = null, distinct = null) {
        const _where = where != null ? where(new WhereBuilder()) : new WhereBuilder();
        const _groupBy = groupBy != null ? groupBy(new GroupBuilder()) : new GroupBuilder();
        const _orderBy = orderBy != null ? orderBy(new OrderBuilder()) : new OrderBuilder();
        let cmd = `SELECT ${distinct != null ? `DISTINCT ${distinct.join(',')}` : _groupBy.getSelects()} `
            + `FROM ${this._table}${_where.toString()}${_groupBy.toString()}${_orderBy.toString()} `
            + `${limit > 0 ? "LIMIT " + limit : ""} `
            + `${offset > 0 ? "OFFSET " + offset : ""}`;
        const ts = await this._query(cmd, _where.getArgs());
        return ts;
    }

    /**
     * Get all records from the Table this context represents.
     * @param {WhereBuilderFunction<TTableModel>?} where Builder function to help build a WHERE clause.
     * @param {GroupByBuilderFunction<TTableModel>?} groupBy Builder function to help build a GROUP BY clause.
     * @param {OrderByBuilderFunction<(TTableModel & GroupByAliases)>?} orderBy Builder function to help build an ORDER BY clause.
     * @param {(keyof (TTableModel & GroupByAliases))[]?} distinct List of column names under this TableContext to select distinctively off of.
     * @returns {Promise<(TTableModel & GroupByAliases)[]>} A list of TTableModel models. If a GROUP BY clause was built, then some extra aliases are added.
    */
    async getAll(where = null, groupBy = null, orderBy = null,  distinct = null) {
        const _where = where != null ? where(new WhereBuilder()) : new WhereBuilder();
        const _orderBy = orderBy != null ? orderBy(new OrderBuilder()) : new OrderBuilder();
        const _groupBy = groupBy != null ? groupBy(new GroupBuilder()) : new GroupBuilder();
        let cmd = `SELECT ${distinct != null ? `DISTINCT ${distinct.join(',')}` : _groupBy.getSelects()} `
            + `FROM \`${this._table}\`${_where.toString()}${_groupBy.toString()}${_orderBy.toString()} `;
        const ts = await this._query(cmd, _where.getArgs());
        return ts;
    }

    /**
     * Insert a single TTableModel model object into the Table this context represents. 
     * @param {TTableModel} record A list of TTableModel model objects to insert into the Table.
     * @returns {Promise<TTableModel>} TTableModel model object that was inserted.
     * If an Auto Increment Primary Key was specified, the Insert ID will be updated.
     */
    async insertOne(record) {
        return (await this.insertMany([record]))[0];
    }

    /**
     * Insert a multiple TTableModel model objects into the Table this context represents. 
     * @param {TTableModel[]} records A list of TTableModel model objects to insert into the Table.
     * @returns {Promise<TTableModel[]>} List of the TTableModel model objects that were inserted. 
     * If an Auto Increment Primary Key was specified, the Insert ID for each object will be updated appropriately.
     */
    async insertMany(records) {
        // This is a semi-complex function, so comments are tagged above most lines of code to help any users interpret the functionality.
        if (!Array.isArray(records) || records.length <= 0) return [];
        if(this._incKey != null) {
            records.forEach(r => {
                // @ts-ignore
                delete r[this._incKey];
            })
        }
        // Copy the records.
        /** @type {(records: TTableModel[]) => TTableModel[]} */
        const clone = (recs) => JSON.parse(JSON.stringify(recs));
        // Get all unique keys from all of the records. (also remove the column representing the incrementing key, if it was specified and exists)
        const allKeys = clone(records).flatMap(rec => Object.keys(rec)).filter((rec,n,self) => self.indexOf(rec) == n);
        const keysFiltered = allKeys.filter(col => this._incKey == null || col != this._incKey) // sort, so the keys don't get mangled to the wrong values.
        if(this._options.sortKeys) {
            keysFiltered.sort();
        }
        // Use the keys to create our INTO (...columns) part.
        const cols = keysFiltered.map(col => `\`${col}\``).join(', ');
        // Create an array of (?[,...?]) strings that represent each record to insert.
        const vals = Array.from(Array(records.length).keys()).map(_ => `(${Array.from(Array(keysFiltered.length).keys()).map(_ => '?').join(',')})`).join(',');
        // Create an array of all of the arguments. (any records that do not have the column that was being inserted just has null get inserted EXPLICITLY)
        const args = records.flatMap(rec => keysFiltered.map(k => k in rec ? rec[k] : null));
        
        const cmd = `INSERT INTO \`${this._table}\` (${cols}) VALUES ${vals}`;
        const insertIds = await this._insert(cmd, args);

        if(this._incKey != null) {
            // Map "items" so their Id reflects the database.
            return records.map((rec,n) => {
                //@ts-ignore
                rec[this._incKey] = insertIds[n];
                return rec;
            });
        }
        return records;
    }

    /**
     * Update many existing TTableModel model objects in the Table this context represents.
     * @param {Partial<TTableModel>} record List of TTableModel model objects to insert into the Table.
     * @param {WhereBuilderFunction<TTableModel>?} where Builder function to help build a WHERE clause.
     * @returns {Promise<number>} Number of affected rows.
     */
    async update(record, where = null) {
        const _where = where != null ? where(new WhereBuilder()) : new WhereBuilder();
        if (Object.keys(record).length <= 0) throw Error('The record passed has no keys to represent the column(s) to update.');
        if (where == null || _where.getArgs().length <= 0) {
            throw Error('No WHERE clause was built, possibly resulting in all records in the table being updated.'
                + '\n\tIf you are sure you know what you are doing, then use the "updateAll" function.');
        }

        // Serialize the value sets, removing the AUTO_INCREMENT key if it exists in the record.
        const sets = Object.keys(record).filter(key => this._incKey == null || key != this._incKey).map(key => `\`${key}\`=?`).join(', ');
        const args = Object.entries(record).filter(([k, _]) => this._incKey == null || k != this._incKey).map(([_,v]) => v);

        const cmd = `UPDATE \`${this._table}\` SET ${sets}${_where.toString()}`;
        const numRowsAffected = this._update(cmd, [...args, ..._where.getArgs()]);
        return numRowsAffected;
    }

    /**
     * Update all records in the Table this context represents.
     * WARNING: This function will update all records in the table. 
     * To avoid accidental calls to this function, an Error will be thrown warning the developer prompting them to set "allowUpdateOnAll" to true in the options.
     * @param {Partial<TTableModel>} record TTableModel model object to use to update all the records.
     * @returns {Promise<number>} Number of affected rows.
     */
    async updateAll(record) {
        if (Object.keys(record).length <= 0) throw Error('The record passed has no keys to represent the column(s) to update.');
        if(!this._options.allowUpdateOnAll) {
            throw Error('You are trying to update all records in the table with no filter.'
                + '\n\tIf you are trying to update select records, see "updateMany".'
                + '\n\tIf you know what you are doing, then pass into the "options" parameter in the constructor, "allowUpdateOnAll: true"');
        }

        // Serialize the value sets, removing the AUTO_INCREMENT key if it exists in the record.
        const sets = Object.keys(record).filter(key => this._incKey != null && key != this._incKey).map(key => `\`${key}\`=?`).join(', ');
        const args = Object.entries(record).filter(([k, _]) => this._incKey != null && k != this._incKey).map(([_, v]) => v);

        const cmd = `UPDATE \`${this._table}\` SET ${sets}`;
        const numRowsAffected = this._update(cmd, args);
        return numRowsAffected;
    }

    /**
     * Delete many records from the table this context represents.
     * @param {WhereBuilderFunction<TTableModel>?} where Builder function to help build a WHERE clause.
     * @returns {Promise<number>} Number of deleted rows.
     */
    async delete(where = null) {
        const _where = where != null ? where(new WhereBuilder()) : new WhereBuilder();
        if (where == null || _where.getArgs().length <= 0) {
            throw Error('No WHERE clause was built, possibly resulting in all records in the table being deleted.'
                + '\n\tIf you are sure you know what you are doing, then use the "truncate" function.');
        }
        const cmd = `DELETE FROM \`${this._table}\`${_where.toString()}`;
        const ts = await this._delete(cmd, _where.getArgs());
        return ts;
    }

    /**
     * Truncate the table this context represents.
     * WARNING: This function will delete all records in the table. 
     * To avoid accidental calls to this function, an Error will be thrown warning the developer prompting them to set "allowTruncation" to true in the options.
     * @returns {Promise<number>} Number of deleted rows.
     */
    async truncate() {
        if (!this._options.allowTruncation) {
            throw Error('You are trying to delete all records in the table. '
                + '\n\tIf you are trying to delete select records, see "deleteMany". '
                + '\n\tIf you know what you are doing, then pass into the "options" parameter in the constructor, "allowTruncation: true"');
        }
        const cmd = `TRUNCATE \`${this._table}\``;
        const ts = await this._delete(cmd);
        return ts;
    }

    /**
     * Joins this table with another table to yield only matching results of this table and the other table.
     * As of right now, you can only join on one condition.
     * @template {MySqlTableContext<?>} TJoiningTableContext The MySqlTableContext to join with
     * @template {ExtractModel<TJoiningTableContext>} [TJoiningModel=ExtractModel<TJoiningTableContext>]
     * @param {Exclude<TJoiningTableContext, MySqlJoinContext<?, ?>>} table MySqlTableContext that is not already a joined table.
     * @param {TableJoinMetadata<TTableModel>} leftData Metadata to specify for how the left table will join.
     * @param {TableJoinMetadata<TJoiningModel>} rightData Metadata to specify for how the right table will join.
     * @returns {MySqlJoinContext<TTableModel, TJoiningModel>} A new MySqlJoinContext that has only query access.
     */
    join(table, leftData, rightData) {
        return new MySqlJoinContext(this, table, leftData, rightData);
    }

    /**
     * Joins this table with another table to yield all results of this table, and any matching results of the other table.
     * As of right now, you can only join on one condition.
     * @template {MySqlTableContext<?>} TJoiningTableContext The MySqlTableContext to join with
     * @template {ExtractModel<TJoiningTableContext>} [TJoiningModel=ExtractModel<TJoiningTableContext>]
     * @param {Exclude<TJoiningTableContext, MySqlJoinContext<?, ?>>} table MySqlTableContext that is not already a joined table.
     * @param {TableJoinMetadata<TTableModel>} leftData Metadata to specify for how the left table will join.
     * @param {TableJoinMetadata<TJoiningModel>} rightData Metadata to specify for how the right table will join.
     * @returns {MySqlJoinContext<TTableModel, TJoiningModel, TTableModel & Partial<TJoiningModel>>} A new MySqlJoinContext that has only query access.
     */
    leftJoin(table, leftData, rightData) {
        return new MySqlJoinContext(this, table, leftData, rightData, "LEFT");
    }

    /**
     * Joins this table with another table to yield all results of the other table, and any matching results of this table.
     * As of right now, you can only join on one condition.
     * @template {MySqlTableContext<?>} TJoiningTableContext The MySqlTableContext to join with
     * @template {ExtractModel<TJoiningTableContext>} [TJoiningModel=ExtractModel<TJoiningTableContext>]
     * @param {Exclude<TJoiningTableContext, MySqlJoinContext<?, ?>>} table MySqlTableContext that is not already a joined table.
     * @param {TableJoinMetadata<TTableModel>} leftData Metadata to specify for how the left table will join.
     * @param {TableJoinMetadata<TJoiningModel>} rightData Metadata to specify for how the right table will join.
     * @returns {MySqlJoinContext<TTableModel, TJoiningModel, Partial<TTableModel> & TJoiningModel>} A new MySqlJoinContext that has only query access.
     */
    rightJoin(table, leftData, rightData) {
        return new MySqlJoinContext(table, this, rightData, leftData, "RIGHT");
    }

    /**
     * Adds a listener event to the Connection Pool associated with this Table Context whenever ANY command is successfully executed on the pool.
     * @param {SuccessHandler} callback Function that executes when a command is sucessfully executed on this context.
     */
    onSuccess(callback) {
        this._pool.addListener(`${MySqlTableContext.EVENT_TABLE_CONTEXT_QUERY}-${this._table}`, callback);
        this._pool.addListener(`${MySqlTableContext.EVENT_TABLE_CONTEXT_INSERT}-${this._table}`, callback);
        this._pool.addListener(`${MySqlTableContext.EVENT_TABLE_CONTEXT_UPDATE}-${this._table}`, callback);
        this._pool.addListener(`${MySqlTableContext.EVENT_TABLE_CONTEXT_DELETE}-${this._table}`, callback);
    }

    /**
     * Adds a listener event to the Connection Pool associated with this Table Context whenever ANY command fails execution on the pool.
     * @param {FailHandler} callback Function that executes when a command has been executed and has failed on this context.
     */
    onFail(callback) {
        this._pool.addListener(`${MySqlTableContext.EVENT_TABLE_CONTEXT_QUERY_FAILED}-${this._table}`, callback);
        this._pool.addListener(`${MySqlTableContext.EVENT_TABLE_CONTEXT_INSERT_FAILED}-${this._table}`, callback);
        this._pool.addListener(`${MySqlTableContext.EVENT_TABLE_CONTEXT_UPDATE_FAILED}-${this._table}`, callback);
        this._pool.addListener(`${MySqlTableContext.EVENT_TABLE_CONTEXT_DELETE_FAILED}-${this._table}`, callback);
    }

    /**
     * Adds a listener event to the Connection Pool associated with this Table Context 
     * whenever a Query command is successfully executed on the pool.
     * @param {SuccessHandler} success Function that executes when a query command is executed on this context.
     */
    onQuerySuccess(success) {
        this._pool.addListener(`${MySqlTableContext.EVENT_TABLE_CONTEXT_QUERY}-${this._table}`, success);
    }

    /**
     * Adds a listener event to the Connection Pool associated with this Table Context 
     * whenever an Insert command is successfully executed on the pool.
     * @param {SuccessHandler} success Function that executes when an insert command is executed on this context.
     */
    onInsertSuccess(success) {
        this._pool.addListener(`${MySqlTableContext.EVENT_TABLE_CONTEXT_INSERT}-${this._table}`, success);
    }

    /**
     * Adds a listener event to the Connection Pool associated with this Table Context 
     * whenever an Update command is successfully executed on the pool.
     * @param {SuccessHandler} success Function that executes when an update command is executed on this context.
     */
    onUpdateSuccess(success) {
        this._pool.addListener(`${MySqlTableContext.EVENT_TABLE_CONTEXT_UPDATE}-${this._table}`, success);
    }

    /**
     * Adds a listener event to the Connection Pool associated with this Table Context 
     * whenever a Delete command is successfully executed on the pool.
     * @param {SuccessHandler} success Function that executes when a delete command is executed on this context.
     */
    onDeleteSuccess(success) {
        this._pool.addListener(`${MySqlTableContext.EVENT_TABLE_CONTEXT_DELETE}-${this._table}`, success);
    }

    /**
     * Adds a listener event to the Connection Pool associated with this Table Context 
     * whenever a Query command has been executed and has failed on the pool.
     * @param {FailHandler} fail Function that executes when a query command is fails execution on this context.
     */
    onQueryFail(fail) {
        this._pool.addListener(`${MySqlTableContext.EVENT_TABLE_CONTEXT_QUERY}-${this._table}`, fail);
    }

    /**
     * Adds a listener event to the Connection Pool associated with this Table Context 
     * whenever an Insert command has been executed and has failed on the pool.
     * @param {FailHandler} fail Function that executes when an insert command is fails execution on this context.
     */
    onInsertFail(fail) {
        this._pool.addListener(`${MySqlTableContext.EVENT_TABLE_CONTEXT_INSERT}-${this._table}`, fail);
    }

    /**
     * Adds a listener event to the Connection Pool associated with this Table Context 
     * whenever an Update command has been executed and has failed on the pool.
     * @param {FailHandler} fail Function that executes when an update command is fails execution on this context.
     */
    onUpdateFail(fail) {
        this._pool.addListener(`${MySqlTableContext.EVENT_TABLE_CONTEXT_UPDATE}-${this._table}`, fail);
    }

    /**
     * Adds a listener event to the Connection Pool associated with this Table Context 
     * whenever a Delete command has been executed and has failed on the pool.
     * @param {FailHandler} fail Function that executes when a delete command is fails execution on this context.
     */
    onDeleteFail(fail) {
        this._pool.addListener(`${MySqlTableContext.EVENT_TABLE_CONTEXT_DELETE}-${this._table}`, fail);
    }
}

/**
 * Object that holds context to a specific Table in your MySQL database. To ensure type-safety in vanilla JavaScript, use JSDOC typing.
 * @template {AbstractModel} TLeftTableModel model object that represents the left-side Table being joined.
 * @template {AbstractModel} TRightTableModel model object that represents the right-side Table being joined.
 * @template {AbstractModel} [TJoinedModel=TLeftTableModel & TRightTableModel]
 * @extends {MySqlTableContext<TJoinedModel>}
 */
export class MySqlJoinContext extends MySqlTableContext {
    /** @private @type {string} */ joinStatement;
    /** @private @type {string[]} */ columns = [];
    /** @private @type {MySqlTableContext<?>[]} */ tables = [];

    /** @protected @type {"INNER"|"LEFT"|"RIGHT"|"CROSS"} Type of JOIN being done on the tables in this context. */ joinType;

    /**
     * @param {MySqlTableContext<TLeftTableModel>} leftTable 
     * @param {Exclude<MySqlTableContext<TRightTableModel>, MySqlJoinContext<?, ?>>} rightTable 
     * @param {TableJoinMetadata<TLeftTableModel>} leftData
     * @param {TableJoinMetadata<TRightTableModel>} rightData
     * @param {"INNER"|"LEFT"|"RIGHT"|"CROSS"} joinType
     */
    constructor(leftTable, rightTable, leftData, rightData, joinType="INNER") {
        // @ts-ignore Ignoring as we need access to the tables protected variables that were passed in. (in other languages, this is allowed.)
        let pool = leftTable._pool;

        if (!("key" in leftData)) throw Error('You must provide a property for "key" pertaining to the key you want to join the tables on. (if the column you want to use is on a different table, then specify "name")');
        if (!("key" in rightData)) throw Error('You must provide a property for "key" pertaining to the key you want to join the tables on. (if the column you want to use is on a different table, then specify "name")');
        // @ts-ignore Ignoring as we need access to the tables protected variables that were passed in. (in other languages, this is allowed.)
        leftTable._joinKey = leftData.key, rightTable._joinKey = rightData.key;

        super(pool, "");
        this.joinType = joinType;
        if (leftTable instanceof MySqlJoinContext) {
            this.tables = [...leftTable.tables];
        } else {
            this.tables = [...this.tables, leftTable];
        }
        this.tables = [...this.tables, rightTable];

        let joinPart = "";
        for (let i = 0; i < this.tables.length - 1; ++i) {

            const left = this.tables[i];
            const right = this.tables[i+1];
            // @ts-ignore Ignoring as we need access to the tables protected variables that were passed in. (in other languages, this is allowed.)
            const leftName = left._table, rightName = right._table, leftJKey = left._joinKey, rightJKey = right._joinKey;
            if (i == 0) joinPart += `\`${leftName}\``;
            joinPart += ` ${left instanceof MySqlJoinContext ? left.joinType : this.joinType} JOIN \`${rightName}\` ON \`${leftData.name ?? leftName}\`.\`${String(leftJKey)}\` = \`${rightData.name ?? rightName}\`.\`${String(rightJKey)}\``;
        }
        this.joinStatement = joinPart;
        this.columns = this.tables.flatMap(t => {
            // @ts-ignore Ignoring as we need access to the tables protected variables that were passed in. (in other languages, this is allowed.)
            const tName = t._table;
            return [`\`${tName}\`.*`];
        });

        // Set the table name appropriately so the event listener has an appropriate name.
        // @ts-ignore Ignoring as we need access to the tables protected variables that were passed in. (in other languages, this is allowed.)
        this._table = this.tables.map(t => t._table).join('-join-');
    }

    /**
     * Gets the total number of records that are stored in the Table this context represents.
     * @param {WhereBuilderFunction<TJoinedModel>?} where Used to filter the results.
     * @param {(keyof TJoinedModel)[]?} distinct Builder function to help build a GROUP BY clause.
     * @returns {Promise<number>} Number specifying the total count of all records that were queried from this command.
     */
    async count(where = null, distinct = null) {
        const _where = where != null ? where(new WhereBuilder()) : new WhereBuilder();
        let cmd = `SELECT ${distinct != null ? `COUNT(DISTINCT ${distinct.join(',')}) AS count` : "COUNT(*) AS $count"} FROM ${this.joinStatement}${_where.toString()}`;
        const ts = await this._query(cmd, _where.getArgs());
        return ts[0]["$count"];
    }

    /**
     * Get a specific quantity of records from the Table this context represents.
     * @override
     * @param {number|string} limit Number of records to grab.
     * @param {number|string} offset Number specified to offset from the beginning.
     * @param {WhereBuilderFunction<TJoinedModel>?} where Builder function to help build a WHERE clause.
     * @param {GroupByBuilderFunction<TJoinedModel>?} groupBy Builder function to help build a GROUP BY clause.
     * @param {OrderByBuilderFunction<(TJoinedModel & GroupByAliases)>?} orderBy Builder function to help build an ORDER BY clause.
     * @param {(keyof (TJoinedModel & GroupByAliases))[]?} distinct List of column names under this TableContext to select distinctively off of.
     * @returns {Promise<(TJoinedModel & GroupByAliases)[]>} A list of TTableModel models. If a GROUP BY clause was built, then some extra aliases are added.
     */
    async get(limit, offset = 0, where = null, groupBy = null, orderBy = null, distinct = null) {
        const _where = where != null ? where(new WhereBuilder()) : new WhereBuilder();
        const _orderBy = orderBy != null ? orderBy(new OrderBuilder()) : new OrderBuilder();
        const _groupBy = groupBy != null ? groupBy(new GroupBuilder()) : new GroupBuilder();
        let cmd = `SELECT ${distinct != null ? `DISTINCT ${distinct.join(',')}` : _groupBy.getSelects() == "*" ? this.columns.join(',') : _groupBy.getSelects()} `
            + `FROM ${this.joinStatement}${_where.toString()}${_orderBy.toString()}${_groupBy.toString()} `
            + `${limit > 0 ? "LIMIT " + limit : ""} `
            + `${offset > 0 ? "OFFSET " + offset : ""}`;
        const ts = await this._query(cmd, _where.getArgs());
        return ts;
    }

    /**
     * Get a specific quantity of records from the Table this context represents.
     * @override
     * @param {WhereBuilderFunction<TJoinedModel>?} where Builder function to help build a WHERE clause.
     * @param {GroupByBuilderFunction<TJoinedModel>?} groupBy Builder function to help build a GROUP BY clause.
     * @param {OrderByBuilderFunction<(TJoinedModel & GroupByAliases)>?} orderBy Builder function to help build an ORDER BY clause.
     * @param {(keyof (TJoinedModel & GroupByAliases))[]?} distinct List of column names under this TableContext to select distinctively off of.
     * @returns {Promise<(TJoinedModel & GroupByAliases)[]>} A list of TTableModel models. If a GROUP BY clause was built, then some extra aliases are added.
     */
    async getAll(where = null, groupBy = null, orderBy = null, distinct = null) {
        const _where = where != null ? where(new WhereBuilder()) : new WhereBuilder();
        const _orderBy = orderBy != null ? orderBy(new OrderBuilder()) : new OrderBuilder();
        const _groupBy = groupBy != null ? groupBy(new GroupBuilder()) : new GroupBuilder();
        let cmd = `SELECT ${distinct != null ? `DISTINCT ${distinct.join(',')}` : _groupBy.getSelects() == "*" ? this.columns.join(',') : _groupBy.getSelects()} `
            + `FROM ${this.joinStatement}${_where.toString()}${_groupBy.toString()}${_orderBy.toString()} `;
        const ts = await this._query(cmd, _where.getArgs());
        return ts;
    }

    /**
     * Cannot be used on joined tables.
     * @param {any} record 
     * @returns {Promise<TJoinedModel>}
     */
    async insertOne(record) {
        throw Error('Cannot insert on joined tables.');
    }

    /**
     * Cannot be used on joined tables.
     * @param {any[]} records
     * @returns {Promise<TJoinedModel[]>}
     */
    async insertMany(records) {
        throw Error('Cannot insert on joined tables.');
    }

    /**
     * Cannot be used on joined tables.
     * @param {any} record
     * @param {any} where
     * @returns {Promise<number>}
     */
    async update(record, where = null) {
        throw Error('Cannot update on joined tables.');
    }

    /**
     * @param {Partial<TJoinedModel>} record
     * @returns {Promise<number>}
     */
    async updateAll(record) {
        throw Error('Cannot update on joined tables.')
    }

    /**
     * Cannot be used on joined tables.
     * @param {any} where
     * @returns {Promise<number>}
     */
    async delete(where = null) {
        throw Error('Cannot delete on joined tables.')
    }

    /**
     * Cannot be used on joined tables.
     * @returns {Promise<number>}
     */
    async truncate() {
        throw Error('Cannot truncate on joined tables.');
    }
}