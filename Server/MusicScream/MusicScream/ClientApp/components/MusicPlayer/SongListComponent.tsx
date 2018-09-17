import * as React from 'react';
import { MusicPlayer, MusicPlayerInstance } from "./MusicPlayer";
import { Communication } from '../../Communication';
import { SongList } from './SongList';
import { Draggable, Droppable, DragComponent, DragState } from "react-dragtastic";
import { SongListContainer } from './SongListContainer';

interface ISongListComponentState
{
    songList : SongList;
    songListContainer: SongListContainer;
    songState: string;
    currIndex: number;
    testList : string[];
}

const STOP_STATE : string = "stop";
const PLAY_STATE : string = "play";
const PAUSE_STATE : string = "pause";

export class SongListComponent extends React.Component<{}, ISongListComponentState>
{
    musicPlayer = MusicPlayerInstance;

    constructor(props: {}, state: ISongListComponentState)
    {
        super(props, state);
        var songList = new SongList([]);
        this.state = 
        {   
            songList: songList,
            songListContainer: new SongListContainer(songList),
            songState: STOP_STATE,
            currIndex: 0
            , testList: ["One", "Two", "Three"]
        }
    }

    public componentDidMount()
    {
        this.getSongList();
        this.refreshLibrary();
    }

    public componentWillUnmount()
    {
        this.state.songList.removeIndexChangeEventHandler(this.handleIndexChange);
    }

    private handleIndexChange = (newIndex: number) => 
    {
        this.setState({currIndex: newIndex});
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
                    var songList = new SongList(data.songs);
                    var externalSongList = new SongList(data.songs.slice(0, 2), "External Song List");
                    var internalSongList = new SongList(data.songs.slice(3), "Internal Song List");
                    var deepSongList = new SongList(data.songs.slice(0, 3), "Deeper Song List");
                    internalSongList.queueSongList(deepSongList);
                    internalSongList.queueSongs(...data.songs.slice(4, 5));
                    externalSongList.queueSongList(internalSongList);
                    var songListContainer = new SongListContainer(externalSongList);
                    this.setState({songList: songList, songListContainer: songListContainer});
                    this.musicPlayer.songList = songList;
                    songList.addIndexChangeEventHandler(this.handleIndexChange);
                }
            }
        );
    }

    private selectSong(queueIndex: number)
    {
        var song = this.state.songList.selectSong(queueIndex);
        if (!song)
            return;
        if (this.musicPlayer)
            this.musicPlayer.selectSong(song, queueIndex);
    }

    private reorderList(currIndex: number | string | undefined, newIndex: number)
    {
        if (!(typeof currIndex == 'number'))
            return;
        if (currIndex == newIndex || currIndex + 1 == newIndex)
            return;
        var element = this.state.testList[currIndex];
        var list = this.state.testList;
        list.splice(currIndex, 1);
        if (currIndex < newIndex)
            newIndex--;
        if (newIndex < list.length)
            list.splice(newIndex, 0, element);
        else
            list.push(element);
        this.setState({testList: list});
    }

    private moveSongListContainerElement(currIndex: number | string | undefined, newIndex: number)
    {
        if (!(typeof currIndex == 'number'))
            return;
        if (currIndex == newIndex || currIndex + 1 == newIndex)
            return;
        this.state.songListContainer.moveElement(currIndex, newIndex);
        this.setState({songListContainer: this.state.songListContainer});
    }

    public render()
    {
        return <div style={{display: "flex", flexDirection: "column"}}>

            <div className="selection-list" style={{display: "flex", flexDirection: "column"}}>
                {
                    this.state.songListContainer.getFlatList().map((element, index) =>
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
                                            style={{opacity: currentlyDraggingId == index ? 0 : undefined}}
                                        >
                                            <div className="draggable-element" style={{display: "flex", alignItems: "center"}}
                                                onClick={() => 
                                                {
                                                    if (SongListContainer.isSong(element))
                                                        this.state.songListContainer.selectSong(index);
                                                    else if (SongListContainer.isSongListMarker(element))
                                                    {
                                                        this.state.songListContainer.shrinkSongList(index);
                                                        this.setState({songListContainer: this.state.songListContainer});
                                                    }
                                                    else if (SongListContainer.isSongListContainer(element))
                                                    {
                                                        this.state.songListContainer.expandSongList(index);
                                                        this.setState({songListContainer: this.state.songListContainer});
                                                    }
                                                }}
                                            >
                                                <span>
                                                    <Draggable type="draggableList" id={index}>
                                                        {({events}) => (
                                                            <div 
                                                                className="glyphicon glyphicon-option-vertical drag-button"
                                                                {...events}
                                                                onClick={(event) => {event.stopPropagation()}}
                                                                style={{cursor: "grab"}}
                                                            />
                                                        )}
                                                    </Draggable>
                                                </span>
                                                <span>
                                                    {(index + 1) + ". " 
                                    + (SongListContainer.isSong(element) ? ((element.artists.length > 0 ? element.artists.map(artist => artist.name).join(", ") : "Unknown Artist") + " - " + element.title)
                                    : (SongListContainer.isSongListMarker(element) ? (element.isStart() ? "[Start] " : "[End] ") + element.getSongListContainer().getName()
                                    : "[Folded] " + element.getName()))}
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
                                                        className="glyphicon glyphicon-option-vertical drag-button"
                                                        style={{opacity: 1}}
                                                    />
                                                    <span>
                                                        {(index + 1) + ". " 
                                    + (SongListContainer.isSong(element) ? ((element.artists.length > 0 ? element.artists.map(artist => artist.name).join(", ") : "Unknown Artist") + " - " + element.title)
                                    : (SongListContainer.isSongListMarker(element) ? (element.isStart() ? "[Start] " : "[End] ") + element.getSongListContainer().getName()
                                    : "[Folded] " + element.getName()))}
                                                    </span>
                                                </div>
                                            )}
                                        </DragComponent>
                                    </div>
                                    {(isDragging && index == this.state.songListContainer.getFlatList().length -1) ? 
                                        <div className={"draggable-list-item-empty" 
                                            + ((currentlyHoveredDroppableId != (index + 1))
                                            ? " hidden-drag" : "")
                                            }
                                            style={{ overflow: "visible" }}
                                        >
                                            <Droppable accepts="draggableList" id={this.state.songListContainer.getFlatList().length}
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
            <div style={{width: "100%", height: "100px"}}/>
            <ul className="selection-list">
                {
                    this.state.songList.getFlatList().map((song, index) =>
                        <li key={"song"+song.id} className="hidden-parent list-item"
                            style={{background: this.state.currIndex == index ? "#C6EDFF" : undefined}}
                            onClick={() => 
                            {
                                this.selectSong(index);
                            }}>
                            {(index + 1) + ". " + (song.artists.length > 0 ? song.artists.map(artist => artist.name).join(", ") : "Unknown Artist") + " - " + song.title}
                        </li>
                    )
                }
            </ul>
        </div>
    }
}