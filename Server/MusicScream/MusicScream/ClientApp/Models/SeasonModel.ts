import { SongInfo } from "./SongModel";
import { ProductInfo } from "./ProductModel";

export interface Season
{
    id: number;
    name: string;
    year: number;
    
    songs: SongInfo[];
    products: ProductInfo[];
}

export interface SeasonInfo
{
    id: number;
    name: string;
}