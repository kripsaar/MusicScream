import { SongInfo } from "./SongModel";
import { AlbumInfo } from "./AlbumModel";
import { SeasonInfo } from "./SeasonModel";

export interface Product
{
    id: number;
    title: string;
    aliases: string[];
    year: number;
    type: string;
    
    songs: SongInfo[];
    albums: AlbumInfo[];
    seasons: SeasonInfo[];
    franchises: ProductInfo[];
    subProducts: ProductInfo[];
}

export interface ProductInfo
{
    id: number;
    title: string;
}