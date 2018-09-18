import { Song } from "../../Models/SongModel";

type SongListElement = Song | SongList;

export class SongList
{
    private name : string;
    private internalList : Array<SongListElement> = [];
    private flatList: Song[] = [];
    private length: number = 0;
    private currIndex : number = 0;
    private indexMap : Map<number, number> = new Map();
    private indexMapInverse : Map<number, number> = new Map();

    private indexChangeEventHandlers: Array<(newIndex : number) => void> = [];
    private lengthChangeEventHandlers: Array<(newLength: number) => void> = [];

    constructor(songList : Song[], name = "Unnamed Playlist")
    {
        this.name = name;
        this.internalList = songList;
        this.flattenInternalList();
    }

    public getName() : string
    {
        return this.name;
    }

    public getInternalList() : Array<SongListElement>
    {
        return this.internalList;
    }

    public getLength() : number
    {
        return this.length.valueOf();
    }

    private isSong(object: SongListElement) : object is Song
    {
        return "title" in object;
    }

    private containsSongList(songList : SongList) : boolean
    {
        if (this == songList)
            return true;
        for (var element of this.internalList)
        {
            if (this.isSong(element))
                continue;
            if (element.containsSongList(songList))
                return true;
        }
        return false;
    }

    private recalculateIndexMap()
    {
        var indexMap : Map<number, number> = new Map();
        var indexMapInverse : Map<number, number> = new Map();
        var idx = 0;
        for (var i = 0; i < this.internalList.length; i++)
        {
            var element = this.internalList[i]
            if (this.isSong(element))
            {
                indexMap.set(idx, i);
                indexMapInverse.set(i, idx);
                idx++;
            }
            else
            {
                var limit = idx + element.getLength();
                for (var j = idx; j < limit; j++)
                {
                    indexMap.set(j, i);
                }
                indexMapInverse.set(i, idx);
                idx = limit;
            }
        }
        this.indexMap = indexMap;
        this.indexMapInverse = indexMapInverse;
    }


    private recalculateLength()
    {
        var length = 0;
        this.internalList.forEach((value) => {
            if (this.isSong(value))
                length++;
            else
                length += value.getLength();
        });
        this.length = length;
        this.lengthChangeEventHandlers.forEach(handler => handler(this.length.valueOf()));
    }

    private recalculateLengthAndIndexMap()
    {
        var index = 0;
        var internalIndex = 0;
        var indexMap : Map<number, number> = new Map();
        var indexMapInverse : Map<number, number> = new Map();
        this.internalList.forEach((element) => {
            if (this.isSong(element))
            {
                indexMap.set(index, internalIndex);
                indexMapInverse.set(internalIndex, index);
                index++;
            }
            else
            {
                var limit = index + element.getLength();
                for (var i = index; i < limit; i++)
                    indexMap.set(i, internalIndex);
                indexMapInverse.set(internalIndex, index);
                index = limit;
            }
            internalIndex++;
        });
        this.length = index;
        this.lengthChangeEventHandlers.forEach(handler => handler(this.length.valueOf()));
        this.indexMap = indexMap;
        this.indexMapInverse = indexMapInverse;
    }

    private flattenInternalList()
    {
        var flatList : Song[] = [];
        var index = 0;
        var internalIndex = 0;
        var indexMap : Map<number, number> = new Map();
        var indexMapInverse : Map<number, number> = new Map();
        this.internalList.forEach((element) =>{
            if (this.isSong(element))
            {
                flatList.push(element);
                indexMap.set(index, internalIndex);
                indexMapInverse.set(internalIndex, index);
                index++;
            }
            else
            {
                flatList.push(...element.getFlatList());
                var limit = index + element.getLength();
                for (var i = index; i < limit; i++)
                    indexMap.set(i, internalIndex);
                indexMapInverse.set(internalIndex, index);
                index = limit;
            }
            internalIndex++;
        });
        this.flatList = flatList;
        this.length = index;
        this.lengthChangeEventHandlers.forEach(handler => handler(this.length.valueOf()));
        this.indexMap = indexMap;
        this.indexMapInverse = indexMapInverse;
    }

    public getFlatList() : Song[]
    {
        return this.flatList;
    }

    public getCurrentIndex() : number
    {
        return this.currIndex.valueOf();
    }

    public getCurrentSong() : Song | null
    {
        if (this.currIndex >= this.length)
            return null;
        var internalIndex = this.indexMap.get(this.currIndex);
        if (internalIndex === undefined || internalIndex >= this.internalList.length)
            return null;
        var element = this.internalList[this.currIndex];
        if (this.isSong(element))
            return element;
        else
            return element.getCurrentSong();
    }

    public removeCurrentSong()
    {
        if (this.currIndex >= this.length || this.currIndex < 0)
            return;
        var internalIndex = this.indexMap.get(this.currIndex);
        if (internalIndex === undefined || internalIndex >= this.internalList.length || internalIndex < 0)
            return;
        var element = this.internalList[internalIndex];
        if (this.isSong(element))
            this.internalList.splice(internalIndex, 1);
        else
            element.removeCurrentSong();
     
        this.recalculateLengthAndIndexMap();

        if (this.currIndex >= this.length && this.currIndex > 0)
        {
            this.currIndex--;
            this.indexChangeEventHandlers.forEach(handler => handler(this.currIndex.valueOf()));
        }
    }

    public selectSong(index : number) : Song | null
    {
        if (index >= this.length || index < 0)
            return null;
        var internalIndex = this.indexMap.get(index);
        if (internalIndex === undefined || internalIndex < 0 || internalIndex >= this.internalList.length)
            return null;
        this.currIndex = index;
        this.indexChangeEventHandlers.forEach(handler => handler(index.valueOf()));
        var element = this.internalList[index];
        if (this.isSong(element))
            return element;
        else
        {
            var firstIndex = this.indexMapInverse.get(internalIndex);
            if (firstIndex === undefined)
                return null;
            return element.selectSong(index - firstIndex);
        }
    }

    public removeSong(index : number)
    {
        if (index >= this.length || index < 0)
            return;
        var internalIndex = this.indexMap.get(index);
        if (internalIndex === undefined || internalIndex >= this.internalList.length || internalIndex < 0)
            return;
        var element = this.internalList[internalIndex];
        if (this.isSong(element))
            this.internalList.splice(internalIndex, 1);
        else
        {
            var firstIndex = this.indexMapInverse.get(internalIndex);
            if (firstIndex === undefined)
                return;
            element.removeSong(index - firstIndex);
        }

        this.recalculateLengthAndIndexMap()

        if (this.currIndex >= this.length && this.currIndex > 0)
        {
            this.currIndex--;
            this.indexChangeEventHandlers.forEach(handler => handler(this.currIndex.valueOf()));
        }
    }

    public getPreviousSong() : Song | null
    {
        if (this.internalList.length < 1)
            return null;
        if (this.currIndex == 0)
            this.currIndex = this.length;
        this.currIndex--;
        this.indexChangeEventHandlers.forEach(handler => handler(this.currIndex.valueOf()));

        return this.selectSong(this.currIndex);
    }

    public getNextSong() : Song | null
    {
        if (this.internalList.length < 1)
            return null;
        this.currIndex++;
        if (this.currIndex == this.length)
            this.currIndex = 0;
        this.indexChangeEventHandlers.forEach(handler => handler(this.currIndex.valueOf()));
        return this.selectSong(this.currIndex);
    }

    private addSongs(index: number, ...songs: Song[])
    {
        if (index < 0)
            return;

        if (index >= this.length)
            return this.queueSongs(...songs);

        var internalIndex = this.indexMap.get(index);
        if (internalIndex == undefined)
            return;
        var element = this.internalList[internalIndex];
        var firstIndex = this.indexMapInverse.get(internalIndex);
        if (firstIndex == undefined)
            return;
        if (index == firstIndex)
        {
            this.internalList.splice(internalIndex, 0, ...songs);
            this.flatList.splice(index, 0, ...songs);
            this.recalculateIndexMap();
            this.length += songs.length;
            this.lengthChangeEventHandlers.forEach(handler => handler(this.length.valueOf()));
            return;
        }

        if (this.isSong(element))
            return;

        element.addSongs(index - firstIndex, ...songs);
    }

    private addSongList(index: number, songList: SongList)
    {
        if (index < 0)
            return;
        if (songList.containsSongList(this))
            return;
        if (index >= this.length)
            this.queueSongList(songList);

        var internalIndex = this.indexMap.get(index);
        if (!internalIndex)
            return;
        var element = this.internalList[internalIndex];
        var firstIndex = this.indexMapInverse.get(internalIndex);
        if (firstIndex == undefined)
            return;
        if (index == firstIndex)
        {
            this.internalList.splice(internalIndex, 0, songList);
            this.flattenInternalList();
            return;
        }

        if (this.isSong(element))
            return;

        this.addSongList(index, songList);
    }

    public queueSongList(songList : SongList)
    {
        if (songList.containsSongList(this))
            return;
        this.internalList.push(songList);
        this.flattenInternalList();
        songList.addLengthChangeEventHandler(this.handleLengthChange);
    }

    public queueSongs(...songs : Song[])
    {
        var internalIndex = this.internalList.length;
        for (var index = this.length; index < this.length + songs.length; index++)
        {
            this.indexMap.set(index, internalIndex);
            this.indexMapInverse.set(internalIndex, index);
            internalIndex++;
        }

        this.internalList.push(...songs);
        this.flatList.push(...songs);
        this.length += songs.length;
        this.lengthChangeEventHandlers.forEach(handler => handler(this.length.valueOf()));
    }

    public playSongsNext(...songs: Song[])
    {
        this.addSongs(this.currIndex + 1, ...songs);
    }

    public playSongListNext(songList: SongList)
    {
        this.addSongList(this.currIndex + 1, songList);
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

    public addLengthChangeEventHandler(eventHandler: (newLength: number) => void)
    {
        this.lengthChangeEventHandlers.push(eventHandler);
    }

    public removeLengthChangeEventHandler(eventHandler: (newLength: number) => void)
    {
        var index = this.lengthChangeEventHandlers.indexOf(eventHandler);
        if (index == -1)
            return;
        this.lengthChangeEventHandlers.splice(index, 1);
    }

    private handleLengthChange = () =>
    {
        this.flattenInternalList();
    }
}