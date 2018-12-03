import * as React from 'react';
import { Playlist } from '../../MusicPlayer/Playlist';
import { Communication } from '../../../Communication';
import { PlaylistTO } from '../../../Models/PlaylistModel';
import { PlaylistComponent } from '../../MusicPlayer/PlaylistComponent';

interface IPlaylistPageProps
{
    id: number;
}

interface IPlaylistPageState
{
    playlist: Playlist;
}

export class PlaylistPage extends React.Component<IPlaylistPageProps, IPlaylistPageState>
{
    constructor(props: IPlaylistPageProps, state: IPlaylistPageState)
    {
        super(props, state);
        this.state = {playlist : Playlist.getEmptyPlaylist()}
    }

    public componentDidMount()
    {
        this.getPlaylist(this.props.id);
    }

    public componentWillReceiveProps(nextProps: IPlaylistPageProps)
    {
        if (nextProps.id != this.state.playlist.getId())
            this.getPlaylist(nextProps.id);
    }

    private async getPlaylist(id: number)
    {
        let data = await Communication.simpleAjaxPromise("Playlist/GetPlaylist?Id=" + id);
        if (data.playlistTO)
        {
            var playlistTO : PlaylistTO = data.playlistTO;
            var playlist = await Playlist.fromPlaylistTO(playlistTO);
            this.setState({playlist: playlist});
        }
    }

    public render()
    {
        var playlist = this.state.playlist;
        var name = this.state.playlist.getName();
        return <div>
                <div style={{fontSize: "3em"}}>{name}</div>
                <br/>
                <div>
                    <PlaylistComponent playlist={playlist} />
                </div>
            </div>
    }
}