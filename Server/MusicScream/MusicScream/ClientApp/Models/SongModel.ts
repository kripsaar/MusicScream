import { ArtistInfo } from "./ArtistModel";
import { AlbumInfo } from "./AlbumModel";
import { GenreInfo } from "./GenreModel";
import { ProductInfo } from "./ProductModel";
import { SeasonInfo } from "./SeasonModel";

export interface Song
{
    id : number;
    title : string;
    aliases: string[];
    year: number;
    
    artists: ArtistInfo[];
    album: AlbumInfo;
    genres: GenreInfo[];
    products: ProductInfo[];
    seasons: SeasonInfo[];
}

export interface SongInfo
{
    id : number;
    title : string;
}