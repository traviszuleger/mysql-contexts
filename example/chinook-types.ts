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

export interface Album {
    AlbumId: number;
    Title: string;
    ArtistId: number;
};

export interface Artist {
    ArtistId: number;
    Name?: string;
};

export interface Customer {
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

export interface Employee {

};