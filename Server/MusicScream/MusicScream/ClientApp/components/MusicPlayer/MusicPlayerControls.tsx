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
        this.setState({volume: value});
        if(!this.props.audioElement)
            return;
        this.props.audioElement.volume = value / 100;
    }

    public render()
    {
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
                    className="glyphicon glyphicon-volume-off media-control-button"
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