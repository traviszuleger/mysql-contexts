//@ts-check
import { WhereBuilder, OrderBuilder, GroupBuilder } from './builders.js';
import { createPool } from "mysql2/promise";

/** @template T @template TK1 @template TK2 @typedef {import('../type-toolbelt.js').ReplaceKey<T, TK1, TK2>} ReplaceKey */

/**
 * Extracts the generic parameter, TTableModel, from the given TTable MySqlTableContext class object. 
 * @template {MySqlTableContext} TTable
 * @typedef {TTable extends MySqlTableContext<infer TTableModel> ? TTableModel : never} ExtractGeneric
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
 * @returns {OrderBuilder<TTableModel>} The OrderBuilder class object that was built.
 */

/**
 * Function template that accepts a GroupBuilder class object argument parameter and returns a WhereBuilder class object.
 * @template TTableModel Model that represents the Table where the WHERE clause is being built.
 * @callback GroupByBuilderFunction
 * @param {GroupBuilder<TTableModel>} group GroupBuilder class object that can be used to assist in building an ORDER BY clause.
 * @returns {GroupBuilder<TTableModel>} The GroupBuilder class object that was built.
 */

/**
 * @typedef {Object} TableContextOptions
 * @property {boolean=} allowUpdateOnAll
 * @property {boolean=} allowTruncation
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
 * @param {import('mysql2').QueryError} error Error thrown by mysql2
 * @param {string} dateIso Date in ISO string format
 * @param {string} host Host of the MySQL server
 * @param {string} schema Schema of database and table in format of [database].[dbo].[table]
 * @param {string} cmdRaw Command in its raw format, including arguments.
 * @param {string} cmdSanitized Command in its sanitized format.
 * @param {any[]} args Arguments that were passed in with the sanitized format.
 */

/**
 * Object that holds context to a specific Table in your MySQL database. To ensure type-safety in vanilla JavaScript, use JSDOC typing.
 * @template {{[key: string]: any}} TTableModel Model that represents the Table this Context represents.
 * Auto Increment Primary Key name that is represented in the definition of the Primary Key in the table this context represents.
 */
export class MySqlTableContext {
    /** @readonly @type {'table-context-connected'} Event fired when the Table Context connects. */
    static EVENT_TABLE_CONTEXT_CONNECTED = 'table-context-connected';
    /** @readonly @type {'table-context-query'} Event fired when the Table Context queries. */
    static EVENT_TABLE_CONTEXT_QUERY = 'table-context-query';
    /** @readonly @type {'table-context-query-failed'} Event fired when the Table Context inserts. */
    static EVENT_TABLE_CONTEXT_QUERY_FAILED = 'table-context-query-failed';
    /** @readonly @type {'table-context-insert'} Event fired when the Table Context inserts. */
    static EVENT_TABLE_CONTEXT_INSERT = 'table-context-insert';
    /** @readonly @type {'table-context-insert-failed'} Event fired when the Table Context inserts. */
    static EVENT_TABLE_CONTEXT_INSERT_FAILED = 'table-context-insert-failed';
    /** @readonly @type {'table-context-update'} Event fired when the Table Context updates. */
    static EVENT_TABLE_CONTEXT_UPDATE = 'table-context-update';
    /** @readonly @type {'table-context-update-failed'} Event fired when the Table Context inserts. */
    static EVENT_TABLE_CONTEXT_UPDATE_FAILED = 'table-context-update-failed';
    /** @readonly @type {'table-context-delete'} Event fired when the Table Context deletes. */
    static EVENT_TABLE_CONTEXT_DELETE = 'table-context-delete';
    /** @readonly @type {'table-context-delete-failed'} Event fired when the Table Context inserts. */
    static EVENT_TABLE_CONTEXT_DELETE_FAILED = 'table-context-delete-failed';

    /** @protected @type {import('mysql2/promise').Pool} */_pool;
    /** @protected @type {string} */ _table;
    /** @protected @type {keyof TTableModel|null} */ _pKey;
    /** @protected @type {import('mysql2/promise').Connection} */ _cnn;
    /** @protected @type {Promise<import('mysql2/promise').Connection>} */ _cnnPromise;
    /** @protected @type {TableContextOptions} */ _options;
    /** @protected @type {keyof TTableModel|null} */ _joinKey;

    /**
     * Creates a Connection Pool ready for use inside of multiple MySqlTableContext objects.
     * @param {import('mysql2/promise').PoolOptions} config Configuration to create the pool on.
     * @returns {import('mysql2/promise').Pool} Connection Pool.
     */
    static createPool(config) {
        return createPool({ ...config, decimalNumbers: true, bigNumberStrings: true, connectionLimit: 20 });
    }

    /**
     * Creates a new MySQL table context given the mysql2 config options. The user may also pass in an existing "Pool" object too, 
     * which allows this context to work alongside other contexts.
     * @param {import('mysql2/promise').PoolOptions|import('mysql2/promise').Pool} configOrPool MySql2 config options to create a Pool object with or an existing Pool.
     * @param {string} table Name of the Table this context is connecting to.
     * @param {keyof TTableModel|null} aiKey Primary key of the table that auto increments. If there is none, then leave null.
     * @param {TableContextOptions} options Context options that enable certain features.
     */
    constructor(configOrPool, table, aiKey=null, options = {}) {
        this._table = table;
        this._pKey = aiKey;
        if ('query' in configOrPool) {
            this._pool = configOrPool
        } else {
            this._pool = createPool({ ...configOrPool, decimalNumbers: true, bigNumberStrings: true, connectionLimit: 20 });
        }
        this._cnnPromise = this._pool.getConnection();
        this._cnnPromise.then(cnn => {
            this._cnn = cnn;
            this._pool.emit(MySqlTableContext.EVENT_TABLE_CONTEXT_CONNECTED, new Date().toISOString(), this._cnn.config.host, `[${this._cnn.config.database}].[dbo].[${this._table}]`);
        });
        this._options = options;
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
            this._pool.emit(MySqlTableContext.EVENT_TABLE_CONTEXT_QUERY, new Date().toISOString(), this._cnn.config.host, `[${this._cnn.config.database}].[dbo].[${this._table}]`, cmdRaw, cmd, args);
            const [result] = await this._pool.query(cmd, args);
            return /** @type {TTableModel[]} */ (result);
        } catch(err) {
            this._pool.emit(MySqlTableContext.EVENT_TABLE_CONTEXT_QUERY_FAILED, err, new Date().toISOString(), this._cnn.config.host, `[${this._cnn.config.database}].[dbo].[${this._table}]`, cmdRaw, cmd, args)
        }
        return [];
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
            args?.forEach(a => cmdRaw = cmdRaw.replace('?', a));
            this._pool.emit(MySqlTableContext.EVENT_TABLE_CONTEXT_INSERT, new Date().toISOString(), this._cnn.config.host, `[${this._cnn.config.database}].[dbo].[${this._table}]`, cmdRaw, cmd, args);
            const [result] = /** @type {import('mysql2').ResultSetHeader[]} */ (await this._pool.execute(cmd, args));
            return Array.from(Array(result.affectedRows).keys()).map((_,n) => n + result.insertId);
        } catch(err) {
            this._pool.emit(MySqlTableContext.EVENT_TABLE_CONTEXT_INSERT_FAILED, err, new Date().toISOString(), this._cnn.config.host, `[${this._cnn.config.database}].[dbo].[${this._table}]`, cmdRaw, cmd, args);
        }
        return [];
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
            args?.forEach(a => cmdRaw = cmdRaw.replace('?', a));
            this._pool.emit(MySqlTableContext.EVENT_TABLE_CONTEXT_UPDATE, new Date().toISOString(), this._cnn.config.host, `[${this._cnn.config.database}].[dbo].[${this._table}]`, cmdRaw, cmd, args);
            const result = /** @type {import('mysql2').ResultSetHeader} */ ((await this._pool.execute(cmd, args))[0]);
            return result.affectedRows;
        } catch(err) {
            this._pool.emit(MySqlTableContext.EVENT_TABLE_CONTEXT_UPDATE_FAILED, err, new Date().toISOString(), this._cnn.config.host, `[${this._cnn.config.database}].[dbo].[${this._table}]`, cmdRaw, cmd, args);
        }
        return 0;
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
            args?.forEach(a => cmdRaw = cmdRaw.replace('?', a));
            this._pool.emit(MySqlTableContext.EVENT_TABLE_CONTEXT_DELETE, new Date().toISOString(), this._cnn.config.host, `[${this._cnn.config.database}].[dbo].[${this._table}]`, cmdRaw, cmd, args);
            const result = /** @type {import('mysql2').ResultSetHeader} */ ((await this._pool.execute(cmd, args))[0]);
            return result.affectedRows;
        } catch(err) {
            this._pool.emit(MySqlTableContext.EVENT_TABLE_CONTEXT_DELETE_FAILED, err, new Date().toISOString(), this._cnn.config.host, `[${this._cnn.config.database}].[dbo].[${this._table}]`, cmdRaw, cmd, args)
        }
        return 0;
    }

    /**
     * Gets the total number of records that are stored in the Table this context represents.
     * @param {WhereBuilderFunction<TTableModel>?} where Used to filter the results.
     * @param {(keyof TTableModel)[]?} distinct Builder function to help build a GROUP BY clause.
     * @returns {Promise<number>} Number specifying the total count of all records that were queried from this command.
     */
    async count(where = null, distinct = null) {
        const _where = where != null ? where(new WhereBuilder()) : new WhereBuilder();
        let cmd = `SELECT ${distinct != null ? `COUNT(DISTINCT ${distinct.join(',')}) AS count` : "COUNT(*) AS count"} FROM ${this._table}${_where.toString()}`;
        const ts = await this._query(cmd, _where.getArgs());
        return ts[0]["count"];
    }

    /**
     * Get a specific quantity of records from the Table this context represents.
     * @param {number|string} limit Number of records to grab.
     * @param {number|string} offset Number specified to offset from the beginning.
     * @param {WhereBuilderFunction<TTableModel>?} where Builder function to help build a WHERE clause.
     * @param {OrderByBuilderFunction<TTableModel>?} orderBy Builder function to help build an ORDER BY clause.
     * @param {GroupByBuilderFunction<TTableModel>?} groupBy Builder function to help build a GROUP BY clause.
     * @param {(keyof TTableModel)[]?} distinct List of column names under this TableContext to select distinctively off of.
     * @returns {Promise<(TTableModel & Partial<import('./builders.js').GroupByAliases>)[]>} A list of TTableModel models. If a GROUP BY clause was built, then some extra aliases are added.
     */
    async get(limit, offset = 0, where = null, orderBy = null, groupBy = null, distinct = null) {
        const _where = where != null ? where(new WhereBuilder()) : new WhereBuilder();
        const _orderBy = orderBy != null ? orderBy(new OrderBuilder()) : new OrderBuilder();
        const _groupBy = groupBy != null ? groupBy(new GroupBuilder()) : new GroupBuilder();
        let cmd = `SELECT ${distinct != null ? `DISTINCT ${distinct.join(',')}` : _groupBy.getSelects()} `
            + `FROM ${this._table}${_where.toString()}${_orderBy.toString()}${_groupBy.toString()} `
            + `${limit > 0 ? "LIMIT " + limit : ""} `
            + `${offset > 0 ? "OFFSET " + offset : ""}`;
        const ts = await this._query(cmd, _where.getArgs());
        return ts;
    }

    /**
     * Get all records from the Table this context represents.
     * @param {WhereBuilderFunction<TTableModel>?} where Builder function to help build a WHERE clause.
     * @param {OrderByBuilderFunction<TTableModel>?} orderBy Builder function to help build an ORDER BY clause.
     * @param {GroupByBuilderFunction<TTableModel>?} groupBy Builder function to help build a GROUP BY clause.
     * @param {(keyof TTableModel)[]?} distinct List of column names under this TableContext to select distinctively off of.
     * @returns {Promise<(TTableModel & Partial<import('./builders.js').GroupByAliases>)[]>} 
    */
    async getAll(where = null, orderBy = null, groupBy = null, distinct = null) {
        const _where = where != null ? where(new WhereBuilder()) : new WhereBuilder();
        const _orderBy = orderBy != null ? orderBy(new OrderBuilder()) : new OrderBuilder();
        const _groupBy = groupBy != null ? groupBy(new GroupBuilder()) : new GroupBuilder();
        let cmd = `SELECT ${distinct != null ? `DISTINCT ${distinct.join(',')}` : _groupBy.getSelects()} `
            + `FROM ${this._table}${_where.toString()}${_orderBy.toString()}${_groupBy.toString()} `;
        const ts = await this._query(cmd, _where.getArgs());
        // @ts-ignore Ignoring because I think it works.
        return ts;
    }

    /**
     * Insert a single TTableModel model object into the Table this context represents. 
     * @param {Partial<TTableModel>} record A list of TTableModel model objects to insert into the Table.
     * @returns {Promise<TTableModel>} TTableModel model object that was inserted.
     * If an Auto Increment Primary Key was specified, the Insert ID will be updated.
     */
    async insertOne(record) {
        return (await this.insertMany([record]))[0];
    }

    /**
     * Insert a multiple TTableModel model objects into the Table this context represents. 
     * If an Auto Increment Primary Key was specified, then the TTableModel passed should not include the Primary Key.
     * @param {Partial<TTableModel>[]} records A list of TTableModel model objects to insert into the Table.
     * @returns {Promise<TTableModel[]>} List of the TTableModel model objects that were inserted. 
     * If an Auto Increment Primary Key was specified, the Insert ID for each object will be updated appropriately.
     */
    async insertMany(records) {
        if(this._pKey != null) {
            records.forEach(r => {
                // @ts-ignore
                delete r[this._pKey];
            })
        }
        if (!Array.isArray(records) || records.length <= 0) return [];
        /** @type {Partial<TTableModel>[]} */
        const itemsFiltered = JSON.parse(JSON.stringify(records));
        itemsFiltered.forEach(i => delete i.Id);
        const itemsKeysFiltered = Object.keys(itemsFiltered[0]);
        const cols = itemsKeysFiltered.join(', ');
        const vals = records.map(i => `(${Object.keys(i).map(key => key != this._pKey ? "?" : "").filter(s => s != "").join(', ')})`).join(', ');
        const cmd = `INSERT INTO ${this._table} (${cols}) VALUES ${vals}`;
        // Map "items" so their Id reflects the database.
        const insertIds = await this._insert(cmd, itemsFiltered.flatMap(i => Object.values(i)));
        if(this._pKey != null) {
            return records.map((rec,n) => {
                //@ts-ignore
                rec[this._pKey] = insertIds[n];
                return /** @type {TTableModel} */ ( /** @type {unknown} */ (rec));
            });
        }
        return /** @type {TTableModel[]} */ ( /** @type {unknown} */ (records));
    }

    /**
     * Update many existing TTableModel model objects in the Table this context represents.
     * @param {Partial<TTableModel>} record List of TTableModel model objects to insert into the Table.
     * @param {WhereBuilderFunction<TTableModel>?} where Builder function to help build a WHERE clause.
     * @returns {Promise<number>} Number of affected rows.
     */
    async update(record, where = null) {
        if (Object.keys(record).length <= 0) throw Error('The record passed has no keys to represent the column(s) to update.');
        const _where = where != null ? where(new WhereBuilder()) : new WhereBuilder();

        if (_where.getArgs().length <= 0 && this._pKey == null) {
            throw Error('No WHERE clause was built, possibly resulting in all records in the table being updated.'
                + 'If you are sure you know what you are doing, then use the "truncate" function.');
        }

        if (where === null) {
            // @ts-ignore
            _where.isIn(this._pKey, itemsFiltered.map(i => i.Id));
        }
        const sets = Object.keys(record).map(key => key == this._pKey ? "" : `${key}=?`).filter(x => x != "").join(', ');
        const cmd = `UPDATE ${this._table} SET ${sets}${_where.toString()}`;

        // Delete the Ids so they don't get updated.
        if(this._pKey != null) {
            delete record[this._pKey];
        }
        const numRowsAffected = this._update(cmd, [...Object.values(record), ..._where.getArgs()]);
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
            throw Error('You are trying to update all records in the table with no filter. '
                + 'If you are trying to update select records, see "updateMany". '
                + 'If you know what you are doing, then pass into the "options" parameter in the constructor, "allowUpdateOnAll: true"');
        }
        const items = [record];
        const itemsFiltered = items.filter(i => Object.keys(i).length > 0);
        const sets = itemsFiltered.map(i => `${Object.keys(i).map(key => key == this._pKey ? "" : `${key}=?`).filter(x => x != "").join(', ')}`).join(', ');
        const cmd = `UPDATE ${this._table} SET ${sets}`;
        const numRowsAffected = this._update(cmd, [...itemsFiltered.flatMap(i => Object.values(i))]);
        return numRowsAffected;
    }

    /**
     * Delete many records from the table this context represents.
     * @param {WhereBuilderFunction<TTableModel>?} where Builder function to help build a WHERE clause.
     * @returns {Promise<number>} Number of deleted rows.
     */
    async delete(where = null) {
        const _where = where != null ? where(new WhereBuilder()) : new WhereBuilder();
        if (_where.getArgs().length <= 0) {
            throw Error('No WHERE clause was built, possibly resulting in all records in the table being deleted.'
                + 'If you are sure you know what you are doing, then use the "truncate" function.');
        }
        const cmd = `DELETE FROM ${this._table}${_where.toString()}`;
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
        if (!this._options.allowUpdateOnAll) {
            throw Error('You are trying to delete all records in the table. '
                + 'If you are trying to delete select records, see "deleteMany". '
                + 'If you know what you are doing, then pass into the "options" parameter in the constructor, "allowTruncation: true"');
        }
        const cmd = `TRUNCATE ${this._table}`;
        const ts = await this._delete(cmd);
        return ts;
    }

    /**
     * @this {MySqlTableContext<TTableModel>}
     * @template {MySqlTableContext} TJoiningTableContext
     * @template {ExtractGeneric<TJoiningTableContext>} TJoiningModel
     * @param {Exclude<TJoiningTableContext, MySqlJoinContext>} table
     * @param {{name?: string, key: string}} leftData
     * @param {{name?: string, key: string}} rightData
     * @returns {MySqlJoinContext<TTableModel, TJoiningModel>}
     */
    join(table, leftData, rightData) {
        return new MySqlJoinContext(this, table, leftData, rightData);
    }

    /**
     * @this {MySqlTableContext<TTableModel>}
     * @template {MySqlTableContext} TJoiningTableContext
     * @template {ExtractGeneric<TJoiningTableContext>} TJoiningModel
     * @param {Exclude<TJoiningTableContext, MySqlJoinContext>} table
     * @param {{name?: string, key: string}} leftData
     * @param {{name?: string, key: string}} rightData
     * @returns {MySqlLeftJoinContext<TTableModel, TJoiningModel>}
     */
    leftJoin(table, leftData, rightData) {
        return new MySqlLeftJoinContext(this, table, leftData, rightData);
    }

    /**
     * Adds a listener event to the Connection Pool associated with this Table Context whenever a new connection is opened on the pool.
     * This Event Listener will be triggered by all TableContexts that use this Pool.
     * @param {OnConnectHandler} handler Function that executes when a connection is made to this context.
     */
    onConnect(handler) {
        this._pool.addListener(MySqlTableContext.EVENT_TABLE_CONTEXT_CONNECTED, handler);
    }

    /**
     * Adds a listener event to the Connection Pool associated with this Table Context whenever a Query command is executed on the pool.
     * This Event Listener will be triggered by all TableContexts that use this Pool.
     * @param {CommandHandler} handler Function that executes when a query command is executed on this context.
     * @param {CommandFailedHandler=} failHandler Function that executes when a query command failed execution on this context.
     */
    onQuery(handler, failHandler = undefined) {
        if (failHandler) {
            this._pool.addListener(MySqlTableContext.EVENT_TABLE_CONTEXT_QUERY_FAILED, failHandler);
        }
        this._pool.addListener(MySqlTableContext.EVENT_TABLE_CONTEXT_QUERY, handler);
    }

    /**
     * Adds a listener event to the Connection Pool associated with this Table Context whenever an Insert command is executed on the pool.
     * This Event Listener will be triggered by all TableContexts that use this Pool.
     * @param {CommandHandler} handler Function that executes when an insert command is executed on this context.
     * @param {CommandFailedHandler=} failHandler Function that executes when an insert command failed execution on this context.
     */
    onInsert(handler, failHandler = undefined) {
        if (failHandler) {
            this._pool.addListener(MySqlTableContext.EVENT_TABLE_CONTEXT_INSERT_FAILED, failHandler);
        }
        this._pool.addListener(MySqlTableContext.EVENT_TABLE_CONTEXT_INSERT, handler);
    }

    /**
     * Adds a listener event to the Connection Pool associated with this Table Context whenever an Update command is executed on the pool.
     * This Event Listener will be triggered by all TableContexts that use this Pool.
     * @param {CommandHandler} handler Function that executes when an update command is executed on this context.
     * @param {CommandFailedHandler=} failHandler Function that executes when an update command failed execution on this context.
     */
    onUpdate(handler, failHandler = undefined) {
        if (failHandler) {
            this._pool.addListener(MySqlTableContext.EVENT_TABLE_CONTEXT_UPDATE_FAILED, failHandler);
        }
        this._pool.addListener(MySqlTableContext.EVENT_TABLE_CONTEXT_UPDATE, handler);
    }

    /**
     * Adds a listener event to the Connection Pool associated with this Table Context whenever a Delete command is executed on the pool.
     * This Event Listener will be triggered by all TableContexts that use this Pool.
     * @param {CommandHandler} handler Function that executes when a delete command is executed on this context.
     * @param {CommandFailedHandler=} failHandler Function that executes when a delete command failed execution on this context.
     */
    onDelete(handler, failHandler = undefined) {
        if(failHandler) {
            this._pool.addListener(MySqlTableContext.EVENT_TABLE_CONTEXT_DELETE_FAILED, failHandler);
        }
        this._pool.addListener(MySqlTableContext.EVENT_TABLE_CONTEXT_DELETE, handler);
    }
}

/**
 * @template {{[key: string]: any}} TLeftTableModel
 * @template {{[key: string]: any}} TRightTableModel
 * @template {Partial<TLeftTableModel> & Partial<TRightTableModel>} [TJoinedModel=TLeftTableModel & TRightTableModel]
 * @extends {MySqlTableContext<TJoinedModel>}
 */
export class MySqlJoinContext extends MySqlTableContext {
    /** @private @type {string[]} */ columns = [];
    /** @private @type {MySqlTableContext<?>[]} */ tables = [];
    /** @protected @type {"JOIN"|"LEFT JOIN"|"RIGHT JOIN"|"OUTER JOIN"} */ joinType;

    /**
     * @param {MySqlTableContext<TLeftTableModel>} leftTable 
     * @param {Exclude<MySqlTableContext<TRightTableModel>, MySqlJoinContext>} rightTable 
     * @param {{name?: string, key: keyof TLeftTableModel}} leftData
     * @param {{name?: string, key: keyof TRightTableModel}} rightData
     * @param {"JOIN"|"LEFT JOIN"|"RIGHT JOIN"|"OUTER JOIN"} joinType
     */
    constructor(leftTable, rightTable, leftData, rightData, joinType="JOIN") {
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
            if (i == 0) joinPart += leftName;
            joinPart += ` ${left instanceof MySqlJoinContext ? left.joinType : this.joinType} ${rightName} ON ${leftData.name ?? leftName}.${String(leftJKey)} = ${rightData.name ?? rightName}.${String(rightJKey)}`;
        }
        this._table = joinPart;
        this.columns = this.tables.flatMap(t => {
            // @ts-ignore Ignoring as we need access to the tables protected variables that were passed in. (in other languages, this is allowed.)
            const pKey = String(t._pKey), tName = t._table;
            if (pKey != null && !(t instanceof MySqlLeftJoinContext)) {
                return [`${tName}.${pKey} AS ${this._augmentField(tName,pKey)}__`, `${tName}.*`];
            }
            return [];
        });
    }

    /**
     * @template {string} TString1
     * @template {string} TString2
     * @typedef {`__${TString1}_${TString2}__`} AugmentString
     */

    /**
     * @template {string} TTableName
     * @template {string} TColumnName
     * @param {TTableName} tableName 
     * @param {TColumnName} columnName 
     * @returns {AugmentString<TTableName, TColumnName>}
     */
    _augmentField(tableName, columnName) {
        return `__${tableName}_${columnName}__`
    }

    /**
     * Get a specific quantity of records from the Table this context represents.
     * @override
     * @param {number|string} limit Number of records to grab.
     * @param {number|string} offset Number specified to offset from the beginning.
     * @param {WhereBuilderFunction<TJoinedModel>?} where Builder function to help build a WHERE clause.
     * @param {OrderByBuilderFunction<TJoinedModel>?} orderBy Builder function to help build an ORDER BY clause.
     * @param {GroupByBuilderFunction<TJoinedModel>?} groupBy Builder function to help build a GROUP BY clause.
     * @param {(keyof TJoinedModel)[]?} distinct List of column names under this TableContext to select distinctively off of.
     * @returns {Promise<(TJoinedModel & Partial<import('./builders.js').GroupByAliases>)[]>} A list of TTableModel models. If a GROUP BY clause was built, then some extra aliases are added.
     */
    async get(limit, offset = 0, where = null, orderBy = null, groupBy = null, distinct = null) {
        const _where = where != null ? where(new WhereBuilder()) : new WhereBuilder();
        const _orderBy = orderBy != null ? orderBy(new OrderBuilder()) : new OrderBuilder();
        const _groupBy = groupBy != null ? groupBy(new GroupBuilder()) : new GroupBuilder();
        let cmd = `SELECT ${distinct != null ? `DISTINCT ${distinct.join(',')}` : _groupBy.getSelects() == "*" ? this.columns.join(',') : _groupBy.getSelects()} `
            + `FROM ${this._table}${_where.toString()}${_orderBy.toString()}${_groupBy.toString()} `
            + `${limit > 0 ? "LIMIT " + limit : ""} `
            + `${offset > 0 ? "OFFSET " + offset : ""}`;
        const ts = await this._query(cmd, _where.getArgs());
        return ts;
    }

    /**
     * Get a specific quantity of records from the Table this context represents.
     * @override
     * @param {WhereBuilderFunction<TJoinedModel>?} where Builder function to help build a WHERE clause.
     * @param {OrderByBuilderFunction<TJoinedModel>?} orderBy Builder function to help build an ORDER BY clause.
     * @param {GroupByBuilderFunction<TJoinedModel>?} groupBy Builder function to help build a GROUP BY clause.
     * @param {(keyof TJoinedModel)[]?} distinct List of column names under this TableContext to select distinctively off of.
     * @returns {Promise<(TJoinedModel & Partial<import('./builders.js').GroupByAliases>)[]>} A list of TTableModel models. If a GROUP BY clause was built, then some extra aliases are added.
     */
    async getAll(where = null, orderBy = null, groupBy = null, distinct = null) {
        const _where = where != null ? where(new WhereBuilder()) : new WhereBuilder();
        const _orderBy = orderBy != null ? orderBy(new OrderBuilder()) : new OrderBuilder();
        const _groupBy = groupBy != null ? groupBy(new GroupBuilder()) : new GroupBuilder();
        let cmd = `SELECT ${distinct != null ? `DISTINCT ${distinct.join(',')}` : _groupBy.getSelects() == "*" ? this.columns.join(',') : _groupBy.getSelects()} `
            + `FROM ${this._table}${_where.toString()}${_orderBy.toString()}${_groupBy.toString()} `;
        const ts = await this._query(cmd, _where.getArgs());
        // @ts-ignore Ignoring because I think it works.
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

/**
 * @template {{[key: string]: any}} TLeftTableModel
 * @template {{[key: string]: any}} TRightTableModel
 * @template {TLeftTableModel & Partial<TRightTableModel>} [TJoinedModel=TLeftTableModel & Partial<TRightTableModel>]
 * @extends {MySqlJoinContext<TLeftTableModel, TRightTableModel, TJoinedModel>}
 */
export class MySqlLeftJoinContext extends MySqlJoinContext {
    /** @protected @type {"JOIN"|"LEFT JOIN"|"RIGHT JOIN"|"OUTER JOIN"} */ joinType;

    /**
     * @param {MySqlTableContext<TLeftTableModel>} leftTable 
     * @param {MySqlTableContext<TRightTableModel>} rightTable 
     * @param {{name?: string, key: keyof TLeftTableModel}} leftData
     * @param {{name?: string, key: keyof TRightTableModel}} rightData
     */
    constructor(leftTable, rightTable, leftData, rightData) {
        super(leftTable, rightTable, leftData, rightData, "LEFT JOIN");
    }
}


/**
 * Creates a new AliasMap where the Key can be any string but the value to that key must be a key of TModel
 * @template TModel @typedef {{[Key in keyof TModel as TModel[Key] extends string ? TModel[Key] : never]: keyof TModel}} AliasMap
 */

/**
 * Gets all Value Types of TModel
 * @template TModel @typedef {TModel[keyof TModel]} ValueTypesOf
 */

/**
 * Gets the Value Type of TModel given a keyof TModel, TModelKey
 * @template TModel 
 * @template {keyof TModel} [TModelKey=keyof TModel]
 * @typedef {TModel[TModelKey]} ValueTypeOf
 */

/**
 * Used in "Narrow" to recursively dig into arrays/objects and narrow them down to their literal type.
 * @template T Type to narrow down
 * @typedef {(T extends [] ? [] : never)|(Try<T, (string|number|bigint|boolean)>)|({[K in keyof T]: Try<T[K], Function, NarrowRaw<T[K]>>})} NarrowRaw
 */

/**
 * Explicitly checks to see if TTypeToCheck is of type TTypeToForce. If it is, then it returns TTypeToCheck, otherwise it returns Catch.
 * @template TTypeToCheck Type to check for
 * @template TTypeToForce Type to check against
 * @template {any} [Catch=never] Type to return if the type check fails
 * @typedef {TTypeToCheck extends TTypeToForce ? TTypeToCheck : Catch} Try
 */

/**
 * Prevents widening on an generic parameter.
 * @template T Type to narrow
 * @typedef {Try<T, [], NarrowRaw<T>>} Narrow
 */

/**
 * Create a Type that represents an Alias of TModel with different keys but with the same value types of TModel, depending on the aliased keys from TAliasMap.
 * @template TModel
 * @template {Narrow<AliasMap<TModel>>} TAliasMap
 * @typedef {{[TModelKey in keyof TAliasMap]: ValueTypeOf<TModel, Try<TAliasMap[TModelKey], keyof TModel>>}} Alias
 */