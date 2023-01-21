//@ts-check
/** @typedef {{ count: number|undefined, yearDay: string, yearWeek: string, yearMonth: string, year: string }} GroupByAliases  */

/** @template T @template K @typedef {import('./type-toolbelt').KeyByValueType<T,K>} KeyByValueType */
/**
 * Class used to help build WHERE conditionals on SQL statements using mysql2 library.
 * @template TTableModel Type representing the Table as it appears in the database.
 */
export class WhereBuilder {
    /** @private @type {string} */
    _filter = "";
    /** @private @type {(TTableModel[keyof TTableModel])[]} */
    _args = [];
    /** @private @type {boolean} */
    _not = false;

    /** Creates a new WhereBuilder */
    constructor() {
        
    }

    /**
     * Sets a flag so the next condition added is negated.
     * @returns {WhereBuilder<TTableModel>} The WhereBuilder in its most recent state.
     */
    not() {
        this._not = true;
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is equal to the value specified. 
     * If a condition already exists, then " AND {colName} = {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    equals(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(String(colName) + " = ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is not equal to the value specified. 
     * If a condition already exists, then " AND {colName} <> {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    notEquals(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(String(colName) + " <> ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is less than the value specified. 
     * If a condition already exists, then " AND {colName} < {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    lessThan(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(String(colName) + " < ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is less than or equal to the value specified. 
     * If a condition already exists, then " AND {colName} <= {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    lessThanOrEqualTo(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(String(colName) + " <= ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is greater than the value specified. 
     * If a condition already exists, then " AND {colName} > {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    greaterThan(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(String(colName) + " > ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is greater than or equal to the value specified. 
     * If a condition already exists, then " AND {colName} >= {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    greaterThanOrEqualTo(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(String(colName) + " >= ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is one of the values specified. 
     * If a condition already exists, then " AND {colName} IN ({vals[0]}[,...{vals[n]}]" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn][]} vals Array of values respective to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    isIn(colName, vals, where = undefined) {
        if (!colName || !vals || vals.length <= 0) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`${String(colName)} IN (${Array(vals.length).fill('?').join(', ')})`))}`;
        this._args = [...this._args, ...vals, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is NULL.
     * If a condition already exists, then " AND {colName} = NULL" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    isNull(colName, where = undefined) {
        if (!colName) return this;
        const { nest } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(String(colName) + " = NULL"))}`;
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is equal to the value specified. 
     * If a condition does not already exist, then " WHERE {colName} = {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    andEquals(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(String(colName) + " = ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is not equal to the value specified. 
     * If a condition does not already exist, then " WHERE {colName} <> {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    andNotEquals(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(String(colName) + " <> ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * 
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    andLessThan(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(String(colName) + " < ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * 
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    andLessThanOrEqualTo(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(String(colName) + " <= ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * 
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    andGreaterThan(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(String(colName) + " > ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * 
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    andGreaterThanOrEqualTo(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(String(colName) + " >= ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * 
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn][]} vals Array of values respective to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    andIn(colName, vals, where = undefined) {
        if (!colName || !vals || vals.length <= 0) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`${String(colName)} IN (${Array(vals.length).fill('?').join(', ')})`))}`;
        this._args = [...this._args, ...vals, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is NULL.
     * If a condition already exists, then " AND {colName} = NULL" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    andIsNull(colName, where = undefined) {
        if (!colName) return this;
        const { nest } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(String(colName) + " = NULL"))}`;
        return this;
    }

    /**
     * 
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orEquals(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(String(colName) + " = ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orNotEquals(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(String(colName) + " <> ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * 
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orLessThan(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(String(colName) + " < ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * 
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orLessThanOrEqualTo(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(String(colName) + " <= ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * 
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orGreaterThan(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(String(colName) + " > ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * 
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orGreaterThanOrEqualTo(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(String(colName) + " >= ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * 
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn][]} vals Array of values respective to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orIn(colName, vals, where = undefined) {
        const { nest, builder } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(`${String(colName)} IN (${Array(vals.length).fill('?').join(', ')})`))}`;
        this._args = [...this._args, ...vals, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is NULL.
     * If a condition already exists, then " AND {colName} = NULL" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orIsNull(colName, where = undefined) {
        if (!colName) return this;
        const { nest } = this._buildNest(where);
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(String(colName) + " = NULL"))}`;
        return this;
    }

    /**
     * Returns the WHERE clause to be appended to the command. This clause is sanitized.
     * @returns {string}
     */
    toString() {
        return this._filter;
    }

    /**
     * Returns the arguments that belong to the WHERE clause. This is required as the WHERE clause is sanitized.
     * @returns {TTableModel[keyof TTableModel][]}
     */
    getArgs() {
        return this._args;
    }

    /**
     * Resets this builder so it can be used again.
     * @returns {WhereBuilder<TTableModel>}
     */
    reset() {
        this._filter = "";
        this._args = [];
        return this;
    }

    /**
     * Negates the specified condition if the _not flag is true.
     * @private Used to create negated conditionals if the not() function was called before the condition was added.
     * @param {string} cond String condition that is being added to the command. 
     * @returns {string} Condition either 
     */
    _negate(cond) {
        if (this._not) {
            cond = `NOT (${cond})`;
            this._not = false;
        }
        return cond;
    }

    /**
     * Builds a nested conditional.
     * @private Used to build nested conditionals
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition. 
     * @returns {{nest: (s: string) => string, builder: WhereBuilder<TTableModel>}} Object that contains string to help nesting and builder that was used for nested conditions.
     */
    _buildNest(where = undefined) {
        /** @type {(s: string) => string} */
        let nest = s => s;
        let builder = new WhereBuilder();
        if (where != undefined) {
            builder.equals("_", 0);
            nest = s => `(${s}${where(builder).toString().replace(" WHERE _ = ?", "")})`;
            builder._args.shift();
        }
        return { nest, builder }
    }
}

/**
 * @template T
 */
export class OrderBuilder {
    /** @private @type {string} */
    _filter = "";

    constructor() { }

    /**
     * 
     * @param {keyof T} tKey 
     */
    by(tKey) {
        this._filter += " ORDER BY " + String(tKey);
        return {
            asc: () => {
                this._filter += " ASC";
                return this;
            },
            desc: () => {
                this._filter += " DESC";
                return this;
            }
        }
    }

    toString() {
        return this._filter;
    }
}

/**
 * @template T
 */
export class GroupBuilder {
    /** @public @type {{key: string, alias?: string}[]} */ keys = [];
    /** @public @type {string[]} */ _keys = [];
    /** @private @type {string} */_filter = "";

    constructor() { }

    /**
     * Assists with building a GROUP BY statement
     * @param {keyof T} tKey
     * @returns {GroupBuilder<T>}
     */
    by(tKey) {
        this.keys = [...this.keys, {
            key: String(tKey)
        }];
        return this;
    }

    /**
     * 
     * @param {KeyByValueType<T, Date|null|undefined>} tKey
     * @returns {GroupBuilder<T>}
     */
    byDay(tKey) {
        this.keys = [...this.keys, {
            key: `CONCAT(YEAR(${String(tKey)}), '/', DAY(${String(tKey)}))`,
            alias: "yearDay"
        }];
        return this;
    }

    /**
     * @param {KeyByValueType<T, Date|null|undefined>} tKey
     * @returns {GroupBuilder<T>}
     */
    byWeek(tKey) {
        this.keys = [...this.keys, {
            key: `YEARWEEK(${String(tKey)})`,
            alias: "yearWeek"
        }];
        return this;
    }

    /**
     * @param {KeyByValueType<T, Date|null|undefined>} tKey
     * @returns {GroupBuilder<T>}
     */
    byMonth(tKey) {
        this.keys = [...this.keys, {
            key: `CONCAT(YEAR(${String(tKey)}), '/', MONTH(${String(tKey)}))`,
            alias: "yearMonth"
        }];
        return this;
    }

    /**
     * @param {KeyByValueType<T, Date|null|undefined>} tKey
     * @returns {GroupBuilder<T>}
     */
    byYear(tKey) {
        this.keys = [...this.keys, {
            key: `YEAR(${String(tKey)})`,
            alias: "year"
        }];
        return this;
    }

    toString() {
        return this.keys.length > 0 ? ` GROUP BY ${this.keys.map(k => k.alias != undefined ? k.alias : k.key).join(',')}` : "";
    }

    getSelects() {
        if (this.keys.length <= 0) return '*';
        return `COUNT(*) as count,${this.keys.map(k => `${k.key}${k.alias != undefined ? ` AS ${k.alias}` : ""}`).join(',')}`;
    }
}