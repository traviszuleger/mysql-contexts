# mysql-contexts

This README is still under construction. If you have dire questions, try to see the source code, everything should be documented fairly well.

mysql-contexts provides a strongly-typed, easy way to interact with your MySQL database by interfacing and building commands for a single table through the mysql2 connector.

# Table of Contents
  - [Documentation](#documentation)
  - [Chinook Database Schema](#chinook-database-schema)
  - [Creating Table Contexts](#creating-table-contexts)
    - [Type defining your Table](#type-defining-your-table-for-chinook)
      - [Creating your SQL context](#creating-your-sql-context-for-chinook)
      - [Constructor](#constructor)
      - [Examples](#examples)
  - [Querying](#querying)
    - [get(limit[, offset, where, orderBy, groupBy, distinct])](#async-getlimit-offset0-wherenull-orderbynull-groupbynull-distinctnull)
    - [getAll([where, orderBy, groupBy, distinct])](#async-getallwherenull-orderbynull-groupbynull-distinctnull)
    - [count([where, distinct])](#async-countwherenull-distinctnull)
    - [WHERE clause](#where-clause)
      - [WhereBuilder & WhereBuilderFunction](#wherebuilder-and-wherebuilderfunction)
      - [Negating](#negating)
      - [Nested Conditions](#nested-conditionals-for-where)
    - [ORDER BY clause](#order-by-clause)
    - [GROUP BY clause](#group-by-clause)
    - [DISTINCT clause](#distinct-clause)
  - [Inserting](#inserting)
  - [Updating](#updating)
  - [Deleting](#deleting)
  - [Joining Tables](#joining-tables)
    - [(INNER) JOIN](#inner-join)
    - [LEFT (INNER) JOIN](#left-inner-join)
    - [RIGHT (INNER) JOIN](#right-inner-join)
    - [CROSS/FULL JOIN](#crossfull-join)
  - [Miscellaneous](#miscellaneous)
  - [Built-in event listeners](#built-in-event-listeners)
  - [Future plans](#future-plans)

# Documentation

The website to see all of the documentation is under construction.

# Chinook Database Schema

This README uses all of its examples using a Chinook database. You can see the chinook database, including schema, and other important information [here](https://docs.yugabyte.com/preview/sample-data/chinook/#:~:text=About%20the%20Chinook%20database,from%20an%20Apple%20iTunes%20library.)

However, I found the .sql files they provide do not work with MySQL, so in this repository is an "initdb.sql" file you can use to set up your local chinook database.

# Creating Table Contexts

As mysql-contexts implies, the core of this library allows you to create a MySQL Table Context for usage of interacting with that Table in MySQL. This library is most powerful when you use it with TypeScript or JSDOC typing. Although, the typing in mysql-contexts is done in JSDOC typing, this tutorial will be using TypeScript for readability sake.

## Type defining your Table for chinook

Since this acts as an interface, your types should perfectly resemble your Table as it appears in your database. The below example is how the Customer record interface should look that will act as the primary model object connected to the Customer table in our chinook database.

```
// Table schema in chinook db.
// CREATE TABLE Customer
// (
//     CustomerId INT NOT NULL,
//     FirstName VARCHAR(40) NOT NULL,
//     LastName VARCHAR(20) NOT NULL,
//     Company VARCHAR(80),
//     Address VARCHAR(70),
//     City VARCHAR(40),
//     State VARCHAR(40),
//     Country VARCHAR(40),
//     PostalCode VARCHAR(10),
//     Phone VARCHAR(24),
//     Fax VARCHAR(24),
//     Email VARCHAR(60) NOT NULL,
//     SupportRepId INT,
//     CONSTRAINT PK_Customer PRIMARY KEY  (CustomerId)
// );

interface Customer {
    CustomerId: number;
    FirstName: string;
    LastName: string;
    Company?: string;
    Address?: string;
    City?: string;
    State?: string;
    Country?: string;
    PostalCode?: string;
    Phone?: string;
    Fax?: string;
    Email: string;
    SupportRepId?: number;
};
```

As you can see, nullable types, as defined in the database, have "?" appended after their property key in the interface. This isn't important, but can definitely stump you later on if you don't define it correctly.

## Creating your SQL context for chinook

In the last section, we created an interface for our Chinook database table, "Customer". Now we will create a Table Context to provide an interface to our Table.

### Constructor

First, you need to know how the MySqlTableContext can be constructed.

### Examples

```
import MySqlTableContext from '@tzuleger/mysql-contexts';
import type { Customer } from "./chinook-types";

// Port is defaulted to 3306.
const customerCtx = new MySqlTableContext<Customer>({ host: "127.0.0.1", port: 10500, database: "chinook", user: "root", password: "root" }, "Customer");
```

In the event you want to connect to two separate tables without creating a new Connection every time, you can call the static function on MySqlTableContext, "createPool", to which you can pass as an argument in place of the PoolOptions like above.

e.g.,  
```
import MySqlTableContext from '@tzuleger/mysql-contexts';
import type { Customer, Artist } from "./chinook-types";

// Port is defaulted to 3306.
const pool = MySqlTableContext.$createPool({ host: "127.0.0.1", port: 10500, database: "chinook", user: "root", password: "root" });
const customerCtx = new MySqlTableContext<Customer>(pool, "Customer");
const artistCtx = new MySqlTableContext<Artist>(pool, "Artist");
```

Now, pretend for a moment our Customer has an auto increment column attached to it, called "Id". With that being the case, you should pass in another argument specifying what the column name is.  
e.g.,  
```
import MySqlTableContext from '@tzuleger/mysql-contexts';
import type { Customer } from "./chinook-types";

type CustomerWithAutoIncrementId = Customer & { Id: number }; // The aiKey argument has to be a keyof the interface the MySqlTableContext class object is tied to.

// Port is defaulted to 3306.
const pool = MySqlTableContext.$createPool({ host: "127.0.0.1", port: 10500, database: "chinook", user: "root", password: "root" });
const customerCtx = new MySqlTableContext<Customer>(pool, "Customer", "Id");
```

Congratulations, you just set up a Table Context to interface to chinook.dbo.Customer. You can alter this code however you like to attach to many different tables.

# Querying

We were able to create our MySqlTableContext, now we want to query from it. Querying from your context may be a little strange at first. The main two functions for querying is "get" and "getAll".

## async get(limit, offset=0, where=null, orderBy=null, groupBy=null, distinct=null);

The "get" function is for grabbing an arbitrary amount of records, specified by the {limit} argument. You can add in more arguments to further cleanse your query.  
Here is a list of all of the arguments and their descriptions.
 - limit: Number of records to grab.
 - offset: Number specified to offset from the beginning.
 - where: Builder function to help build a WHERE clause.
 - orderBy: Builder function to help build an ORDER BY clause.
 - groupBy: Builder function to help build a GROUP BY clause.
 - distinct: List of column names under this TableContext to select distinctively off of.

Now, here's an example of a simple Query to grab the first 5 Customer records from chinook.dbo.Customer.

```
// ... initialization

// Since this is a promise, you can "await" on this function where it will yield the results.
customerCtx.get(5, 0).then(results => {
     console.log(results);
});

```

The above output will show:

```
[
  {
    CustomerId: 1,
    FirstName: 'LuÃ­s',
    LastName: 'GonÃ§alves',
    Company: 'Embraer - Empresa Brasileira de AeronÃ¡utica S.A.',
    Address: 'Av. Brigadeiro Faria Lima, 2170',
    City: 'SÃ£o JosÃ© dos Campos',
    State: 'SP',
    Country: 'Brazil',
    PostalCode: '12227-000',
    Phone: '+55 (12) 3923-5555',
    Fax: '+55 (12) 3923-5566',
    Email: 'luisg@embraer.com.br',
    SupportRepId: 3
  },
  {
    CustomerId: 2,
    FirstName: 'Leonie',
    LastName: 'KÃ¶hler',
    Company: null,
    Address: 'Theodor-Heuss-StraÃŸe 34',
    City: 'Stuttgart',
    State: null,
    Country: 'Germany',
    PostalCode: '70174',
    Phone: '+49 0711 2842222',
    Fax: null,
    Email: 'leonekohler@surfeu.de',
    SupportRepId: 5
  },
  {
    CustomerId: 3,
    FirstName: 'FranÃ§ois',
    LastName: 'Tremblay',
    Company: null,
    Address: '1498 rue BÃ©langer',
    City: 'MontrÃ©al',
    State: 'QC',
    Country: 'Canada',
    PostalCode: 'H2G 1A7',
    Phone: '+1 (514) 721-4711',
    Fax: null,
    Email: 'ftremblay@gmail.com',
    SupportRepId: 3
  },
  {
    CustomerId: 4,
    FirstName: 'BjÃ¸rn',
    LastName: 'Hansen',
    Company: null,
    Address: 'UllevÃ¥lsveien 14',
    City: 'Oslo',
    State: null,
    Country: 'Norway',
    PostalCode: '0171',
    Phone: '+47 22 44 22 22',
    Fax: null,
    Email: 'bjorn.hansen@yahoo.no',
    SupportRepId: 4
  },
  {
    CustomerId: 5,
    FirstName: 'FrantiÂšek',
    LastName: 'WichterlovÃ¡',
    Company: 'JetBrains s.r.o.',
    Address: 'Klanova 9/506',
    City: 'Prague',
    State: null,
    Country: 'Czech Republic',
    PostalCode: '14700',
    Phone: '+420 2 4172 5555',
    Fax: '+420 2 4172 5555',
    Email: 'frantisekw@jetbrains.com',
    SupportRepId: 4
  }
]
```

You can see more information on clauses starting in the [WHERE clause](#where-clause) section.

## async getAll(where=null, orderBy=null, groupBy=null, distinct=null);

The "getAll" function is for grabbing all records from the table. You can add in certain arguments to further cleanse your query.  
Here is a list of all of the arguments and their descriptions.
 - limit: Number of records to grab.
 - offset: Number specified to offset from the beginning.
 - where: Builder function to help build a WHERE clause.
 - orderBy: Builder function to help build an ORDER BY clause.
 - groupBy: Builder function to help build a GROUP BY clause.
 - distinct: List of column names under this TableContext to select distinctively off of.
 
Now, here's an example of a simple Query to grab the all Customer records from chinook.dbo.Customer

```
// ... initialization

// 
customerCtx.getAll();
// builds the Query: SELECT * AS count FROM Customer;

```

## async count(where=null, distinct=null)

The "count" function is for grabbing the number of records in the database. You can add certain arguments to further limit the number of records you are querying for.  
Here is a list of all of the arguments and their descriptions.
 - where: Builder function to help build a WHERE clause.
 - distinct: List of column names under this TableContext to select distinctively off of.

Now, here are some examples:

```
// -- get the total number of customers --
customerCtx.count();
// builds the Query: SELECT COUNT(*) AS count FROM Customer;

// -- get the number of customers with the first name, "Frank" --
customerCtx.count(where => where.equals("FirstName", "Frank"));
// builds the Query: SELECT COUNT(*) AS count FROM Customer WHERE FirstName='Frank';

// -- get the number of unique countries where customers reside in --
customerCtx.count(null, ["Country"]);
// builds the Query: SELECT COUNT(DISTINCT Country) AS count FROM Customer;
```

## WHERE clause

Running queries is one thing, but the data you get back is pointless unless you can filter on them. You could use the "getAll" function and then use JavaScript's built in [filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) function, but that could be pulling in a LOT of data into memory.

#### WhereBuilder and WhereBuilderFunction

With every single get or getAll function you call, you have an optional anonymous WhereBuilderFunction function type argument called "where" that allows you to create a WHERE clause. The WhereBuilderFunction provides you a WhereBuilder&lt;TTableModel&gt; context that provides you access to simple SQL conditional-like syntax functions to build your clause. The TTableModel represents the model object your MySqlTableContext class is linked to.

Here is an example of how the WhereBuilderFunction&lt;TTableModel&gt; class is used.

```
// The generic parameter, TTableModel, is defined here as the model object you used to create your MySqlTableContext. 
// Using our above examples with our Customer table context, TTableModel would be "Customer". 
type WhereBuilderFunction<TTableModel> = (where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>;
```

Below is a table of key functions that the WhereBuilder class has with descriptions of what they do.

__NOTE: All functions returns a reference to itself, to support function chaining.__

| Function | Arguments | Respective argument types | Description |
| -------- | ----------------- | --------------- | ----------- |
| not | where | WhereBuilderFunction&lt;TTableModel&gt; | Sets a flag so the next condition added is negated. If you want to negate your entire condition, you can nest another WhereBuilder using the WhereBuilderFunction, where. |
| equals | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is equal to the value specified. If a condition already exists, then " AND {colName} = {val}" is appended instead. |
| notEquals | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is not equal to the value specified. If a condition already exists, then " AND {colName} &lt;&gt; {val}" is appended instead. |
| lessThan | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is less than the value specified. If a condition already exists, then " AND {colName} &lt; {val}" is appended instead. |
| lessThanOrEqualTo | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is less than or equal to the value specified. If a condition already exists, then " AND {colName} &lt;= {val}" is appended instead. |
| greaterThan | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is greater than the value specified. If a condition already exists, then " AND {colName} &gt; {val}" is appended instead. |
| greaterThanOrEqualTo | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is greater than or equal to the value specified. If a condition already exists, then " AND {colName} &gt;= {val}" is appended instead. |
| isIn | column, value, where | keyof TTableModel, TTableModel[TColumn][], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is one of the values specified. If a condition already exists, then " AND {colName} IN ({vals[0]}[,...{vals[n]}])" is appended instead. |
| isNotIn | column, value, where | keyof TTableModel, TTableModel[TColumn][], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is not one of the values specified. If a condition already exists, then " AND {colName} NOT IN ({vals[0]}[,...{vals[n]}])" is appended instead. |
| isNull | column, where | keyof TTableModel, WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is NULL. If a condition already exists, then " AND {colName} = NULL" is appended instead. |
| isNotNull | column, where | keyof TTableModel, WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is NOT NULL. If a condition already exists, then " AND {colName} &lt;&gt; NULL" is appended instead. |
| andEquals | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is equal to the value specified. If a condition already exists, then " WHERE {colName} = {val}" is appended instead. |
| andNotEquals | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is not equal to the value specified. If a condition already exists, then " WHERE {colName} &lt;&gt; {val}" is appended instead. |
| andLessThan | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is less than the value specified. If a condition already exists, then " WHERE {colName} &lt; {val}" is appended instead. |
| andLessThanOrEqualTo | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is less than or equal to the value specified. If a condition already exists, then " WHERE {colName} &lt;= {val}" is appended instead. |
| andGreaterThan | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is greater than the value specified. If a condition already exists, then " WHERE {colName} &gt; {val}" is appended instead. |
| andGreaterThanOrEqualTo | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is greater than or equal to the value specified. If a condition already exists, then " WHERE {colName} &gt;= {val}" is appended instead. |
| andIsIn | column, value, where | keyof TTableModel, TTableModel[TColumn][], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is one of the values specified. If a condition already exists, then " WHERE {colName} IN ({vals[0]}[,...{vals[n]}])" is appended instead. |
| andIsNotIn | column, value, where | keyof TTableModel, TTableModel[TColumn][], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is not one of the values specified. If a condition already exists, then " WHERE {colName} NOT IN ({vals[0]}[,...{vals[n]}])" is appended instead. |
| andIsNull | column, where | keyof TTableModel, WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is NULL. If a condition already exists, then " WHERE {colName} = NULL" is appended instead. |
| andIsNotNull | column, where | keyof TTableModel, WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is NOT NULL. If a condition already exists, then " WHERE {colName} &lt;&gt; NULL" is appended instead. |
| orEquals | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is equal to the value specified. If a condition already exists, then " WHERE {colName} = {val}" is appended instead. |
| orNotEquals | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is not equal to the value specified. If a condition already exists, then " WHERE {colName} &lt;&gt; {val}" is appended instead. |
| orLessThan | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is less than the value specified. If a condition already exists, then " WHERE {colName} &lt; {val}" is appended instead. |
| orLessThanOrEqualTo | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is less than or equal to the value specified. If a condition already exists, then " WHERE {colName} &lt;= {val}" is appended instead. |
| orGreaterThan | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is greater than the value specified. If a condition already exists, then " WHERE {colName} &gt; {val}" is appended instead. |
| orGreaterThanOrEqualTo | column, value, where | keyof TTableModel, TTableModel[TColumn], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is greater than or equal to the value specified. If a condition already exists, then " WHERE {colName} &gt;= {val}" is appended instead. |
| orIn | column, value, where | keyof TTableModel, TTableModel[TColumn][], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is one of the values specified. If a condition already exists, then " WHERE {colName} IN ({vals[0]}[,...{vals[n]}])" is appended instead. |
| orIsNotIn | column, value, where | keyof TTableModel, TTableModel[TColumn][], WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is not one of the values specified. If a condition already exists, then " WHERE {colName} NOT IN ({vals[0]}[,...{vals[n]}])" is appended instead. |
| orIsNull | column, where | keyof TTableModel, WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is NULL. If a condition already exists, then " WHERE {colName} = NULL" is appended instead. |
| orIsNotNull | column, where | keyof TTableModel, WhereBuilderFunction&lt;TTableModel&gt; | Adds a condition to a statement that checks if the column name specified is NOT NULL. If a condition already exists, then " WHERE {colName} &lt;&gt; NULL" is appended instead. |

When using the WhereBuilderFunction anonymous function, you can simply tag on your conditions one after each other.  

Here is an example of how you build a WHERE clause:

```
// ... initialization

//  -- get all Customers named "Frank Harris" --
customerCtx.getAll(where => where.equals("FirstName", "Frank").andEquals("LastName", "Harris"));
// builds the Query: SELECT * FROM Customer WHERE FirstName='Frank' AND LastName='Harris';
```

#### Negating

Although, most functions are provided with their own negated variant, sometimes you may know what you don't want, but instead you build it for what you actually want, and just want to negate it. Negating is simple and provides just that with that the "not()" function.  

Here is an example of negating one condition in your entire clause.

```
// ... initialization

//  -- get all Customers with the first name, "Frank", and not the last name "Harris" --
customerCtx.getAll(where => where.equals("FirstName", "Frank").not().andEquals("LastName", "Harris"));
// builds the Query: SELECT * FROM Customer WHERE FirstName='Frank' AND NOT LastName='Harris';
```
__NOTE: instead of chaining .not() with .andEquals(...), you could just use .andNotEquals(...), but for the sake of this example, the chaining method is used.__

If a situation comes up where you decide you don't want that entire condition, but instead want the exact opposite of what you built, you can simply move your entire anonymous function into the .not() function.  

e.g.,

```
// ... initialization

//  -- get all Customers that do not have the full name "Frank Harris". --
customerCtx.getAll(where => where.not(where => where.equals("FirstName", "Frank").andEquals("LastName", "Harris")));
// builds the Query: SELECT * FROM Customer WHERE NOT (FirstName='Frank' AND LastName='Harris');
```

#### Nested Conditionals for WHERE

Every condition on this WhereBuilder class object chains its conditions. This can be problematic in the situation where you may need to consider a sort of precedence on your conditions. (e.g., Get all Customers named "Frank Harris" or with CustomerId of 16) You can solve these precedence issues with Nested conditionals.

Every conditional function (besides the "not" function) has an optional parameter which is another WhereBuilderFunction. This function is meant for nesting your conditionals.

Here is an example of using nested conditionals:  

```
// ... initialization

//  -- get all Customers with the a full name of "Frank Harris" OR all Customers with the first name of "Frank" and a CustomerId of 16 --
customerCtx.getAll(where => where.equals("FirstName", "Frank").andEquals("LastName", "Harris", where => where.orEquals("CustomerId", 16)));
// builds the Query: SELECT * FROM Customer WHERE FirstName='Frank' AND (LastName='Harris' OR CustomerId=16);

// -- get all Customers who reside in the USA with a full name of "Frank Harris" OR all Customers who reside in the USA with just a first name of "Frank" and the CustomerId of 16. --
customerCtx.getAll(where => where.equals("FirstName", "Frank").andEquals("LastName", "Harris", where => where.orEquals("CustomerId", 16)).andEquals("Country", "USA"));
// builds the Query: SELECT * FROM Customer WHERE FirstName='Frank' AND (LastName='Harris' OR CustomerId=16) AND Country='USA';
```

While nested conditionals can get messy, they may be useful in certain situations.

## ORDER BY clause

Building your ORDER BY clause doesn't get as complex as your WHERE clause, but like all clauses in mysql-contexts, clauses will appear very similarly.  

Just like the WhereBuilderFunction, the orderBy (in the .get() and .getAll() functions) has its own OrderByBuilderFunction.  
Here is an example of how the OrderByBuilderFunction&lt;TTableModel&gt; class is used.

```
// The generic parameter, TTableModel, is defined here as the model object you used to create your MySqlTableContext. 
// Using our above examples with our Customer table context, TTableModel would be "Customer". 
type OrderByBuilderFunction<TTableModel> = (where: OrderByBuilder<TTableModel>) => OrderByBuilder<TTableModel>;
```

Below is a table of key functions that the OrderBuilder&lt;TTableModel&gt; class has with descriptions of what they do.  

| Function | Arguments | Respective argument types | Description |
| -------- | ----------------- | --------------- | ----------- |
| by | tKey | keyof TTableModel | Returns a model object with three functions, .by(tKey) (reference back to this function), .asc(), and .desc() |
| by.by() | tKey | keyof TTableModel | See the by() function description |
| by.asc() | None | None | Sort your results in ascending order (this only applies to the sorting of tKey from your last call to .by(tKey)) |
| by.desc() | None | None | Sort your results in descending order (this only applies to the sorting of tKey from your last call to .by(tKey)) |

The .by() function's reference back to itself can get a little confusing, but it makes it so if you want to sort multiple keys in ascending order, you can just chain the .by() function to itself.

Here is an example of how you would build an ORDER BY clause:

```
// ... initialization

// -- get all Customers ascending ordered by their CustomerId. --
customerCtx.getAll(null, order => order.by("CustomerId"));
// builds the Query: SELECT * FROM Customer ORDER BY CustomerId;

// -- query to get all Customers descending ordered by their SupportRepId then ascending ordered by their CustomerId. --
customerCtx.getAll(null, order => order.by("CustomerId").desc().by("CustomerId"));
// builds the Query: SELECT * FROM Customer ORDER BY SupportRepId DESC, CustomerId;
```

## GROUP BY clause

__NOTE: The GROUP BY clause is not optimized nor tested thoroughly, so this may have bugs.__

Just like the other clauses, to build your GROUP BY clause, you need to provide an anonymous function. Building your GROUP BY clause is similar to the ORDER BY clause building, but are chained immediately. Additionally, there are 4 extra functions that provide easier interfacing for Dates.

It is important to know, if you use a GROUP BY clause, you can only grab the columns that are in your GROUP BY clause.

Below is a table of key functions that the GroupByBuilder&lt;TTableModel&gt; class has with descriptions of what they do.  

| Function | Arguments | Respective argument types | Description |
| -------- | ----------------- | --------------- | ----------- |
| by | tKey | keyof TTableModel | Group your results by the given key. |
| byDay | tKey | keyof TTableModel | Group your results by a DATE/DATETIME/TIMESTAMP column by day. If this is specified, then the results you get back will have a "yearDay" property containing the date. |
| byWeek | tKey | keyof TTableModel | Group your results by a DATE/DATETIME/TIMESTAMP column by week. If this is specified, then the results you get back will have a "yearWeek" property containing the date. |
| byMonth | tKey | keyof TTableModel | Group your results by a DATE/DATETIME/TIMESTAMP column by month. If this is specified, then the results you get back will have a "yearMonth" property containing the date. |
| byYear | tKey | keyof TTableModel | Group your results by a DATE/DATETIME/TIMESTAMP column by year. If this is specified, then the results you get back will have a "yearYear" property containing the date. |

__Using any of these functions gives you context to the "count" property in any of your return results__

Here is an example of how you would build an ORDER BY clause:

```
// ... initialization

// -- get the number of Employees grouped by country. --
customerCtx.getAll(null, null, group => group.by("Country"));
// builds the Query: SELECT COUNT(*) as count, Country FROM Customer GROUP BY Country;

// -- get the number of Employees grouped by country and by the year of their hire date. --
employeeCtx.getAll(null, null, group => group.by("Country").byYear("HireDate"));
// builds the Query: SELECT COUNT(*) as count, Country, YEAR(HireDate) as year FROM Employee GROUP BY Country, YEAR(HireDate);
```

## DISTINCT clause

Although, the DISTINCT keyword isn't necessarily a clause itself, it is described as such since it somewhat belongs in this group.

Building your DISTINCT clause isn't built from an anonymous function, like the other clauses. Instead, it is built just by providing the columns you want to be unique.  
Here's an example of how you would build a DISTINCT clause:

```
// ... initialization

// -- get all countries that Customers reside in  --
customerCtx.getAll(null, null, null, ["Country"]);
// builds the Query: SELECT DISTINCT Country FROM Customer;

// -- get all countries and cities that Customers reside in  --
customerCtx.getAll(null, null, null, ["Country", "City"]);
// builds the Query: SELECT DISTINCT Country FROM Customer;
```

# Inserting

With knowing how to query from our database using our context, we also need to know how to insert into our database. The two main functions for inserting are "insert" and "insertMany".

# Updating

The update commands have access to the WHERE clause builder function. You can reference adding WHERE clauses [here](#where-clause)


# Deleting

# Joining tables

Joining tables is a little bit more intuitive, but is still just as simple as any of the simple interaction commands.

__NOTE: As of version 1.0.3, you can only join on a singular key. There are plans to make it so you can add AND and OR conditionals.__

## (INNER) JOIN

## OUTER JOIN

## LEFT (INNER) JOIN

## RIGHT (INNER) JOIN

## CROSS/FULL JOIN

# Miscellaneous

# Built-in event listeners

The MySqlTableContext class has a few functions that allow you to add your own handlers to certain events.  
Events are fired when the table does the following:
 - Inserting record(s)
 - Updating record(s)
 - Querying record(s)
 - Deleting record(s)

# Future plans

This section is dedicated to a list of future add-ons.

## Sub-queries

Right now, Table Contexts only interface to a simple command. Although, sub-queries can be costly, they can be very useful, so it is important to include it.

## Protect function arguments

Right now, almost all functions implicitly handle the typing, making it so TypeScript and JSDOC users can easily keep up with the correct arguments to pass in. However, this library should also be used by vanilla JS users. Since that is the case, all functions should be protected by throwing errors for when the argument isn't what is expected.