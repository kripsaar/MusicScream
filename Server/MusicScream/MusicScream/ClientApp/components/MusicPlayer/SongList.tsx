import * as React from 'react';
import { MusicPlayer, MusicPlayerInstance } from "./MusicPlayer";
import { Communication } from '../../Communication';
import { SongQueue } from './SongQueue';

interface ISongListState
{
    songQueue : SongQueue;
    songState: string;
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
        this.state = {songQueue: new SongQueue([]), songState: STOP_STATE}
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
                    var songQueue = new SongQueue(data.songs);
                    this.setState({songQueue: songQueue});
                    this.musicPlayer.songQueue = songQueue;
                }
            }
        );
    }

    private selectSong(queueIndex: number)
    {
        var song = this.state.songQueue.selectSong(queueIndex);
        if (!song)
            return;
        if (this.musicPlayer)
            this.musicPlayer.selectSong(song, queueIndex);
    }

    public render()
    {
        return <div style={{display: "flex", flexDirection: "column"}}>
            <ul className="selection-list">
                {
                    this.state.songQueue.getQueue().map((song, index) =>
                        <li key={"song"+song.id} className="hidden-parent list-item"
                            style={{background: this.state.songQueue.getCurrentIndex() == index ? "#C6EDFF" : undefined}}
                            onClick={() => 
                            {
                                this.selectSong(index);
                            }}>
                            {(index + 1) + ". " + (song.artists.length > 0 ? song.artists.map(artist => artist.name).join(", ") : "Unknown Artist") + " - " + song.title}
                        </li>
                    )
                }
            </ul>
        </div>
    }
}