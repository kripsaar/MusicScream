import * as React from 'react';
import {Communication} from '../../Communication';
import {Song, PlayableElement} from '../../Models/SongModel';
import { MusicPlayerControls } from './MusicPlayerControls';
import { SongList } from './SongList';
import { Playlist } from './Playlist';

const STOP_STATE : string = "stop";
const PLAY_STATE : string = "play";
const PAUSE_STATE : string = "pause";

export class MusicPlayer
{
    public audioElement : HTMLAudioElement;
    public playlist : Playlist;

    selectedSong : PlayableElement | null;
    nextSong: Song | undefined;
    previousSong: Song | undefined;
    songState: string;
    queue: Song[];

    constructor()
    {
        this.playlist = Playlist.getEmptyPlaylist();
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

    private getSongUrl(song: PlayableElement) : string
    {
        return "Music/GetSong?songId=" + song.getSong().id;
    }

    public getSongArtUrl(song: PlayableElement) : string
    {
        return "Music/GetAlbumArt?songId=" + song.getSong().id;
    }

    private selectSong(song : PlayableElement | null)
    {
        if (!song)
            return;
        this.selectedSong = song;
        this.audioElement.setAttribute("src", this.getSongUrl(song));
    }

    public startPlayback()
    {
        var song = this.playlist.getCurrentSong();
        if (song == null)
            return;
        this.selectedSong = song;
        this.audioElement.setAttribute("src", this.getSongUrl(song));
    }

    public togglePlayPause()
    {
        if (!this.audioElement)
            return;
        if (!this.selectedSong)
        {
            this.startPlayback();
        }
        if (this.audioElement.paused)
            this.audioElement.play();
        else
            this.audioElement.pause();
    }

    public playNextSong()
    {
        if (!this.audioElement)
            return;
        this.selectSong(this.playlist.selectNextSong());
    }

    public playPreviousSong()
    {
        if (!this.audioElement)
            return;
        this.selectSong(this.playlist.selectPreviousSong());
    }
}

export const MusicPlayerInstance : MusicPlayer = new MusicPlayer();