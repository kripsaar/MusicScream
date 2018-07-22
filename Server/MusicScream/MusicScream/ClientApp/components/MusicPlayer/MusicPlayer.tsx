import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import {Communication} from '../../Communication';
import {Song} from '../../Models/SongModel';
import { MusicPlayerControls } from './MusicPlayerControls';

interface IMusicPlayerState
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

export class MusicPlayer extends React.Component<{}, IMusicPlayerState>
{
    audioElement : HTMLAudioElement | null = null;

    constructor(props: {}, state: IMusicPlayerState)
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

    private togglePlay()
    {
        if (!this.audioElement)
            return;
        if (!this.state.selectedSong)
        {
            if (this.state.songList.length < 1)
                return;
            this.selectSong(this.state.songList[0], 0);
        }
        if (this.audioElement.paused)
            this.audioElement.play();
        else
            this.audioElement.pause();
    }

    private onNextSong()
    {
        if (!this.state.nextSong || !this.audioElement)
            return;
        this.selectSong(this.state.nextSong);
        this.getNextSongFromQueue();
    }

    private onPreviousSong()
    {
        if (!this.state.previousSong || !this.audioElement)
            return;
        this.selectSong(this.state.previousSong);
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
            <hr/>
            <div style={{display: "flex"}}>
                <div style={{marginLeft: "auto", marginRight: "auto", height: "200px", flex: "0 0 auto"}}>
                    <img 
                        src={this.state.selectedSong ? this.getSongArtUrl(this.state.selectedSong) : undefined} 
                        alt="Nope"
                        style={{height: "100%"}}
                        onClick={() => this.togglePlay()}
                    />
                </div>
                <audio 
                    ref={(audio) => this.audioElement = audio}
                    controls
                    style={{flexGrow: 1, flexShrink: 1, flexBasis: "auto", minWidth: "0px"}} 
                    autoPlay
                    disabled={!(this.state.selectedSong)}
                    onEnded={() => this.onNextSong()}
                    src={this.state.selectedSong ? this.getSongUrl(this.state.selectedSong) : undefined}
                />
            </div>
            <MusicPlayerControls 
                audioElement={this.audioElement}
                onPlayPause={this.togglePlay.bind(this)} 
                onPrevious={this.onPreviousSong.bind(this)}
                onNext={this.onNextSong.bind(this)}
                onRepeat={() => {}}
                onShuffle={() => {}}
            />
        </div>
    }
}