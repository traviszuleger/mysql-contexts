//@ts-check
/** @template TModel @template TKey @typedef {import('./toolbelt.js').KeyByValueType<TModel,TKey>} KeyByValueType */
/** @template TModel @typedef {import('./toolbelt.js').OrderByFunction<TModel>} OrderByFunction */

/**
 * Class used to help build WHERE clauses on SQL statements
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
     * Sets a flag so the next condition added is negated. If you want to negate your entire condition, you can nest another WhereBuilder using the WhereBuilderFunction, where.
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     * @returns {WhereBuilder<TTableModel>} The WhereBuilder in its most recent state.
     */
    not(where=undefined) {
        this._not = true;
        return where !== undefined ? where(this) : this;
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
        if(typeof(colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " = ?"))}`;
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
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " <> ?"))}`;
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
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " < ?"))}`;
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
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " <= ?"))}`;
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
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " > ?"))}`;
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
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " >= ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is one of the values specified. 
     * If a condition already exists, then " AND {colName} IN ({vals[0]}[,...{vals[n]}])" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn][]} vals Array of values respective to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    isIn(colName, vals, where = undefined) {
        if (!colName || !vals || vals.length <= 0) return this;
        const { nest, builder } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\` IN (${Array(vals.length).fill('?').join(', ')})`))}`;
        this._args = [...this._args, ...vals, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is not one of the values specified. 
     * If a condition already exists, then " AND {colName} NOT IN ({vals[0]}[,...{vals[n]}]" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn][]} vals Array of values respective to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    isNotIn(colName, vals, where = undefined) {
        if (!colName || !vals || vals.length <= 0) return this;
        const { nest, builder } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\` NOT IN (${Array(vals.length).fill('?').join(', ')})`))}`;
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
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " = NULL"))}`;
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is NOT NULL.
     * If a condition already exists, then " AND {colName} <> NULL" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    isNotNull(colName, where = undefined) {
        if (!colName) return this;
        const { nest } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " <> NULL"))}`;
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
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " = ?"))}`;
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
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " <> ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is less than the value specified. 
     * If a condition does not already exist, then " WHERE {colName} < {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    andLessThan(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " < ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is less than or greater to the value specified. 
     * If a condition does not already exist, then " WHERE {colName} <= {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    andLessThanOrEqualTo(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " <= ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is greater than to value specified. 
     * If a condition does not already exist, then " WHERE {colName} > {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    andGreaterThan(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " > ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is greater than or equal to the value specified. 
     * If a condition does not already exist, then " WHERE {colName} >= {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    andGreaterThanOrEqualTo(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " >= ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is one of the values specified. 
     * If a condition already exists, then " WHERE {colName} IN ({vals[0]}[,...{vals[n]}])" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn][]} vals Array of values respective to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    andIn(colName, vals, where = undefined) {
        if (!colName || !vals || vals.length <= 0) return this;
        const { nest, builder } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\` IN (${Array(vals.length).fill('?').join(', ')})`))}`;
        this._args = [...this._args, ...vals, ...builder._args];
        return this;
    }


    /**
     * Adds a condition to a statement that checks if the column name specified is not one of the values specified. 
     * If a condition already exists, then " WHERE {colName} NOT IN ({vals[0]}[,...{vals[n]}]" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn][]} vals Array of values respective to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    andIsNotIn(colName, vals, where = undefined) {
        if (!colName || !vals || vals.length <= 0) return this;
        const { nest, builder } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\` NOT IN (${Array(vals.length).fill('?').join(', ')})`))}`;
        this._args = [...this._args, ...vals, ...builder._args];
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is NULL.
     * If a condition already exists, then " WHERE {colName} = NULL" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    andIsNull(colName, where = undefined) {
        if (!colName) return this;
        const { nest } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " = NULL"))}`;
        return this;
    }

    /**
     * Adds a condition to a statement that checks if the column name specified is NOT NULL.
     * If a condition already exists, then " WHERE {colName} <> NULL" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    andIsNotNull(colName, where = undefined) {
        if (!colName) return this;
        const { nest } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " AND " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " <> NULL"))}`;
        return this;
    }

    /**
     * Adds a logical OR condition to a statement that checks if the column name specified is equal to the value specified. 
     * If a condition does not already exist, then " WHERE {colName} = {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orEquals(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " = ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a logical OR condition to a statement that checks if the column name specified is not equal to the value specified. 
     * If a condition does not already exist, then " WHERE {colName} <> {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orNotEquals(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " <> ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a logical OR condition to a statement that checks if the column name specified is less than the value specified. 
     * If a condition does not already exist, then " WHERE {colName} < {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orLessThan(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " < ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a logical OR condition to a statement that checks if the column name specified is less than or equal to the value specified. 
     * If a condition does not already exist, then " WHERE {colName} <= {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orLessThanOrEqualTo(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " <= ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a logical OR condition to a statement that checks if the column name specified is greater than the value specified. 
     * If a condition does not already exist, then " WHERE {colName} > {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orGreaterThan(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " > ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a logical OR condition to a statement that checks if the column name specified is greater than or equal to the value specified. 
     * If a condition does not already exist, then " WHERE {colName} >= {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn]} val Respective value type to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orGreaterThanOrEqualTo(colName, val, where = undefined) {
        if (colName == null || val == null) return this;
        const { nest, builder } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " >= ?"))}`;
        this._args = [...this._args, val, ...builder._args];
        return this;
    }

    /**
     * Adds a logical OR condition to a statement that checks if the column name specified is less than the value specified. 
     * If a condition does not already exist, then " WHERE {colName} < {val}" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn][]} vals Array of values respective to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orIn(colName, vals, where = undefined) {
        const { nest, builder } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\` IN (${Array(vals.length).fill('?').join(', ')})`))}`;
        this._args = [...this._args, ...vals, ...builder._args];
        return this;
    }

    /**
     * Adds a logical OR condition to a statement that checks if the column name specified is not one of the values specified. 
     * If a condition already exists, then " WHERE {colName} NOT IN ({vals[0]}[,...{vals[n]}]" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {TTableModel[TColumn][]} vals Array of values respective to the value type of the key passed into colName
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orIsNotIn(colName, vals, where = undefined) {
        if (!colName || !vals || vals.length <= 0) return this;
        const { nest, builder } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\` NOT IN (${Array(vals.length).fill('?').join(', ')})`))}`;
        this._args = [...this._args, ...vals, ...builder._args];
        return this;
    }

    /**
     * Adds a logical OR condition to a statement that checks if the column name specified is NULL.
     * If a condition already exists, then " WHERE {colName} = NULL" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orIsNull(colName, where = undefined) {
        if (!colName) return this;
        const { nest } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " = NULL"))}`;
        return this;
    }

    /**
     * Adds a logical OR condition to a statement that checks if the column name specified is NOT NULL.
     * If a condition already exists, then " WHERE {colName} <> NULL" is appended instead.
     * @template {keyof TTableModel} TColumn Some key to the model object that represents the table.
     * @param {TColumn} colName Column name that is being compared to.
     * @param {((where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>)=} where Lambda function to provide nested conditionals with this condition.
     */
    orIsNotNull(colName, where = undefined) {
        if (!colName) return this;
        const { nest } = this._buildNest(where);
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {TColumn} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._filter += `${(this._filter.length > 0 ? " OR " : " WHERE ")}${nest(this._negate(`\`${String(colName)}\`` + " <> NULL"))}`;
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
            // this is done so we can remove the WHERE clause.
            builder.equals("_", 0);
            nest = s => `(${s}${where(builder).toString().replace(" WHERE _ = ?", "")})`;
            builder._args.shift();
        }
        return { nest, builder }
    }
}

/**
 * Class used to help build ORDER BY clauses on SQL statements
 * @template TTableModel Type representing the Table as it appears in the database.
 */
export class OrderBuilder {
    /** @private @type {string[]} */
    _columns = [];

    constructor() { }

    /**
     * Orders the results of the query by the column name specified (.asc() and .desc() can be chained, otherwise it is defaulted to ASC)
     * @param {keyof TTableModel} colName The column name to sort by.
     * @returns {OrderByFunction<TTableModel>}
     */
    by(colName) {
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {keyof TTableModel} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this._columns = [...this._columns, `\`${String(colName)}\``];
        const idx = this._columns.length-1;
        return {
            by: (colName) => {
                this.by(colName);
                return this;
            },
            asc: () => {
                this._columns[idx] += " ASC";
                return this;
            },
            desc: () => {
                this._columns[idx] += " DESC";
                return this;
            },
            toString: () => {
                return this.toString()
            }
        }
    }

    toString() {
        return this._columns.length > 0 ? ` ORDER BY ${this._columns.join(',')}` : "";
    }
}

/**
 * Class used to help build GROUP BY clauses on SQL statements
 * @template TTableModel Type representing the Table as it appears in the database.
 */
export class GroupBuilder {
    /** @public @type {{key: string, alias?: string}[]} */ keys = [];
    /** @public @type {string[]} */ _keys = [];

    constructor() { }

    /**
     * Group your results by the given key.
     * @param {keyof TTableModel} colName Column to group by.
     * @returns {GroupBuilder<TTableModel>} A reference back to this GroupBuilder.
     */
    by(colName) {
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {keyof TTableModel} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this.keys = [...this.keys, {
            key: `\`${String(colName)}\``
        }];
        return this;
    }

    /**
     * Group your results by a DATE/DATETIME/TIMESTAMP column by day. If this is specified, then the results you get back will have a "yearDay" property containing the date.
     * @param {KeyByValueType<TTableModel, Date|null|undefined>} colName Column to group by.
     * @returns {GroupBuilder<TTableModel>} A reference back to this GroupBuilder.
     */
    byDay(colName) {
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {KeyByValueType<TTableModel, Date|null|undefined>} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this.keys = [...this.keys, {
            key: `CONCAT(YEAR(\`${String(colName)}\`), '/', DAY(\`${String(colName)}\`))`,
            alias: "$yearDay"
        }];
        return this;
    }

    /**
     * Group your results by a DATE/DATETIME/TIMESTAMP column by day. If this is specified, then the results you get back will have a "yearWeek" property containing the date.
     * @param {KeyByValueType<TTableModel, Date|null|undefined>} colName Column to group by.
     * @returns {GroupBuilder<TTableModel>} A reference back to this GroupBuilder.
     */
    byWeek(colName) {
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {KeyByValueType<TTableModel, Date|null|undefined>} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this.keys = [...this.keys, {
            key: `YEARWEEK(\`${String(colName)}\`)`,
            alias: "$yearWeek"
        }];
        return this;
    }

    /**
     * Group your results by a DATE/DATETIME/TIMESTAMP column by day. If this is specified, then the results you get back will have a "yearMonth" property containing the date.
     * @param {KeyByValueType<TTableModel, Date|null|undefined>} colName Column to group by.
     * @returns {GroupBuilder<TTableModel>} A reference back to this GroupBuilder.
     */
    byMonth(colName) {
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {KeyByValueType<TTableModel, Date|null|undefined>} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this.keys = [...this.keys, {
            key: `CONCAT(YEAR(\`${String(colName)}\`), '/', MONTH(\`${String(colName)}\`))`,
            alias: "$yearMonth"
        }];
        return this;
    }

    /**
     * Group your results by a DATE/DATETIME/TIMESTAMP column by day. If this is specified, then the results you get back will have a "year" property containing the date.
     * @param {KeyByValueType<TTableModel, Date|null|undefined>} colName Column to group by.
     * @returns {GroupBuilder<TTableModel>} A reference back to this GroupBuilder.
     */
    byYear(colName) {
        if (typeof (colName) === "string" && colName.includes(".")) {
            colName = /** @type {KeyByValueType<TTableModel, Date|null|undefined>} */ (`${String(colName).split(".")[0]}\`.\`${String(colName).split(".")[1]}`);
        }
        this.keys = [...this.keys, {
            key: `YEAR(\`${String(colName)}\`)`,
            alias: "$year"
        }];
        return this;
    }

    /**
     * Returns the compiled GROUP BY CLAUSE
     * @returns {string}
     */
    toString() {
        return this.keys.length > 0 ? ` GROUP BY ${this.keys.map(k => k.alias != undefined ? `${k.alias}` : `${k.key}`).join(',')}` : "";
    }

    /**
     * Returns the columns to include in the SELECT portion of the command.
     * @returns {string}
     */
    getSelects() {
        if (this.keys.length <= 0) return '*';
        return `COUNT(*) AS $count,${this.keys.map(k => `${k.key}${k.alias != undefined ? ` AS ${k.alias}` : ""}`).join(',')}`;
    }
}