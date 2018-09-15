import * as React from 'react';
import { MusicPlayer, MusicPlayerInstance } from "./MusicPlayer";
import { Communication } from '../../Communication';
import { SongList } from './SongList';
import { Draggable, Droppable, DragComponent, DragState } from "react-dragtastic";

interface ISongListComponentState
{
    songList : SongList;
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
        this.state = 
        {   
            songList: new SongList([]),
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
                    this.setState({songList: songList});
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

    public render()
    {
        return <div style={{display: "flex", flexDirection: "column"}}>

            <div style={{display: "flex", flexDirection: "column"}}>
                {
                    this.state.testList.map((element, index) =>
                        <DragState>
                            {({currentlyDraggingId, isDragging, currentlyHoveredDroppableId}) => (
                                <div>
                                    <div className={"drag-element-frame"
                                        + ((currentlyDraggingId == index
                                            && currentlyHoveredDroppableId != index
                                            && currentlyHoveredDroppableId != undefined)
                                        ? " hidden-drag" : "")}
                                    >
                                        <Droppable accepts="row3" id={index} onDrop={() => this.reorderList(currentlyDraggingId, index)}>
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
                                                        zIndex: isDragging ? 4 : undefined,
                                                        cursor: isDragging ? "grabbing" : undefined
                                                    }}
                                                />
                                            )}
                                        </Droppable>
                                        {isDragging && (
                                            <div 
                                                className={"drag-element" 
                                                    + ((currentlyHoveredDroppableId != index
                                                        || currentlyDraggingId == index)
                                                    ? " hidden-drag" : "")}
                                                style={{opacity: 0}}
                                            />
                                        )}
                                        <div 
                                            className={"drag-element"}
                                            style={{opacity: currentlyDraggingId == index ? 0 : undefined}}
                                        >
                                            <div style={{display: "flex", alignItems: "center"}}>
                                                <span>
                                                    <Draggable type="row3" id={index}>
                                                        {({events}) => (
                                                            <div 
                                                                className="glyphicon glyphicon-option-vertical drag-button"
                                                                {...events}
                                                                style={{zIndex: 1, cursor: "grab"}}
                                                            />
                                                        )}
                                                    </Draggable>
                                                </span>
                                                <span>
                                                    {element}
                                                </span>
                                            </div>
                                        </div>
                                        <DragComponent for={index}>
                                            {({x, y}) => (
                                                <div
                                                    className={"drag-element"}
                                                    style=
                                                    {{
                                                        position: "fixed",
                                                        left: x - 20,
                                                        top: y - 20,
                                                        zIndex: 3,
                                                        backgroundColor: "white",
                                                        cursor: "grabbing"
                                                    }}
                                                >
                                                    <span className="glyphicon glyphicon-option-vertical drag-button"/>
                                                    <span>
                                                        {element}
                                                    </span>
                                                </div>
                                            )}
                                        </DragComponent>
                                    </div>
                                    {(isDragging && index == this.state.testList.length -1) ? 
                                        <div className={"drag-element-empty" 
                                            + ((currentlyHoveredDroppableId != (index + 1))
                                            ? " hidden-drag" : "")
                                            }
                                            style={{ overflow: "visible" }}
                                        >
                                            <Droppable accepts="row3" id={this.state.testList.length} onDrop={() => this.reorderList(currentlyDraggingId, index + 1)}>
                                                {({events, isOver}) => (
                                                    <div 
                                                        {...events}
                                                        style=
                                                        {{
                                                            height: isOver ? "80px" : "40px",
                                                            width: "100%",
                                                            position: "absolute",
                                                            top: "-20px",
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