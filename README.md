# mysql-contexts

This README is still under construction. If you have dire questions, try to see the source code, everything should be documented fairly well.

mysql-contexts provides a strongly-typed, easy way to interact with your MySQL database by interfacing and building commands for a single table through the mysql2 connector.

# Table of Contents
  - [Documentation](#documentation)
  - [Chinook Database Schema](#chinook-database-schema)
  - [Creating Table Contexts](#creating-table-contexts)
    - [Typing](#preparing-types-for-mysqltablecontext)
    - [Constructor Syntax](#syntax-of-mysqltablecontext)
    - [Examples](#constructing-mysqltablecontext-examples)
  - [Querying](#querying)
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

If you'd like to set up a Docker container to run the Chinook database on localhost:3306, then follow these instructions

1.) Create a Dockerfile  
```Dockerfile
FROM mysql:latest

MAINTAINER me

ENV MYSQL_ROOT_PASSWORD=root

ADD initdb.sql /docker-entrypoint-initdb.d
```
2.) In the same directory as the Dockerfile, create a new file called "initdb.sql" with the contents from [here](https://raw.githubusercontent.com/traviszuleger/mysql-contexts/main/example/initdb.sql)  
3.) From the command line, in the same directory as your Dockerfile and "initdb.sql", run the following instructions  
```
sudo docker build --tag chinook_example_image .
sudo docker run -d -p 3306:3306 --name chinook-example-db chinook_example_image:latest
```

# Creating Table Contexts

As mysql-contexts implies, the core of this library allows you to create a MySQL Table Context for usage of interacting with that Table in MySQL. This library is most powerful when you use it with TypeScript or JSDOC typing. Although, the typing in mysql-contexts is done in JSDOC typing, this tutorial will be using TypeScript for readability sake.

## Preparing Types for MySqlTableContext

Since this acts as an interface, your types should perfectly resemble your Table as it appears in your database. 

The below example is how an interface should look that represents the Customer table in our chinook database.

```ts
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

How the Table is defined in chinook:  

```sql
CREATE TABLE Customer
(
    CustomerId INT NOT NULL,
    FirstName VARCHAR(40) NOT NULL,
    LastName VARCHAR(20) NOT NULL,
    Company VARCHAR(80),
    Address VARCHAR(70),
    City VARCHAR(40),
    State VARCHAR(40),
    Country VARCHAR(40),
    PostalCode VARCHAR(10),
    Phone VARCHAR(24),
    Fax VARCHAR(24),
    Email VARCHAR(60) NOT NULL,
    SupportRepId INT,
    CONSTRAINT PK_Customer PRIMARY KEY  (CustomerId)
);
```

As you can see, nullable types, as defined in the database, have "?" appended after their property key in the interface. If you improperly define your table model, this may stump you later on.

__Note: Primary keys should be annotated as a non-nullable, but if the key is an AUTO_INCREMENT invariant, then you can specify it as nullable. This will help you later when you insert records into the database. (see [Inserting](#inserting) for more details)__

## Syntax of MySqlTableContext

`MySqlTableContext` is its own class but also has a `MySqlJoinContext` extension. The `MySqlJoinContext` is involved with joining tables together-- You can read more about that (here)[#joing-tables]

The constructor for a `MySqlTableContext` is defined as:

```ts
MySqlTableContext<MyTableModel>(configOrPool: MySql2PoolOptions|MySql2Pool, table: string, autoIncrementKey: keyof MyTableModel = null, options: TableContextOptions = {});
```

The parameters you pass into your `MySqlTableContext` are important.
  - `configOrPool`: This is either a `MySql2PoolOptions` model object, where you create a pool on the fly, or this is a `MySql2Pool`, where you pass in an already created pool.
  - `table`: __IMPORTANT:__ This needs to be the full name of the Table this context represents. If this is named incorrectly, your commands will not work.
  - `autoIncrementKey`: This is optional, but is important if you want insert functions to reassign the insert Ids back to the model object you inserted.
  - `options`: This is optional, and is rather unimportant, but is used for specifying options like `allowTruncation` and `allowUpdateOnAll`. These two properties are defaulted to false, protecting your Table from accidents involving truncation or updates on all records.

__More documentation on MySqlTableContext can be found [here](https://pkgs.traviszuleger.com/mysql-contexts/MySqlTableContext)__

## Constructing MySqlTableContext Examples

Here are some examples of constructing a MySqlTableContext using the chinook database.

```ts
import MySqlTableContext from '@tzuleger/mysql-contexts';
import type { Customer } from "./chinook-types";

// Port is defaulted to 3306, but in our setup we defined port to be 10500.
const customerCtx = new MySqlTableContext<Customer>({ host: "127.0.0.1", port: 10500, database: "chinook", user: "root", password: "root" }, "Customer");
```

In the event you want to connect to two separate tables without creating a new Connection every time, you can call the static function on MySqlTableContext, "createPool", to which you can pass as an argument in place of the PoolOptions like above.  

```ts
import MySqlTableContext from '@tzuleger/mysql-contexts';
import type { Customer, Artist } from "./chinook-types";

// Port is defaulted to 3306.
const pool = MySqlTableContext.$createPool({ host: "127.0.0.1", port: 10500, database: "chinook", user: "root", password: "root" });
const customerCtx = new MySqlTableContext<Customer>(pool, "Customer");
const artistCtx = new MySqlTableContext<Artist>(pool, "Artist");
```

Given your represented Table has a key defined as an AUTO_INCREMENT key, then you would need to do the following.

```ts
import MySqlTableContext from '@tzuleger/mysql-contexts';
import type { Customer } from "./chinook-types";

type CustomerWithAutoIncrementId = Customer & { Id: number }; // The aiKey argument has to be a keyof the interface the MySqlTableContext class object is tied to.

// Port is defaulted to 3306.
const pool = MySqlTableContext.$createPool({ host: "127.0.0.1", port: 10500, database: "chinook", user: "root", password: "root" });
const customerCtx = new MySqlTableContext<Customer>(pool, "Customer", "Id");
```

# Querying

Querying is simple and only involves calling some pre-defined functions. These functions are `.get()`, `.getAll()`, and `.count()`.  

  - `.get(limit[, offset=0, where=null])`: Retrieves the first \{limit\} records offset by `offset`, given the conditions built by `where` __If nothing is passed into `order` and/or `where`, then nothing is built from those respective functions__
  - `.getAll([where=null, orderBy=null, groupBy=null, distinct=[]])`: Retrieves all records (by `distinct` keys, or no distinction if not passed), which can be filtered on `where`, ordered by `orderBy`, grouped by `groupBy`. __If nothing is passed into these parameters, then nothing is built from those respective functions__
  - `.count([where=null])`: Retrieves the total number of records, which can be filtered on `where`. __If nothing is passed, then no clause is built__

## WHERE clause

__You can see the full documentation on `WhereBuilder<TTableModel>` [here](https://pkgs.traviszuleger.com/mysql-contexts/WhereBuilder)__  

Running queries is one thing, but the data you get back is pointless unless you can filter on them. On tables with a small amount of records, you can use the `.getAll()` function, and then use JavaScript's built in [filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) function, but tables with large amounts of records could consume a lot of memory.

That is where the `where` function parameters come in. These parameters are used to help create a WHERE clause tailored for your benefit. 

### WhereBuilder and WhereBuilderFunction

The where function parameter, as previously mentioned, is of type `WhereBuilderFunction<TTableModel>`. The `WhereBuilderFunction<TTableModel>` type is a custom callback function that takes in a `WhereBuilder<TTableModel>` class object that is used to build your WHERE clause. This subsection explains the basic syntax of these two types and how they are used to build your clause.

Here is how the `WhereBuilderFunction<TTableModel>` class is typed.

```ts
// The generic parameter, TTableModel, is defined here as the model object you used to create your MySqlTableContext. 
// Using our above examples with our Customer table context, TTableModel would be "Customer". 
type WhereBuilderFunction<TTableModel> = (where: WhereBuilder<TTableModel>) => WhereBuilder<TTableModel>;
```
 
The `WhereBuilder<TTableModel>` class functions return references back to its class, making it so you can chain your expressions.  

Here is an example of how you build a WHERE clause:

```ts
// ... initialization

//  -- get all Customers named "Frank Harris" --
customerCtx.getAll(where => where.equals("FirstName", "Frank").andEquals("LastName", "Harris"));
// builds the Query: SELECT * FROM Customer WHERE FirstName='Frank' AND LastName='Harris';
```

The above example builds the following command (not formatted to actual command that is sent):

```sql
SELECT * 
    FROM Customer 
    WHERE FirstName='Frank' 
        AND LastName='Harris';
```

### Negating

Although, most functions are provided with their own negated variant, sometimes you may have already built a condition, but quickly decided you want to negate that expression. The `.not()` function allows you to negate the immediate next boolean expression chained to the respective `WhereBuilder<TTableModel>` class object.

Here is an example of negating the next chained condition.

```ts
// ... initialization

//  -- get all Customers with the first name, "Frank", and not the last name "Harris" --
customerCtx.getAll(where => where.equals("FirstName", "Frank").not().andEquals("LastName", "Harris"));
```

__NOTE: As mentioned above, you could use `.andNotEquals()` instead of chaining `.not()` with `.andEquals()`.__  
The above example builds the following command (not formatted to actual command that is sent):

```sql
SELECT * 
    FROM Customer 
    WHERE FirstName='Frank' 
        AND NOT LastName='Harris';
```

The above example only negates the next chained condition. In the case you may want to negate an entire condition, you can simply move your chains into the `.not()` function.

Here is an example of negating an entire chained condition.

```ts
// ... initialization

//  -- get all Customers that do not have the full name "Frank Harris". --
customerCtx.getAll(where => where.not(where => where.equals("FirstName", "Frank").andEquals("LastName", "Harris")));
```

The above example builds the following command (not formatted to actual command that is sent):

```sql
SELECT * 
    FROM Customer 
    WHERE 
        NOT (FirstName='Frank' 
            AND LastName='Harris');
```

### Nested Conditionals

Every function on the `WhereBuilder<TTableModel>` class object is chained, making its conditions appear in a precedence order of left to right. This can be problematic in the situation where you may need to consider a different precedence on your conditions. You can solve these precedence issues with nested conditionals.  

Every conditional function has an optional parameter which is another `WhereBuilderFunction<TTableModel>`. This callback function is meant for nesting your conditionals. If this callback is specified, then the resulting conditional from the __nested__ builder is appended to the resulting conditional of the __original__ builder with the callback, __THEN__ that entire condition is wrapped with parentheses.

Here is an example of using nested conditionals:

```ts
// ... initialization

//  -- get all Customers with the a full name of "Frank Harris" OR all Customers with the first name of "Frank" and a CustomerId of 16 --
customerCtx.getAll(where => where.equals("FirstName", "Frank").andEquals("LastName", "Harris", where => where.orEquals("CustomerId", 16)));
```

The above example builds the following command (not formatted to actual command that is sent):

```sql
SELECT * 
    FROM Customer 
    WHERE FirstName='Frank' 
        AND (LastName='Harris' 
            OR CustomerId=16);
```

```ts
// -- get all Customers who reside in the USA with a full name of "Frank Harris" OR all Customers who reside in the USA with just a first name of "Frank" and the CustomerId of 16. --
customerCtx.getAll(where => where.equals("FirstName", "Frank").andEquals("LastName", "Harris", where => where.orEquals("CustomerId", 16)).andEquals("Country", "USA"));
```

The above example builds the following command (not formatted to actual command that is sent):

```sql
SELECT * 
    FROM Customer 
    WHERE FirstName='Frank' 
        AND (LastName='Harris' 
            OR CustomerId=16) 
        AND Country='USA';
```

While nested conditionals can get messy, they may be useful in certain situations. If the chaining becomes too problematic, you can always pre-define your functions and pass them in by name.

Here is an example of pre-defining your functions:

```ts
// ... initialization

import { type WhereBuilderFunction } from '@tzuleger/mysql-contexts/types';

const where: WhereBuilderFunction<Customer> = function(where: WhereBuilder<Customer>) {
    where.equals("FirstName", "Frank");
    where.equals("LastName", "Harris", where => where.orEquals("CustomerId", 16));
    return where;
}

//  -- get all Customers with the a full name of "Frank Harris" OR all Customers with the first name of "Frank" and a CustomerId of 16 --
customerCtx.getAll(where => where.equals("FirstName", "Frank").andEquals("LastName", "Harris", whereCustomerIdIs16));
// builds the Query: SELECT * FROM Customer WHERE FirstName='Frank' AND (LastName='Harris' OR CustomerId=16);

// -- get all Customers who reside in the USA with a full name of "Frank Harris" OR all Customers who reside in the USA with just a first name of "Frank" and the CustomerId of 16. --
customerCtx.getAll(where);
// builds the Query: SELECT * FROM Customer WHERE FirstName='Frank' AND (LastName='Harris' OR CustomerId=16) AND Country='USA';
```

## ORDER BY clause

__You can see the full documentation on `OrderByBuilder<TTableModel>` [here](https://pkgs.traviszuleger.com/mysql-contexts/OrderByBuilder)__  

Building an ORDER BY clause may not get as complex as the WHERE clause, but like such, it involves chaining SQL-like syntax functions to help build your clause. These functions are `.by()`, `.asc()`, and `.desc()`.  

  - `.by(column)`: Sets the `column` to sort by (defaults to ascending order)
  - `.asc()`: Can only be chained following a `.by()` call and sets the sort order for `.by()`'s `column` to ascending. 
  - `.desc()`: Can only be chained following a `.by()` call and sets the sort order for `.by()`'s `column` to descending.

Just like the `WhereBuilderFunction<TTableModel>` type, the `orderBy` parameter (in the `.get()` and `.getAll()` functions) has its own `OrderByBuilderFunction<TTableModel>`.  

Here is how the `OrderByBuilderFunction<TTableModel>` class is typed.

```ts
// The generic parameter, TTableModel, is defined here as the model object you used to create your MySqlTableContext. 
// Using our above examples with our Customer table context, TTableModel would be "Customer". 
type OrderByBuilderFunction<TTableModel> = (where: OrderByBuilder<TTableModel>) => OrderByBuilder<TTableModel>;
```

The main difference with `WhereBuilder<TTablelModel>` and `OrderByBuilder<TTableModel>` is the latter uses a type of function chaining where the `.by()` function can be chained recursively, while `.asc()` and `.desc()` can only be chained following a `.by()` call.

The `.by()` function's chain back to itself can get a little confusing, but it makes it so if you want to sort multiple keys in ascending order, you can just chain the .by() recursively without adding the pain of chaining `.asc()` every time.

Here is an example of how you would build an ORDER BY clause:

```ts
// ... initialization

// -- get all Customers ascending ordered by their CustomerId. --
customerCtx.getAll(null, order => order.by("CustomerId"));
```

The above example builds the following command (not formatted to actual command that is sent):

```sql
SELECT * 
    FROM Customer 
    ORDER BY CustomerId;
```

Here is an example of how you would build an ORDER BY clause chaining with multiple keys to sort by:

```ts
// -- query to get all Customers descending ordered by their SupportRepId then ascending ordered by their CustomerId. --
customerCtx.getAll(null, order => order.by("SupportRepId").desc().by("CustomerId"));
// builds the Query: SELECT * FROM Customer ORDER BY SupportRepId DESC, CustomerId;
```

The above example builds the following command (not formatted to actual command that is sent):

```sql
SELECT * 
    FROM Customer 
    ORDER BY SupportRepId DESC, 
        CustomerId;
```

## GROUP BY clause

__You can see the full documentation on `GroupByBuilder<TTableModel>` [here](https://pkgs.traviszuleger.com/mysql-contexts/GroupByBuilder)__  
__NOTE: The GROUP BY clause is not optimized nor tested thoroughly, so this may have bugs.__

Just like the other clauses, building your GROUP BY clause involves chaining SQL-like syntax functions to help build your clause. In this case, there is only one function that you need to worry about, and that is the `.by()` function. As a quality of life feature, there are 4 more pre-defined functions that provide easier interfacing for SQL DATE/DATETIME/TIMESTAMP types. These functions are `.byDay()`, `.byWeek()`, `.byMonth()`, and `.byYear()`.

  - `.by(column)`: Groups the results together where the values specified by `column` are equal. If this is specified, then the `$count` properties from records returned from `.get()` and `.getAll()` functions become available. 
  - `.byDay(column)`: Groups the results together where the values specified by `column` are equal. The key to group on becomes `CONCAT(YEAR(column), '/', DAY(column))`. If this is specified, then the `$count` and `$yearDay` properties from records returned from `.get()` and `.getAll()` functions become available. 
  - `.byWeek(column)`: Groups the results together where the values specified by `column` are equal. The key to group on becomes `CONCAT(YEAR(column), '/', WEEK(column))`. If this is specified, then the `$count` and `$yearWeek` properties from records returned from `.get()` and `.getAll()` functions become available.
  - `.byMonth(column)`: Groups the results together where the values specified by `column` are equal. The key to group on becomes `CONCAT(YEAR(column), '/', MONTH(column))`. If this is specified, then the `$count` and `$yearMonth` properties from records returned from `.get()` and `.getAll()` functions become available. 
  - `.byYear(column)`: Groups the results together where the values specified by `column` are equal. The key to group on becomes `YEAR(column)`. If this is specified, then the `$count` and `$year` properties from records returned from `.get()` and `.getAll()` functions become available. 

__IMPORTANT: If you use a GROUP BY clause, you can only grab the columns that are in your GROUP BY clause.__

Here is an example of how you would build an ORDER BY clause:

```ts
// ... initialization

// -- get the number of Employees grouped by country. --
customerCtx.getAll(null, null, group => group.by("Country"));
```

The above example builds the following command (not formatted to actual command that is sent):

```sql
SELECT COUNT(*) as count
    ,Country
    FROM Employee 
    GROUP BY Country
```

```ts
// -- get the number of Employees grouped by country and by the year of their hire date. --
employeeCtx.getAll(null, null, group => group.by("Country").byYear("HireDate"));
```

The above example builds the following command (not formatted to actual command that is sent):

```sql
SELECT COUNT(*) as count
    ,Country
    ,YEAR(HireDate) as $year
    FROM Employee 
    GROUP BY Country, 
        YEAR(HireDate);
```

## DISTINCT clause

Although, the DISTINCT keyword isn't necessarily a clause itself, it is described as such since it somewhat belongs in this group.

Building your DISTINCT clause isn't built from an anonymous function, like the other clauses. Instead, it is built just by providing the columns you want to be unique.  
Here's an example of how you would build a DISTINCT clause:

```ts
// ... initialization

// -- get all countries that Customers reside in  --
customerCtx.getAll(null, null, null, ["Country"]);
```

The above example builds the following command (not formatted to actual command that is sent):

```sql
SELECT DISTINCT Country 
    FROM Customer;
```

```ts
// -- get all countries and cities that Customers reside in  --
customerCtx.getAll(null, null, null, ["Country", "City"]);
// builds the Query: SELECT DISTINCT Country FROM Customer;
```

The above example builds the following command (not formatted to actual command that is sent):

```sql
SELECT DISTINCT Country
    ,City 
    FROM Customer;
```

__NOTE: If distinct columns are returned, then those are the only columns that will have non-null values on successful queries. However, as of v1.0, this does not constrain the return type to only those values, so all other values may appear to have their properties, when in reality, they will not.__

# Inserting

__Note: Insert functions are only available to single table contexts. Attempting to insert on a joined context results in an Error.__

Inserting into our table is not as nearly as complex as any other class function. Inserting is handled with two class functions. These functions are `.insertOne()` and `.insertMany()`.

  - `.insertOne(record)`: Inserts one record into the table and returns the record inserted. If `autoIncrementKey` was specified in the constructor, then the returned record will have the new Id assigned to it.
  - `.insertMany(records)`: Inserts many records into the table and returns an array of the records inserted. If `autoIncrementKey` was specified in the constructor, then the returned records will all have their new Id assigned to them.

__Important: If your table has an AUTO_INCREMENT column, and the record you're trying to insert has the key to that column, then that key will be deleted before it is inserted. Since it will be automatically assigned after getting inserted. Since this is the case, the one exception when typing your object models is making your primary key nullable IF AND ONLY IF that key is an AUTO_INCREMENT column. Otherwise, you CAN pass some unimportant data into that property (like 0), and the insert functions will handle it.__

Here is an example of inserting one record:

```ts
// ... initialization

const nextId = customerCtx.count() + 1;
const customer = customerCtx.insertOne({
    CustomerId: nextId, // required, as defined in our Customer interface. If this property were removed, then this would NOT be type-valid
    FirstName: 'John', // required
    LastName: 'Doe', // required
    Email: 'johndoe@example.com', // required
    Phone: '111-222-3333' // nullable, as defined in our Customer interface. Since this is optional, this property could be removed and this would still be type-valid. 
});
```

The above example builds the following command (not formatted to actual command that is sent):

```sql
INSERT INTO Customer 
    (CustomerId, FirstName, LastName, Email, Phone) 
    VALUES 
    ({nextId}, 'John', 'Doe', 'johndoe@example.com', '111-222-3333');
```

Here is an example of inserting one record, where the Table has an AUTO_INCREMENT key.

```ts
// Notice how I set Id: number to an nullable property.
type CustomerWithAutoIncrementId = Customer & { Id?: number };
const pool = MySqlTableContext.createPool({ host: "127.0.0.1", port: 10500, database: "chinook", user: "root", password: "root" });
const customerCtx = new MySqlTableContext<CustomerWithAutoIncrementId>(pool, "Customer", "Id");

const customer = customerCtx.insertOne({
    CustomerId: 99999999, // required, as defined in our Customer interface. If this property were removed, then this would NOT be type-valid
    FirstName: 'John', // required
    LastName: 'Doe', // required
    Email: 'johndoe@example.com', // required
    Phone: '111-222-3333' // nullable, as defined in our Customer interface. Since this is optional, this property could be removed and this would still be type-valid. 
});
console.log(customer.Id); // this will display the Id that was assigned from MySQL to the console
```

The above example builds the following command (not formatted to actual command that is sent):

```sql
INSERT INTO Customer 
    (CustomerId, FirstName, LastName, Email, Phone) 
    VALUES 
    ({nextId}, 'John', 'Doe', 'johndoe@example.com', '111-222-3333');
```

Here is an example of inserting multiple records.

```ts
// ... initialization

const nextId = customerCtx.count();
const customer = customerCtx.insertMany([{
    CustomerId: ++nextId, // required, as defined in our Customer interface. If this property were removed, then this would NOT be type-valid
    FirstName: 'John', // required
    LastName: 'Doe', // required
    Email: 'johndoe@example.com', // required
    Phone: '111-222-3333' // nullable, as defined in our Customer interface. Since this is optional, this property could be removed and this would still be type-valid. 
}, {
    CustomerId: ++nextId, // required, as defined in our Customer interface. If this property were removed, then this would NOT be type-valid
    FirstName: 'Jane', // required
    LastName: 'Doe', // required
    Email: 'janedoe@example.com', // required
}]);
```

The above example builds the following command (not formatted to actual command that is sent):

```sql
INSERT INTO Customer 
    (CustomerId, FirstName, LastName, Email, Phone) 
    VALUES 
    ({nextId}, 'John', 'Doe', 'johndoe@example.com', '111-222-3333'),
    ({nextId}, 'John', 'Doe', 'janedoe@example.com', NULL);
```

# Updating

The update commands have access to the WHERE clause builder function. You can reference adding WHERE clauses [here](#where-clause)


# Deleting

# Joining tables

Joining tables is a little bit more intuitive, but is still just as simple as any of the simple interaction commands.

__NOTE: As of v1.0, you can only join on a singular key. There are plans to make it so you can add AND and OR conditionals.__

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