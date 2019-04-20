create table if not exists musicscream."Artists"(
	"Id"			serial primary key,
	"Name"			text,
	"Aliases"		text[],
	"VgmdbLink"		text[]
);

create table if not exists musicscream."Songs"(
	"Id"		serial primary key,
	"Title"		text,
	"Aliases"	text[],
	"Year"		int,
	"Filename"	text
);

create table if not exists musicscream."ArtistSongLinks"(
	"ArtistId"	int references musicscream."Artists",
	"SongId"	int references musicscream."Songs",
	primary key ("ArtistId", "SongId")
);

create table if not exists musicscream."Albums"(
	"Id"			serial primary key,
	"Title"			text,
	"Aliases"		text[],
	"ReleaseDate"	timestamptz,
	"VgmdbLink"		text
);

create table if not exists musicscream."AlbumSongLinks"(
	"AlbumId"	int references musicscream."Albums",
	"SongId"	int references musicscream."Songs",
	primary key ("AlbumId", "SongId")
);

create table if not exists musicscream."ArtistAlbumLinks"(
	"ArtistId"	int references musicscream."Artists",
	"AlbumId"	int references musicscream."Albums",
	primary key ("ArtistId", "AlbumId")
);

create table if not exists musicscream."Playlists"(
	"Id"			serial primary key,
	"Name"			text,
	"CreationTime"	timestamptz,
	"LastModified"	timestamptz
);

create table if not exists musicscream."PlaylistElements"(
	"ParentPlaylistId"	int references musicscream."Playlists" not null,
	"Position"			int,
	"PlaylistId"		int references musicscream."Playlists",
	"SongId"			int references musicscream."Songs",
	primary key ("ParentPlaylistId", "Position"),
	check (("PlaylistId" is not null and "SongId" is null) or ("PlaylistId" is null and "SongId" is not null))
);

create table if not exists musicscream."Genres"(
	"Id"	serial primary key,
	"Name"	text
);

create table if not exists musicscream."AlbumGenreLinks"(
	"AlbumId"	int references musicscream."Albums",
	"GenreId"	int references musicscream."Genres",
	primary key ("AlbumId", "GenreId")
);

create table if not exists musicscream."Products"(
	"Id"		serial primary key,
	"Title"		text,
	"Aliases"	text[],
	"Year"		int,
	"Type"		text,
	"VgmdbLink"	text
);

create table if not exists musicscream."Seasons"(
	"Id"		serial primary key,
	"Name"		text,
	"Year"		int
);

create table if not exists musicscream."AlbumGenreLinks"(
	"AlbumId"	int references musicscream."Albums",
	"GenreId"	int references musicscream."Genre",
	primary key ("AlbumId", "GenreId")
);

create table if not exists musicscream."FranchiseProductLinks"(
	"FranchiseId" int references musicscream."Products",
	"ProductId" int references musicscream."Products",
	primary key ("FranchiseId", "ProductId")
);

create table if not exists musicscream."ProductAlbumLinks"(
	"ProductId"	int references musicscream."Products",
	"AlbumId"	int references musicscream."Albums",
	primary key ("ProductId", "AlbumId")
);

create table if not exists musicscream."ProductSongLinks"(
	"ProductId"	int references musicscream."Products",
	"SongId"	int references musicscream."Songs",
	primary key ("ProductId", "SongId")
);

create table if not exists musicscream."SeasonProductLinks"(
	"SeasonId"	int references musicscream."Seasons",
	"ProductId"	int references musicscream."Products",
	primary key ("SeasonId", "ProductId")
);

create table if not exists musicscream."SeasonSongLinks"(
	"SeasonId"	int references musicscream."Seasons",
	"SongId"	int references musicscream."Songs",
	primary key ("SeasonId", "SongId")
);

create table if not exists musicscream."SongGenreLinks"(
	"SongId"	int references musicscream."Songs",
	"GenreId"	int references musicscream."Genres",
	primary key ("SongId", "GenreId")
);