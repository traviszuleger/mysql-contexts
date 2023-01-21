# mysql-contexts

mysql-contexts provides a strongly-typed, easy way to interact with your MySQL database by interfacing and building commands for a single table through the mysql2 connector.

# Table of Contents
 - [Chinook Database Schema](#chinook-database-schema)
 - [Creating Table Contexts](#creating-table-contexts)

# Chinook Database Schema

This README uses all of its examples using a Chinook database. You can see the chinook database, including schema, and other important information [here](https://docs.yugabyte.com/preview/sample-data/chinook/#:~:text=About%20the%20Chinook%20database,from%20an%20Apple%20iTunes%20library.)

More specifically, my examples all are connected to a MySQL Docker Container retrieved from [here](https://hub.docker.com/r/zaquestion/chinook-mysql)

Or the command to run this docker container for this tutorial is:
```
# the port, 10500, was arbitrarily chosen
docker pull zaquestion/chinook-mysql
docker run -p 10500:3306 -e MYSQL_ROOT_PASSWORD=root --name chinook-example-db zaquestion/chinook-mysql:latest
```



# Creating Table Contexts

As mysql-contexts implies, the core of this library allows you to create a MySQL Table Context for usage of interacting with that Table in MySQL. This library is most powerful when you use it with TypeScript or JSDOC typing. Although, the typing in mysql-contexts is done in JSDOC typing, this tutorial will be using TypeScript for readability sake.

## Type defining your Table

Since this acts as an interface, your types should perfectly resemble your Table as it appears in your database.

```

```