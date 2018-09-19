import { Song } from "../../Models/SongModel";
import { SongList } from "./SongList";

export type SongListContainerElement = Song | SongListContainer | SongListMarker;

export class SongListContainer
{
    private songList : SongList;
    private flatList : Array<SongListContainerElement>;
    private indexToSongListIndexMap : Map<number, number> = new Map();
    private indexToSongListContainerMap : Map<number, SongListContainer> = new Map();
    private indexToSongListContainerStartMap : Map<number, number> = new Map();
    private songListIndexToIndexMap : Map<number, number> = new Map();
    private expanded : boolean = true;
    private readonly depth : number; 
    private currentIndex : number = 0;

    private parent : SongListContainer | null;
    private startMarker : SongListMarker = new SongListMarker(this, true);
    private endMarker : SongListMarker = new SongListMarker(this, false);

    private indexChangeEventHandlers: Array<(newIndex : number) => void> = [];

    public constructor(songList : SongList, parent : SongListContainer | null = null)
    {
        this.songList = songList;
        this.songList.addIndexChangeEventHandler(this.handleSongListIndexChange);
        this.parent = parent;
        this.depth = parent == null ? 0 : parent.depth + 1;
        this.flatList = this.flattenSongList(songList);
    }

    private setIndex(newIndex : number)
    {
        this.currentIndex = newIndex;
        this.fireIndexChangeEvent();
    }

    private handleSongListIndexChange = (newSongListIndex : number) =>
    {
        var newIndex = this.songListIndexToIndexMap.get(newSongListIndex);
        if (newIndex == null)
            throw "Invalid SongList index to SongListContainer index conversion!";
        this.setIndex(newIndex);
    }

    public getName() : string
    {
        return this.songList.getName();
    }

    public getSongList() : SongList
    {
        return this.songList;
    }

    public getLength() : number
    {
        return this.flatList.length;
    }

    public getSongCount() : number
    {
        return this.songList.getLength();
    }

    public getFlatList() : Array<SongListContainerElement>
    {
        return this.flatList;
    }

    public toggleExpand() : boolean
    {
        this.expanded = !this.expanded;
        return this.expanded;
    }

    public static isSong(object: SongListContainerElement | SongList) : object is Song
    {
        return "title" in object;
    }

    public static isSongListMarker(object: SongListContainerElement) : object is SongListMarker
    {
        return "start" in object;
    }

    public static isSongListContainer(object: SongListContainerElement) : object is SongListContainer
    {
        return "expanded" in object;
    }

    private flattenSongList(songList : SongList)
    {
        var flatList : Array<SongListContainerElement> = new Array();
        var index = 0;
        var internalIndex = 0;
        var songListIndex = 0;
        var indexToSongListIndexMap : Map<number, number> = new Map();
        var songListIndexToIndexMap : Map<number, number> = new Map();
        var indexToSongListContainerMap : Map<number, SongListContainer> = new Map();
        var indexToSongListContainerStartMap: Map<number, number> = new Map();
        songList.getInternalList().forEach(element => {
            if (SongListContainer.isSong(element))
            {
                flatList.push(element);
                indexToSongListIndexMap.set(index, songListIndex);
                songListIndexToIndexMap.set(songListIndex, index);
                indexToSongListContainerMap.set(index, this);
                indexToSongListContainerStartMap.set(index, 0);

                index++;
                songListIndex++;
            }
            else
            {
                var songListContainer = new SongListContainer(element, this);
                flatList.push(songListContainer.startMarker);
                flatList.push(...songListContainer.getFlatList());
                flatList.push(songListContainer.endMarker);
                indexToSongListContainerMap.set(index, this);
                indexToSongListContainerStartMap.set(index, 0);
                indexToSongListIndexMap.set(index, songListIndex);
                var limit = index + songListContainer.getLength() + 1;
                indexToSongListIndexMap.set(limit, songListIndex);
                var songListStartIndex = songListIndex;
                for (var i = index + 1; i < limit; i++)
                {
                    var childElement = flatList[i];
                    indexToSongListContainerMap.set(i, songListContainer);
                    indexToSongListContainerStartMap.set(i, index);
                    indexToSongListIndexMap.set(i, songListIndex);
                    songListIndexToIndexMap.set(songListIndex, i);
                    if (SongListContainer.isSong(childElement))
                        songListIndex++;
                    else if (SongListContainer.isSongListMarker(childElement))
                    {
                        if (childElement.isStart())
                            songListStartIndex = songListIndex;
                        else
                            indexToSongListIndexMap.set(i, songListStartIndex);
                    }
                    else if (SongListContainer.isSongListContainer(childElement))
                        throw "Unexpected child SongListContainer while flattening new SongListContainer!";
                }
                indexToSongListContainerMap.set(limit, this);
                indexToSongListContainerStartMap.set(limit, 0);
                index = limit + 1;
            }
            internalIndex++;
        });
        this.indexToSongListIndexMap = indexToSongListIndexMap;
        this.indexToSongListContainerMap = indexToSongListContainerMap;
        this.indexToSongListContainerStartMap = indexToSongListContainerStartMap;
        this.songListIndexToIndexMap = songListIndexToIndexMap;
        return flatList;
    }

    private recalculateSongListContainerMap()
    {
        var indexToSongListIndexMap : Map<number, number> = new Map();
        var songListIndexToIndexMap : Map<number, number> = new Map();
        var indexToSongListContainerMap : Map<number, SongListContainer> = new Map();
        var indexToSongListContainerStartMap : Map<number, number> = new Map();
        var currSongListContainer : SongListContainer = this;
        var currStartIndex = 0;
        var songListIndex = 0;
        var songListStartIndex = 0;
        for (var i = 0; i < this.flatList.length; i++)
        {
            indexToSongListContainerMap.set(i, currSongListContainer);
            indexToSongListContainerStartMap.set(i, currStartIndex);
            indexToSongListIndexMap.set(i, songListIndex);
            songListIndexToIndexMap.set(songListIndex, i);
            var element = this.flatList[i];
            if (SongListContainer.isSong(element))
            {
                songListIndex++;
                continue;
            }
            if (SongListContainer.isSongListContainer(element))
            {
                var songListIndexLimit = songListIndex + element.getSongList().getLength();
                for (var currSongListIndex = songListIndex; currSongListIndex < songListIndexLimit; songListIndex++)
                {
                    songListIndexToIndexMap.set(currSongListIndex, i);
                }
                songListIndex = songListIndexLimit;
                continue;
            }
            if (element.isStart())
            {
                songListStartIndex = songListIndex;
                if (element.getSongListContainer().parent == this)
                {
                    currSongListContainer = element.getSongListContainer();
                    currStartIndex = i + 1;
                }
            }
            else
            {
                indexToSongListIndexMap.set(i, songListStartIndex);
                if (element.getSongListContainer().parent == this)
                {
                    currSongListContainer = this;
                    currStartIndex = 0;
                }
            }
        }
        this.indexToSongListContainerMap = indexToSongListContainerMap;
        this.indexToSongListContainerStartMap = indexToSongListContainerStartMap;
        this.indexToSongListIndexMap = indexToSongListIndexMap;
        this.songListIndexToIndexMap = songListIndexToIndexMap;
    }

    public shrinkSongList(index : number)
    {
        var element = this.flatList[index];
        if (!SongListContainer.isSongListMarker(element))
            return;
        if (!element.isStart())
            return;
        var songListContainer = element.getSongListContainer();
        this.flatList.splice(index, songListContainer.getLength() + 2, songListContainer);
        var targetSongListContainer = this.indexToSongListContainerMap.get(index);
        var targetIndex = this.indexToSongListContainerStartMap.get(index);
        if (targetSongListContainer != this && targetSongListContainer != null && targetIndex != null)
            targetSongListContainer.shrinkSongList(index - targetIndex);
        this.recalculateSongListContainerMap();
    }

    public expandSongList(index : number)
    {
        var element = this.flatList[index];
        if (!SongListContainer.isSongListContainer(element))
            return;
        this.flatList.splice(index, 1, 
            element.startMarker,
            ...(element.getFlatList()),
            element.endMarker
        );
        var targetSongListContainer = this.indexToSongListContainerMap.get(index);
        var targetIndex = this.indexToSongListContainerStartMap.get(index);
        if (targetSongListContainer != this && targetSongListContainer != null && targetIndex != null)
            targetSongListContainer.expandSongList(index - targetIndex);
        this.recalculateSongListContainerMap();
    }

    public selectSong(index : number)
    {
        var songListIndex = this.indexToSongListIndexMap.get(index);
        if (songListIndex == null)
            throw "Index [" + index + "] produced SongListIndex null on Song Selection in SongListContainer!";
        this.setIndex(index);
        return this.songList.selectSong(songListIndex);
    }

    public moveElement(index : number, newIndex: number)
    {
        var element = this.flatList[index];
        if (SongListContainer.isSongListMarker(element))
        {
            return;
        }
        var oldLength = this.flatList.length;
        this.removeElement(index, true);
        if (index < newIndex)
            newIndex -= oldLength - this.flatList.length;
        this.addElement(newIndex, element, true);
    }

    private addElement(index : number, element : SongListContainerElement, recalculateMaps: boolean = true)
    {
        if (index < 0)
            throw "Index out of bounds when adding element to SongListContainer!";
        if (SongListContainer.isSongListMarker(element))
            return;

        if (index >= this.flatList.length)
        {
            this.flatList.push(element);
            if (SongListContainer.isSong(element))
                this.songList.queueSongs(element);
            else
                this.songList.queueSongList(element.getSongList());
            if (recalculateMaps)
                this.recalculateSongListContainerMap();
            return;
        }
        this.flatList.splice(index, 0, element);
        var targetSongListContainer = this.indexToSongListContainerMap.get(index);
        var targetIndex = this.indexToSongListContainerStartMap.get(index);
        if (targetSongListContainer != this && targetSongListContainer != null && targetIndex != null)
        {
            targetSongListContainer.addElement(index - targetIndex, element, recalculateMaps);
        }
        else
        {
            var songListIndex = this.indexToSongListIndexMap.get(index);
            if (songListIndex != null)
            {
                if (SongListContainer.isSong(element))
                    this.songList.addSongs(songListIndex, element);
                else
                    this.songList.addSongList(songListIndex, element.getSongList());
            }
        }

        if (recalculateMaps)
            this.recalculateSongListContainerMap();
    }

    private removeElement(index : number, recalculateMaps : boolean = true)
    {
        if (index < 0 || index >= this.flatList.length)
            throw "Index out of bounds removing element from SongListContainer!";
        var element = this.flatList[index];
        if (SongListContainer.isSongListMarker(element) && !element.isStart())
            return;
        if (SongListContainer.isSongListMarker(element) && element.isStart())
        {
            this.flatList.splice(index, element.getSongListContainer().getLength() + 2);
        }
        else
        {
            this.flatList.splice(index, 1);
        }
        var targetSongListContainer = this.indexToSongListContainerMap.get(index);
        var targetIndex = this.indexToSongListContainerStartMap.get(index);
        if (targetSongListContainer != this && targetSongListContainer != null && targetIndex != null)
            targetSongListContainer.removeElement(index - targetIndex, recalculateMaps);
        else
        {
            var songListIndex = this.indexToSongListIndexMap.get(index);
            if (songListIndex == null)
                throw "Index [" + index + "] does not produce valid songListIndex!";
            if (SongListContainer.isSong(element))
                this.songList.removeSong(songListIndex);
            else
                this.songList.removeSongList(songListIndex);
        }

        if (recalculateMaps)
            this.recalculateSongListContainerMap();
    }

    public addIndexChangeEventHandler(eventHandler: (newIndex: number) => void)
    {
        this.indexChangeEventHandlers.push(eventHandler);
    }

    public removeIndexChangeEventHandler(eventHandler: (newIndex: number) => void)
    {
        var index = this.indexChangeEventHandlers.indexOf(eventHandler);
        if (index == -1)
            return;
        this.indexChangeEventHandlers.splice(index, 1);
    }

    private fireIndexChangeEvent()
    {
        this.indexChangeEventHandlers.forEach(handler => handler(this.currentIndex.valueOf()));
    }

}

export class SongListMarker
{
    private songListContainer : SongListContainer;
    private start : boolean;

    public constructor(songListContainer : SongListContainer, start : boolean)
    {
        this.songListContainer = songListContainer;
        this.start = start;
    }

    public getSongListContainer() : SongListContainer
    {
        return this.songListContainer;
    }

    public isStart() : boolean
    {
        return this.start;
    }
}