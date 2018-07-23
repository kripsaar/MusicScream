import * as React from 'react';
import { MusicPlayer, MusicPlayerInstance } from "./MusicPlayer";
import { Song } from '../../Models/SongModel';
import { Communication } from '../../Communication';

interface ISongListState
{
    songList : Song[];
    selectedSong : Song | null;
    nextSong: Song | undefined;
    previousSong: Song | undefined;
    songState: string;
    queue: Song[];
}

const STOP_STATE : string = "stop";
const PLAY_STATE : string = "play";
const PAUSE_STATE : string = "pause";

export class SongList extends React.Component<{}, ISongListState>
{
    musicPlayer = MusicPlayerInstance;

    constructor(props: {}, state: ISongListState)
    {
        super(props, state);
        this.state = {songList: [], selectedSong: null, nextSong: undefined, previousSong: undefined, songState: STOP_STATE, queue: []}
    }

    private rotateArray(array: any[], count: number) : any[]
    {
        if (array.length < 1)
            return array;
        count -= array.length * Math.floor(count / array.length);
        array.push.apply(array, array.splice(0, count));
        return array;
    }

    public componentDidMount()
    {
        this.getSongList();
        this.refreshLibrary();
    }

    private refreshLibrary()
    {
        Communication.simpleAjax("Music/RefreshMusicLibrary", 
            () => { this.getSongList(); },
            () => { console.log("Refresh failed!"); }
        );
    }

    private getSongList()
    {
        Communication.getJson("Music/GetAllSongs",
            (data: any) =>
            {
                if (data.songs)
                {
                    this.setState({songList: data.songs});
                    this.musicPlayer.songList = data.songs;
                }
            }
        );
    }

    private getSongUrl(song: Song) : string
    {
        return "Music/GetSong?songId=" + song.id;
    }

    private getSongArtUrl(song: Song) : string
    {
        return "Music/GetAlbumArt?songId=" + song.id;
    }

    private selectSong(song : Song, queueIndex?: number)
    {
        if (this.musicPlayer)
            this.musicPlayer.selectSong(song, queueIndex);
        this.setState({selectedSong: song});
        if (queueIndex == undefined)
            return;
        this.createQueue(queueIndex);
    }

    private setNextSong(song: Song | undefined)
    {
        this.setState({nextSong: song});
    }

    private createQueue(startingIndex: number)
    {
        var queue = [...this.state.songList];
        queue = this.rotateArray(queue, startingIndex);
        queue.shift();
        this.setState({queue: queue}, this.getNextSongFromQueue.bind(this));
    }

    private getNextSongFromQueue()
    {
        var queue = this.state.queue;
        if (queue.length < 1)
            return;
        
        this.setNextSong(queue.shift())
        this.setState({queue: queue});
    }

    public render()
    {
        return <div style={{display: "flex", flexDirection: "column"}}>
            <ul className="selection-list">
                {
                    this.state.songList.map((song, index) =>
                        <li key={"song"+song.id} className="hidden-parent list-item"
                            style={{background: this.state.selectedSong && this.state.selectedSong.id === song.id ? "#C6EDFF" : undefined}}
                            onClick={() => 
                            {
                                this.selectSong(song, index);
                            }}>
                            {(index + 1) + ". " + (song.artists.length > 0 ? song.artists.map(artist => artist.name).join(", ") : "Unknown Artist") + " - " + song.title}
                        </li>
                    )
                }
            </ul>
        </div>
    }
}