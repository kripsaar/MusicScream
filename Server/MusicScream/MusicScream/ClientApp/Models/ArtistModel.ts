import { AlbumInfo } from "./AlbumModel";
import { SongInfo } from "./SongModel";

export interface Artist
{
    id: number;
    name: string;
    aliases: string[];
    
    albums: AlbumInfo[];
    songs: SongInfo[];
    units: ArtistInfo[];
    unitMembers: ArtistInfo[];
}

export interface ArtistInfo
{
    id: number;
    name : string;
}