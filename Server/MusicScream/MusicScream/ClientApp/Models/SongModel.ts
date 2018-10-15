import { ArtistInfo } from "./ArtistModel";
import { AlbumInfo } from "./AlbumModel";
import { GenreInfo } from "./GenreModel";
import { ProductInfo } from "./ProductModel";
import { SeasonInfo } from "./SeasonModel";
import * as Uuid from "uuid";

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

export class PlayableElement
{
    private uuid : string = Uuid.v4();
    private song : Song;

    public constructor(song : Song)
    {
        this.song = song;
    }

    public getUuid() : string
    {
        return this.uuid;
    }

    public getSong() : Song
    {
        return this.song;
    }
}