import * as React from 'react';
import Slider from 'rc-slider';
import { Link } from 'react-router-dom';

import 'rc-slider/assets/index.css'
import { MusicPlayer, MusicPlayerInstance } from './MusicPlayer';
import { ImageModal } from './ImageModal';

import { MdPlayCircleFilled, MdPauseCircleFilled, MdSkipNext, MdSkipPrevious,
        MdVolumeMute, MdVolumeUp, MdVolumeDown, MdVolumeOff, MdRepeat, MdStop, MdShuffle } from 'react-icons/md'

interface IMusicPlayerControlsProps
{
    onStop?: () => void;
    onShuffle?: () => void;
    onRepeat?: () => void;
}

interface IMusicPlayerControlsState
{
    paused: boolean;
    shuffle: boolean;
    repeat: boolean;
    muted: boolean;
    volume: number;
    currentTime: number;
    duration: number;
}

export class MusicPlayerControls extends React.Component<IMusicPlayerControlsProps, IMusicPlayerControlsState>
{
    musicPlayer = MusicPlayerInstance;

    constructor(props: IMusicPlayerControlsProps, state: IMusicPlayerControlsState)
    {
        super(props, state);
        this.state = {paused: true, shuffle: false, repeat: false, muted: false, volume: 100, currentTime: 0, duration: 0};
    }

    componentDidMount()
    {
        this.musicPlayer.audioElement.onpause = () => this.setState({paused: true});
        this.musicPlayer.audioElement.onplay = () => this.setState({paused: false});
        this.musicPlayer.audioElement.addEventListener("durationchange", () => this.setState({duration: this.musicPlayer.audioElement.duration}));
        this.musicPlayer.audioElement.addEventListener("timeupdate", this.timeUpdateHandler);
        this.setState({currentTime: this.musicPlayer.audioElement.currentTime, duration: this.musicPlayer.audioElement.duration});
    }

    private timeUpdateHandler = () =>
    {
        if (!this.musicPlayer.audioElement)
            return;
        this.setState({currentTime: this.musicPlayer.audioElement.currentTime});
    }

    private startSeek()
    {
        if (!this.musicPlayer.audioElement)
            return;

        this.musicPlayer.audioElement.removeEventListener("timeupdate", this.timeUpdateHandler);
    }

    private onSeek(value: number)
    {
        // We round to the nearest second when seeking
        this.setState({currentTime: Math.round(value)});
    }

    private finalizeSeek(value: number)
    {
        if (!this.musicPlayer.audioElement)
            return;

        this.musicPlayer.audioElement.currentTime = Math.round(value);
        this.musicPlayer.audioElement.addEventListener("timeupdate", this.timeUpdateHandler);
    }

    private changeVolume(value: number)
    {
        this.setState({volume: value, muted: false});
        if(!this.musicPlayer.audioElement)
            return;
        this.musicPlayer.audioElement.volume = value / 100;
        this.musicPlayer.audioElement.muted = false;
    }

    private toggleMute()
    {
        if (!this.musicPlayer.audioElement)
            return;
        if (this.state.muted)
        {
            this.setState({muted: false, volume: this.musicPlayer.audioElement.volume * 100});
            this.musicPlayer.audioElement.muted = false;
        }
        else
        {
            this.setState({muted: true, volume: 0});
            this.musicPlayer.audioElement.muted = true;
        }
    }

    private toggleShuffle()
    {
        this.setState({shuffle: !this.state.shuffle});
        if (this.props.onShuffle)
            this.props.onShuffle();
    }

    private toggleRepeat()
    {
        this.setState({repeat: !this.state.repeat});
        if (this.props.onRepeat)
            this.props.onRepeat();
    }

    private formatTime(totalSeconds: number) : string
    {
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds % 3600) / 60);
        var seconds = Math.floor(totalSeconds % 60);

        var result = (hours > 0 ? hours.toString() + ":" : "")
            + (minutes < 10 && hours > 0 ? "0" + minutes.toString() + ":" : "") + minutes.toString() + ":"
            + (seconds < 10 ? "0" : "") + seconds.toString();

        return result;
    }

    private togglePlayPause()
    {
        if (!this.musicPlayer)
            return;
        this.musicPlayer.togglePlayPause();
    }

    private playPreviousSong()
    {
        if (!this.musicPlayer)
            return;
        this.musicPlayer.playPreviousSong();
    }

    private playNextSong()
    {
        if (!this.musicPlayer)
            return;
        this.musicPlayer.playNextSong();
    }

    public render()
    {
        var duration = isNaN(this.state.duration) ? 0 : this.state.duration;

        return <div className="media-control-bar">
            <div className="media-control-currently-playing">
                { this.musicPlayer.selectedSong ?
                    // <a style={{height: "100%"}} href={this.musicPlayer.getSongArtUrl(this.musicPlayer.selectedSong)}>
                    //     <img 
                    //         src={this.musicPlayer.getSongArtUrl(this.musicPlayer.selectedSong)} 
                    //         alt="Nope"
                    //         style={{height: "100%"}}
                    //     />
                    // </a>
                    <ImageModal src={this.musicPlayer.getSongArtUrl(this.musicPlayer.selectedSong)} style={{height: "100%"}}>
                    </ImageModal>
                : null}
                <div style={{marginTop: "5px", marginLeft: "5px"}}>
                    <Link className="media-control-song-link" to={ "/" }>
                        {this.musicPlayer.selectedSong ? this.musicPlayer.selectedSong.title : undefined}
                    </Link>
                    <br/>
                    { this.musicPlayer.selectedSong ?
                        this.musicPlayer.selectedSong.artists.map((artist, index) => 
                            <span key={index}>
                                <Link className="media-control-artist-link" to={"/Artist/" + artist.id}>
                                    {artist.name}
                                </Link>
                                {index < this.musicPlayer.selectedSong!.artists.length - 1 ? ", " : ""}
                            </span>
                        )
                     : "Unknown Artist"}
                </div>
            </div>
            <div className="media-control-controls">
                <div className="media-control-slider-bar">
                    <div className="media-control-time" style={{justifyContent: "flex-end"}}>
                        {this.formatTime(this.state.currentTime)}
                    </div>
                    <Slider 
                        min={0}
                        max={duration}
                        step={0.10}
                        style={{marginTop: "5px", width: "100%"}}
                        value={this.state.currentTime}
                        onBeforeChange={this.startSeek.bind(this)}
                        onChange={this.onSeek.bind(this)}
                        onAfterChange={this.finalizeSeek.bind(this)}
                    />
                    <div className="media-control-time" style={{justifyContent: "flex-start"}}>
                        {this.formatTime(duration)}
                    </div>
                </div>
                <div className="media-control-button-bar">
                    {this.props.onShuffle ?
                        <span 
                            className={
                            (this.state.shuffle ? " media-control-button-active" : " media-control-button")}
                            onClick={this.toggleShuffle.bind(this)}
                        >
                            <MdShuffle className="media-control-button"/>
                        </span>
                    : null}
                    <span 
                        onClick={this.playPreviousSong.bind(this)}
                    >
                        <MdSkipPrevious className="media-control-button"/>
                    </span>
                    <span 
                        onClick={this.togglePlayPause.bind(this)}
                    >
                        {this.state.paused ? 
                            <MdPlayCircleFilled className="media-control-button" style={{fontSize: "3.5em"}}/>
                        :
                            <MdPauseCircleFilled className="media-control-button" style={{fontSize: "3.5em"}}/>
                        }
                    </span>
                    {this.props.onStop ?
                        <span 
                            onClick={this.props.onStop}
                        >
                            <MdStop className="media-control-button"/>
                        </span>
                    : null}
                    <span 
                        onClick={this.playNextSong.bind(this)}
                    >
                        <MdSkipNext className="media-control-button"/>
                    </span>
                    {this.props.onRepeat ?
                        <span 
                            className={
                                (this.state.repeat ? " media-control-button-active" : " media-control-button")}
                            onClick={this.toggleRepeat.bind(this)}
                        >
                            <MdRepeat className="media-control-button"/>
                        </span>
                    : null}
                </div>
            </div>
            <div className="media-control-volume">
                <span 
                    style={{fontSize: "0.8em"}}
                    onClick={this.toggleMute.bind(this)}
                >
                    { this.state.muted ? 
                        <MdVolumeOff className="media-control-button"/>
                    : this.state.volume == 0 ?
                        <MdVolumeMute className="media-control-button"/>
                    : this.state.volume < 50 ?
                        <MdVolumeDown className="media-control-button"/>
                    :
                        <MdVolumeUp className="media-control-button"/>
                    }
                </span>
                <Slider 
                    style={{width: "75px"}}
                    value={this.state.volume}
                    onChange={this.changeVolume.bind(this)}
                />
            </div>
        </div>
    }
}