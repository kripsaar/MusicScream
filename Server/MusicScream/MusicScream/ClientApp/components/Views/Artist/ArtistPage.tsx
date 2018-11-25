import * as React from 'react';
import { Communication } from '../../../Communication';
import { Artist } from '../../../Models/ArtistModel';
import { Link } from 'react-router-dom';
import { MdAlbum } from 'react-icons/md';

interface IArtistPageProps
{
    id : number;
}

interface IArtistPageState
{
    artist: Artist;
}

export class ArtistPage extends React.Component<IArtistPageProps, IArtistPageState>
{
    constructor(props: IArtistPageProps, state: IArtistPageState)
    {
        super(props, state);
        this.state = {artist: {id: 0, name: "", aliases: [], albums: [], songs: [], units: [], unitMembers: []}};
    }

    public componentDidMount()
    {
        this.getArtist(this.props.id);
    }

    public componentWillReceiveProps(nextProps: IArtistPageProps)
    {
        if (nextProps.id != this.state.artist.id)
            this.getArtist(nextProps.id);
    }

    private async getArtist(id: number)
    {
        let data = await Communication.simpleAjaxPromise("Music/GetArtist?Id=" + id);
        if (data.artist)
        {
            var artist = data.artist
            this.setState({artist: artist});
        }
    }

    public render()
    {
        var artist = this.state.artist;
        var name = this.state.artist.name;
        return <div>
                <div style={{fontSize: "3em"}}>{name}</div>
                <div>
                    <span style={{fontWeight: "bold"}}>{"Also known as: "}</span>
                    <span>{artist.aliases.join(", ")}</span>
                </div>
                { artist.units.length > 0 ?
                    <div>
                        <span style={{fontWeight: "bold"}}>Member of: </span>
                        {artist.units.map((value, index) =>
                            <span>
                                <span>{(index == 0 ? "" : ", ")}</span>
                                <Link to={"/Artist/" + value.id}>
                                    {value.name}
                                </Link>
                            </span>
                        )}
                    </div>
                : null }
                { artist.unitMembers.length > 0 ?
                    <div>
                        <span style={{fontWeight: "bold"}}>Members: </span>
                        {artist.unitMembers.map((value, index) =>
                            <span>
                                <span>{(index == 0 ? "" : ", ")}</span>
                                <Link to={"/Artist/" + value.id}>
                                    {value.name}
                                </Link>
                            </span>
                        )}
                    </div>
                : null }
                <br/>
                <span style={{fontWeight: "bold"}}>Albums: </span>
                <ul className="selection-list" style={{display: "flex", flexDirection: "column"}}>
                    { artist.albums.map((element, index) =>
                        <li key={"album-" + element.id} className="list-item">
                            {element.title}
                        </li>
                    )}
                </ul>
                <br/>
                <span style={{fontWeight: "bold"}}>Songs: </span>
                <ul className="selection-list" style={{display: "flex", flexDirection: "column"}}>
                    { artist.songs.map((element, index) =>
                        <li key={"album-" + element.id} className="list-item">
                            {element.title}
                        </li>
                    )}
                </ul>
            </div>
    }
}