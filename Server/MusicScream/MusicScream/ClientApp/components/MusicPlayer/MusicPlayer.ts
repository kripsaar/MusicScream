import * as React from 'react';
import {Communication} from '../../Communication';
import {Song} from '../../Models/SongModel';
import { MusicPlayerControls } from './MusicPlayerControls';

const STOP_STATE : string = "stop";
const PLAY_STATE : string = "play";
const PAUSE_STATE : string = "pause";

export class MusicPlayer
{
    public audioElement : HTMLAudioElement;
    public songList : Song[] = [];

    selectedSong : Song | null;
    nextSong: Song | undefined;
    previousSong: Song | undefined;
    songState: string;
    queue: Song[];

    constructor()
    {
        this.selectedSong = null;
        this.nextSong = undefined;
        this.previousSong = undefined;
        this.songState = STOP_STATE;
        this.queue = [];
        this.audioElement = document.createElement("audio");
        this.audioElement.setAttribute("autoplay", "true");
        this.audioElement.onended = this.playNextSong.bind(this);
        document.body.appendChild(this.audioElement);
    }

    private rotateArray(array: any[], count: number) : any[]
    {
        if (array.length < 1)
            return array;
        count -= array.length * Math.floor(count / array.length);
        array.push.apply(array, array.splice(0, count));
        return array;
    }

    private getSongUrl(song: Song) : string
    {
        return "Music/GetSong?songId=" + song.id;
    }

    private getSongArtUrl(song: Song) : string
    {
        return "Music/GetAlbumArt?songId=" + song.id;
    }

    public selectSong(song : Song, queueIndex?: number)
    {
        this.selectedSong = song;
        this.audioElement.setAttribute("src", this.getSongUrl(song));
        if (queueIndex == undefined)
            return;
        this.createQueue(queueIndex);
    }

    private setNextSong(song: Song | undefined)
    {
        this.nextSong = song;
    }

    private createQueue(startingIndex: number)
    {
        var queue = [...this.songList];
        queue = this.rotateArray(queue, startingIndex);
        queue.shift();
        this.queue = queue;
        this.getNextSongFromQueue();
    }

    private getNextSongFromQueue()
    {
        var queue = this.queue;
        if (queue.length < 1)
            return;
        
        this.setNextSong(queue.shift())
        this.queue = queue;
    }

    public togglePlayPause()
    {
        if (!this.audioElement)
            return;
        if (!this.selectedSong)
        {
            if (this.songList.length < 1)
                return;
            this.selectSong(this.songList[0], 0);
        }
        if (this.audioElement.paused)
            this.audioElement.play();
        else
            this.audioElement.pause();
    }

    public playNextSong()
    {
        if (!this.nextSong || !this.audioElement)
            return;
        this.selectSong(this.nextSong);
        this.getNextSongFromQueue();
    }

    public playPreviousSong()
    {
        if (!this.previousSong || !this.audioElement)
            return;
        this.selectSong(this.previousSong);
    }

    // public oldrender()
    // {
    //     return <div style={{display: "flex", flexDirection: "column"}}>
    //         <ul className="selection-list">
    //             {
    //                 this.songList.map((song, index) =>
    //                     <li key={"song"+song.id} className="hidden-parent list-item"
    //                         style={{background: this.state.selectedSong && this.state.selectedSong.id === song.id ? "#C6EDFF" : undefined}}
    //                         onClick={() => 
    //                         {
    //                             this.selectSong(song, index);
    //                         }}>
    //                         {(index + 1) + ". " + (song.artists.length > 0 ? song.artists.map(artist => artist.name).join(", ") : "Unknown Artist") + " - " + song.title}
    //                     </li>
    //                 )
    //             }
    //         </ul>
    //         <hr/>
    //         <div style={{display: "flex"}}>
    //             <div style={{marginLeft: "auto", marginRight: "auto", height: "200px", flex: "0 0 auto"}}>
    //                 <img 
    //                     src={this.state.selectedSong ? this.getSongArtUrl(this.state.selectedSong) : undefined} 
    //                     alt="Nope"
    //                     style={{height: "100%"}}
    //                     onClick={this.togglePlayPause.bind(this)}
    //                 />
    //             </div>
    //         </div>
    //         <MusicPlayerControls 
    //             musicPlayer={this}
    //             onRepeat={() => {}}
    //             onShuffle={() => {}}
    //         />
    //     </div>
    // }

    // public render()
    // {
    //     return <audio 
    //         ref={(audio) => this.audioElement = audio}
    //         autoPlay
    //         onEnded={() => this.playNextSong()}
    //         src={this.state.selectedSong ? this.getSongUrl(this.state.selectedSong) : undefined}
    //     />
    // }
}

export const MusicPlayerInstance : MusicPlayer = new MusicPlayer();