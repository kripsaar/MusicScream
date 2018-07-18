import { SongInfo } from "./SongModel";
import { AlbumInfo } from "./AlbumModel";

export interface Genre
{
    id: number;
    name: string;
    
    songs: SongInfo[];
    albums: AlbumInfo[];
}

export interface GenreInfo
{
    id: number;
    name: string;
}