import { ArtistInfo } from "./ArtistModel";
import { AlbumInfo } from "./AlbumModel";
import { GenreInfo } from "./GenreModel";
import { ProductInfo } from "./ProductModel";
import { SeasonInfo } from "./SeasonModel";
import { Playlist } from "ClientApp/components/MusicPlayer/Playlist";
import { PlaylistElement } from "./PlaylistModel";

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

export class PlayableElement extends PlaylistElement
{
    private song : Song;

    public constructor(song : Song, parentPlaylist : Playlist | null = null)
    {
        super(parentPlaylist);
        this.song = song;
    }


    public getSong() : Song
    {
        return this.song;
    }
}