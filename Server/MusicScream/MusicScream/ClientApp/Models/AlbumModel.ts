import { SongInfo } from "./SongModel";
import { ArtistInfo } from "./ArtistModel";
import { GenreInfo } from "./GenreModel";
import { ProductInfo } from "./ProductModel";

export interface Album
{
    id: number;
    title: string;
    aliases: string[];
    releaseDate: string;
    
    songs: SongInfo[];
    artists: ArtistInfo[];
    genres: GenreInfo[];
    products: ProductInfo[];
}

export interface AlbumInfo
{
    id: number;
    title: string;
}