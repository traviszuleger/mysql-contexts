import MySqlTableContext from '..';
import type { Customer, Artist } from "./chinook-types";

const pool = MySqlTableContext.createPool({ host: "127.0.0.1", port: 10500, database: "chinook", user: "root", password: "root" });
const customerCtx = new MySqlTableContext<Customer>(pool, "Customer");

// Creating a Table Context for chinook.dbo.Customer, letting the constructor create the Connection Pool for us.
function example1() {
    const customerCtx = new MySqlTableContext<Customer>({ host: "127.0.0.1", port: 10500, database: "chinook", user: "root", password: "root" }, "Customer");
}

// Creating a Connection Pool to be used for multiple tables.
function example2() {
    const pool = MySqlTableContext.createPool({ host: "127.0.0.1", port: 10500, database: "chinook", user: "root", password: "root" });
    const customerCtx = new MySqlTableContext<Customer>(pool, "Customer");
    const artistCtx = new MySqlTableContext<Artist>(pool, "Customer");
}

type CustomerWithAutoIncrementId = Customer & { Id: number }; // The aiKey argument has to be a keyof the interface the MySqlTableContext class object is tied to.

// Creating a Table Context for chinook.dbo.Customer, specifying that the Table has an Auto Increment column.
function example3() {
    const pool = MySqlTableContext.createPool({ host: "127.0.0.1", port: 10500, database: "chinook", user: "root", password: "root" });
    const customerCtx = new MySqlTableContext<CustomerWithAutoIncrementId>(pool, "Customer", "Id");
}


function example4() {
    customerCtx.get(5, 0).then(results => {
        console.log(results);
    });
}

example4();