import * as React from 'react';

interface IMusicPlayerControlsProps
{
    audioElement: HTMLAudioElement | null;
    onPlayPause: () => void;
    onStop?: () => void;
    onPrevious: () => void;
    onNext: () => void;
}

interface IMusicPlayerControlsState
{
    paused: boolean;
}

export class MusicPlayerControls extends React.Component<IMusicPlayerControlsProps, IMusicPlayerControlsState>
{
    constructor(props: IMusicPlayerControlsProps, state: IMusicPlayerControlsState)
    {
        super(props, state);
        this.state = {paused: true};
    }

    componentWillReceiveProps(nextProps: IMusicPlayerControlsProps)
    {
        if (nextProps.audioElement)
        {
            nextProps.audioElement.onpause = () => this.setState({paused: true});
            nextProps.audioElement.onplay = () => this.setState({paused: false});
        }
    }

    public render()
    {
        return <div>
            <span className="glyphicon glyphicon-step-backward" onClick={this.props.onPrevious}></span>
            <span className={this.state.paused ? "glyphicon glyphicon-play" : "glyphicon glyphicon-pause"} onClick={this.props.onPlayPause}></span>
            <span className="glyphicon glyphicon-step-forward" onClick={this.props.onNext}></span>
        </div>
    }
}