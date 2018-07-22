import * as React from 'react';
import Slider from 'rc-slider';

import 'rc-slider/assets/index.css'

interface IMusicPlayerControlsProps
{
    audioElement: HTMLAudioElement | null;
    onPlayPause: () => void;
    onStop?: () => void;
    onPrevious: () => void;
    onNext: () => void;
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
}

export class MusicPlayerControls extends React.Component<IMusicPlayerControlsProps, IMusicPlayerControlsState>
{
    constructor(props: IMusicPlayerControlsProps, state: IMusicPlayerControlsState)
    {
        super(props, state);
        this.state = {paused: true, shuffle: false, repeat: false, muted: false, volume: 100};
    }

    componentWillReceiveProps(nextProps: IMusicPlayerControlsProps)
    {
        if (nextProps.audioElement)
        {
            nextProps.audioElement.onpause = () => this.setState({paused: true});
            nextProps.audioElement.onplay = () => this.setState({paused: false});
        }
    }

    private changeVolume(value: number)
    {
        this.setState({volume: value, muted: false});
        if(!this.props.audioElement)
            return;
        this.props.audioElement.volume = value / 100;
        this.props.audioElement.muted = false;
    }

    private toggleMute()
    {
        if (!this.props.audioElement)
            return;
        if (this.state.muted)
        {
            this.setState({muted: false, volume: this.props.audioElement.volume * 100});
            this.props.audioElement.muted = false;
        }
        else
        {
            this.setState({muted: true, volume: 0});
            this.props.audioElement.muted = true;
        }
    }

    public render()
    {
        var volumeIcon: string;
        if (this.state.muted || this.state.volume == 0)
            volumeIcon = "glyphicon glyphicon-volume-off";
        else if (this.state.volume < 50)
            volumeIcon = "glyphicon glyphicon-volume-down";
        else
            volumeIcon = "glyphicon glyphicon-volume-up";

        return <div style={{backgroundColor: "#D3D3D3", position: "relative", display: "flex", justifyContent: "center", alignItems: "center"}}>
            {this.props.onShuffle ?
                <span 
                    className={"glyphicon glyphicon-random" + (this.state.shuffle ? " media-control-button-active" : " media-control-button")}
                    onClick={this.props.onShuffle}
                />
            : null}
            <span className="glyphicon glyphicon-step-backward media-control-button"
                onClick={this.props.onPrevious}
            />
            <span 
                className={"media-control-button " + (this.state.paused ? "glyphicon glyphicon-play" : "glyphicon glyphicon-pause")}
                onClick={this.props.onPlayPause}
            />
            {this.props.onStop ?
                <span 
                    className={"glyphicon glyphicon-stop media-control-button"}
                    onClick={this.props.onStop}
                />
            : null}
            <span className="glyphicon glyphicon-step-forward media-control-button"
                onClick={this.props.onNext}
            />
            {this.props.onRepeat ?
                <span 
                    className={"glyphicon glyphicon-retweet" + (this.state.repeat ? " media-control-button-active" : " media-control-button")}
                    onClick={this.props.onRepeat}
                />
            : null}
            <div style={{position: "absolute", right: "10px", display: "flex", alignItems: "center"}}>
                <span 
                    className={"media-control-button " + volumeIcon}
                    onClick={this.toggleMute.bind(this)}
                />
                <Slider 
                    style={{margin: "auto", width: "100px"}}
                    value={this.state.volume}
                    onChange={this.changeVolume.bind(this)}
                />
            </div>
        </div>
    }
}