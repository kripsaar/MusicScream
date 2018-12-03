import * as React from 'react';
import { MusicPlayerInstance } from "./MusicPlayer";
import { Communication } from '../../Communication';
import { Draggable, Droppable, DragComponent, DragState } from "react-dragtastic";

import { MdDragHandle } from 'react-icons/md';
import { Playlist } from './Playlist';
import { PlaylistTO } from 'ClientApp/Models/PlaylistModel';

interface IPlaylistComponentProps
{
    playlist: Playlist;
}

interface IPlaylistComponentState
{
    playlist : Playlist;
    songState: string;
    currIndex: number;
}

const STOP_STATE : string = "stop";
const PLAY_STATE : string = "play";
const PAUSE_STATE : string = "pause";

export class PlaylistComponent extends React.Component<IPlaylistComponentProps, IPlaylistComponentState>
{
    musicPlayer = MusicPlayerInstance;

    constructor(props: IPlaylistComponentProps, state: IPlaylistComponentState)
    {
        super(props, state);
        var playlist = Playlist.getEmptyPlaylist();
        this.state = 
        {   
            playlist: playlist,
            songState: STOP_STATE,
            currIndex: 0
        }
        this.setPlaylist(props.playlist);
    }

    public componentDidMount()
    {
        this.refreshLibrary();
    }

    public componentWillUnmount()
    {
        this.state.playlist.removeIndexChangeEventHandler(this.handleSongChange);
    }

    public componentWillReceiveProps(nextProps: IPlaylistComponentProps)
    {
        if (nextProps.playlist.getId() != this.state.playlist.getId())
            this.setPlaylist(nextProps.playlist)
    }

    private handleSongChange = () => 
    {
        this.forceUpdate();
    }

    private refreshLibrary()
    {
        Communication.simpleAjax("Music/RefreshMusicLibrary", 
            () => { /*this.getPlaylist(1);*/ },
            () => { console.log("Refresh failed!"); }
        );
    }

    private setPlaylist(playlist: Playlist)
    {
        this.setState({playlist: playlist});
        this.musicPlayer.playlist = playlist;
        playlist.addIndexChangeEventHandler(this.handleSongChange);
    }

    private async getPlaylist(playlistId : number)
    {
        let data = await Communication.simpleAjaxPromise("Playlist/GetPlaylist?Id=" + playlistId);
        if (data.playlistTO)
        {
            var playlistTO : PlaylistTO = data.playlistTO;
            var playlist = await Playlist.fromPlaylistTO(playlistTO);
            // this.setState({playlist: playlist});
            this.musicPlayer.playlist = playlist;
            playlist.addIndexChangeEventHandler(this.handleSongChange);
        }
    }

    private async getSongList()
    {
        let data = await Communication.getJsonPromise("Music/GetAllSongs");
        if (data.songs)
        {
            var externalPlaylist = await Playlist.createPlaylist(false ,data.songs.slice(0, 2), "External Song List");
            var internalPlaylist = await Playlist.createPlaylist(false, data.songs.slice(3), "Internal Song List");
            var deepPlaylist = await Playlist.createPlaylist(false, data.songs.slice(0, 3), "Deeper Song List");
            internalPlaylist.queuePlaylist(deepPlaylist);
            internalPlaylist.queuePlaylist(deepPlaylist);
            internalPlaylist.removeElement(internalPlaylist.getLength() - 2);
            internalPlaylist.queueSongs(...data.songs.slice(4, 5));
            externalPlaylist.queuePlaylist(internalPlaylist);

            var playlist = externalPlaylist;

            // this.setState({playlist: externalPlaylist});
            this.musicPlayer.playlist = playlist;
        }
    }

    private selectSong(index: number)
    {
        var song = this.state.playlist.selectSong(index);
        if (!song)
            return;
        if (this.musicPlayer)
            this.musicPlayer.startPlayback();
        this.forceUpdate();
    }

    private moveSongListContainerElement(currIndex: number | string | undefined, newIndex: number)
    {
        if (!(typeof currIndex == 'number'))
            return;
        if (currIndex == newIndex || currIndex + 1 == newIndex)
            return;
        this.state.playlist.moveElement(currIndex, newIndex);
        this.setState({playlist: this.state.playlist});
    }

    public render()
    {
        return <div style={{display: "flex", flexDirection: "column"}}>

            <div className="selection-list" style={{display: "flex", flexDirection: "column"}}>
                {
                    this.state.playlist.getFlatList().map((element, index) =>
                        <DragState>
                            {({currentlyDraggingId, isDragging, currentlyHoveredDroppableId}) => (
                                <div>
                                    <div className={"drag-element-frame"
                                        + ((currentlyDraggingId == index
                                            && currentlyHoveredDroppableId != index
                                            && currentlyHoveredDroppableId != undefined)
                                        ? " hidden-drag" : "")}
                                    >
                                        <Droppable accepts="draggableList" id={index} onDrop={() => this.moveSongListContainerElement(currentlyDraggingId, index)}>
                                            {({events: dropEvents, isOver}) => (
                                                <div 
                                                    {...dropEvents}
                                                    style=
                                                    {{
                                                        height: "100%",
                                                        width: "100%",
                                                        position: "absolute",
                                                        top: (isOver && currentlyDraggingId != index) ? "-25%" : "-50%",
                                                        opacity: 0,
                                                        zIndex: isDragging ? 4 : -1,
                                                        cursor: isDragging ? "grabbing" : undefined
                                                    }}
                                                />
                                            )}
                                        </Droppable>
                                        {isDragging && (
                                            <div 
                                                className={"draggable-list-item-empty" 
                                                    + ((currentlyHoveredDroppableId != index
                                                        || currentlyDraggingId == index)
                                                    ? " hidden-drag" : "")}
                                            />
                                        )}
                                        <div 
                                            className={"draggable-list-item"}
                                            style={{
                                                opacity: currentlyDraggingId == index ? 0 : undefined,
                                                background: this.musicPlayer.selectedSong != null && element.getUuid() == this.musicPlayer.selectedSong.getUuid() ? "#C6EDFF" : undefined
                                            }}
                                        >
                                            <div className="draggable-element" style={{display: "flex", alignItems: "center"}}
                                                onClick={() => 
                                                {
                                                    if (Playlist.isSong(element))
                                                        this.selectSong(index);
                                                    else if (Playlist.isPlaylistMarker(element))
                                                    {
                                                        this.state.playlist.foldPlaylist(index);
                                                        this.setState({playlist: this.state.playlist});
                                                    }
                                                    else if (Playlist.isPlaylist(element))
                                                    {
                                                        this.state.playlist.unfoldPlaylist(index);
                                                        this.setState({playlist: this.state.playlist});
                                                    }
                                                }}
                                            >
                                                <span>
                                                    <Draggable type="draggableList" id={index}>
                                                        {({events}) => (
                                                            <div 
                                                                className="drag-button"
                                                                {...events}
                                                                onClick={(event) => {event.stopPropagation()}}
                                                                style={{cursor: "grab"}}
                                                            >
                                                                <MdDragHandle style={{verticalAlign: "text-top"}}/>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                </span>
                                                <span>
                                                    {(index + 1) + ". " 
                                    + (Playlist.isSong(element) ? ((element.getSong().artists.length > 0 ? element.getSong().artists.map(artist => artist.name).join(", ") : "Unknown Artist") + " - " + element.getSong().title)
                                    : (Playlist.isPlaylistMarker(element) ? (element.isStart() ? "[Start] " : "[End] ") + element.getPlaylist().getName()
                                    : "[Folded] " + (element as Playlist).getName()))}
                                                </span>
                                            </div>
                                        </div>
                                        <DragComponent for={index}>
                                            {({x, y}) => (
                                                <div
                                                    className={"dragging-list-item"}
                                                    style=
                                                    {{
                                                        position: "fixed",
                                                        width: "auto",
                                                        left: x - 26,
                                                        top: y - 23,
                                                        zIndex: 3,
                                                        backgroundColor: "white",
                                                        cursor: "grabbing",
                                                        boxSizing: "border-box"
                                                    }}
                                                >
                                                    <span 
                                                        className="drag-button"
                                                        style={{opacity: 1}}
                                                    >
                                                        <MdDragHandle style={{verticalAlign: "text-top"}}/>
                                                    </span>
                                                    <span>
                                                        {(index + 1) + ". " 
                                    + (Playlist.isSong(element) ? ((element.getSong().artists.length > 0 ? element.getSong().artists.map(artist => artist.name).join(", ") : "Unknown Artist") + " - " + element.getSong().title)
                                    : (Playlist.isPlaylistMarker(element) ? (element.isStart() ? "[Start] " : "[End] ") + element.getPlaylist().getName()
                                    : "[Folded] " + (element as Playlist).getName()))}
                                                    </span>
                                                </div>
                                            )}
                                        </DragComponent>
                                    </div>
                                    {(isDragging && index == this.state.playlist.getFlatList().length -1) ? 
                                        <div className={"draggable-list-item-empty" 
                                            + ((currentlyHoveredDroppableId != (index + 1))
                                            ? " hidden-drag" : "")
                                            }
                                            style={{ overflow: "visible" }}
                                        >
                                            <Droppable accepts="draggableList" id={this.state.playlist.getFlatList().length}
                                                onDrop={() => this.moveSongListContainerElement(currentlyDraggingId, index + 1)}
                                            >
                                                {({events, isOver}) => (
                                                    <div 
                                                        {...events}
                                                        style=
                                                        {{
                                                            height: isOver ? "69px" : "23px",
                                                            width: "100%",
                                                            position: "absolute",
                                                            top: "-23px",
                                                            opacity: 1,
                                                            zIndex: 4,
                                                            cursor: "grabbing",
                                                        }}
                                                    />
                                                )}
                                            </Droppable>
                                        </div>
                                    : null}
                                </div>
                            )}
                        </DragState>
                    )
                }
            </div>
        </div>
    }
}