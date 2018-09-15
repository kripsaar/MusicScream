import * as React from 'react';
import { MusicPlayer, MusicPlayerInstance } from "./MusicPlayer";
import { Communication } from '../../Communication';
import { SongList } from './SongList';

interface ISongListComponentState
{
    songList : SongList;
    songState: string;
    currIndex: number;
}

const STOP_STATE : string = "stop";
const PLAY_STATE : string = "play";
const PAUSE_STATE : string = "pause";

export class SongListComponent extends React.Component<{}, ISongListComponentState>
{
    musicPlayer = MusicPlayerInstance;

    constructor(props: {}, state: ISongListComponentState)
    {
        super(props, state);
        this.state = 
        {   
            songList: new SongList([]),
            songState: STOP_STATE,
            currIndex: 0
        }
    }

    public componentDidMount()
    {
        this.getSongList();
        this.refreshLibrary();
    }

    public componentWillUnmount()
    {
        this.state.songList.removeIndexChangeEventHandler(this.handleIndexChange);
    }

    private handleIndexChange = (newIndex: number) => 
    {
        this.setState({currIndex: newIndex});
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
                    var songList = new SongList(data.songs);
                    this.setState({songList: songList});
                    this.musicPlayer.songList = songList;
                    songList.addIndexChangeEventHandler(this.handleIndexChange);
                }
            }
        );
    }

    private selectSong(queueIndex: number)
    {
        var song = this.state.songList.selectSong(queueIndex);
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
                    this.state.songList.getFlatList().map((song, index) =>
                        <li key={"song"+song.id} className="hidden-parent list-item"
                            style={{background: this.state.currIndex == index ? "#C6EDFF" : undefined}}
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