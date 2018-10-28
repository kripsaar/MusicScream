import { Song } from "./SongModel";
import * as Uuid from "uuid";
import { Playlist } from "ClientApp/components/MusicPlayer/Playlist";

export interface PlaylistTO
{
    id: number;
    name: string;
    list: PlaylistTOElement[];
}

export interface PlaylistInfo
{
    id: number;
    name: string;
}

export type PlaylistTOElement = Song | PlaylistTO;

export class PlaylistElement
{
    protected uuid : string = Uuid.v4();
    protected parentPlaylist : Playlist | null;

    constructor(parentPlaylist : Playlist | null = null)
    {
        this.parentPlaylist = parentPlaylist;
    }
    
    public getUuid() : string
    {
        return this.uuid;
    }

    public getParentPlaylist() : Playlist | null
    {
        return this.parentPlaylist;
    }

    public setParentPlaylist(parentPlaylist : Playlist | null)
    {
        this.parentPlaylist = parentPlaylist;
    }
}