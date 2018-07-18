import { ArtistInfo } from "./ArtistModel";
import { AlbumInfo } from "./AlbumModel";

export interface Song
{
    id : number;
    title : string;
    artist: ArtistInfo;
    album: AlbumInfo;
    year: number;
    genre: string;
}

export interface SongInfo
{
    id : number;
    title : string;
}