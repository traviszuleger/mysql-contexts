import { MySqlTableContext } from "../contexts";

export interface Album {
    AlbumId: number;
    Title: string;
    ArtistId: number;
};

/** @implements {AbstractModel} */
export interface Artist {
    ArtistId: number;
    Name?: string;
    Tracks?: Track[];
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
    EmployeeId: number;
    FirstName: string;
    LastName: string;
    Title?: string;
    ReportsTo?: string;
    BirthDate?: Date,
    HireDate?: Date,
    Address?: string,
    City?: string,
    State?: string,
    Country?: string,
    PostalCode?: string,
    Fax?: string;
    Email?: string;
};

export interface Genre {
    GenreId: number;
    Name: string;
};

export interface Invoice {
    InvoiceId: number;
    CustomerId: number;
    BillingAddress: string;
    BillingCity: string;
    BillingState: string;
    BillingCountry: string;
    BillingPostalCode: string;
}

export interface InvoiceLine {
    InvoiceLineId: number;
    InvoiceId: number;
    TrackId: number;
    UnitPrice: number;
    Quantity: number;
}

export interface MediaType {
    MediaTypeId: number;
    Name: string;
}

export interface Playlist {
    PlaylistId: number;
    Name: string;
}

export interface PlaylistTrack {
    PlaylistTrackId: number;
    PlaylistId: number;
    TrackId: number;
}

export interface Track {
    TrackId: number;
    Name: string;
    AlbumId: number;
    MediaTypeId: number;
    GenreId: number;
    Composer: string;
    Milliseconds: number;
    Bytes: number;
    UnitPrice: number;
    Artist?: Artist;
}