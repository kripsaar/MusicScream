import { Song } from "../../Models/SongModel";
import { matchPath } from "react-router-dom";

export class SongQueue
{
    private internalList : Array<Song | SongQueue> = [];
    private flatList: Song[] = [];
    private length: number = 0;
    private currIndex : number = 0;
    private indexMap : Map<number, number> = new Map();
    private indexMapInverse : Map<number, number> = new Map();

    constructor(songList : Song[])
    {
        this.internalList = songList;
        this.flattenInternalList();
        this.recalculateLength();
        this.recalculateIndexMap();
    }

    public getLength() : number
    {
        return this.length.valueOf();
    }

    private isSong(object: Song | SongQueue) : object is Song
    {
        return "title" in object;
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
                continue;
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
    }

    private flattenInternalList()
    {
        var flatList : Song[] = [];
        this.internalList.forEach((value) =>{
            if (this.isSong(value))
                flatList.push(value);
            else
                flatList.concat(value.getQueue());
        });
        this.flatList = flatList;
    }

    public getQueue() : Song[]
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
     
        this.recalculateLength();
        this.recalculateIndexMap();

        if (this.currIndex >= this.length && this.currIndex > 0)
            this.currIndex--;
    }

    public selectSong(index : number) : Song | null
    {
        if (index >= this.length || index < 0)
            return null;
        var internalIndex = this.indexMap.get(index);
        if (internalIndex === undefined || internalIndex < 0 || internalIndex >= this.internalList.length)
            return null;
        this.currIndex = index;
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

        this.recalculateLength();
        this.recalculateIndexMap();

        if (this.currIndex >= this.length && this.currIndex > 0)
            this.currIndex--;
    }

    public getPreviousSong() : Song | null
    {
        if (this.internalList.length < 1)
            return null;
        if (this.currIndex == 0)
            this.currIndex = this.length;
        this.currIndex--;

        return this.selectSong(this.currIndex);
    }

    public getNextSong() : Song | null
    {
        if (this.internalList.length < 1)
            return null;
        this.currIndex++;
        if (this.currIndex == this.length)
            this.currIndex = 0;
        return this.selectSong(this.currIndex);
    }

    public queueSong(song : Song)
    {
        this.indexMap.set(this.length, this.internalList.length);
        this.indexMapInverse.set(this.internalList.length, this.length);
        
        this.internalList.push(song);
        this.length++;
    }

    public queueSongs(songs : Song[])
    {
        var internalIndex = this.internalList.length;
        for (var index = this.length; index < this.length + songs.length; index++)
        {
            this.indexMap.set(index, internalIndex);
            this.indexMapInverse.set(internalIndex, index);
            internalIndex++;
        }

        this.internalList.concat(songs);
        this.length += songs.length;
    }

    public playSongNext(song: Song)
    {
        // TODO: Change
        this.internalList.splice(this.currIndex + 1, 0, song);
        this.length++;
        this.recalculateIndexMap();
    }

    public playSongsNext(songs: Song[])
    {
        // TODO: Change
        this.internalList.splice(this.currIndex + 1, 0, ...songs);
        this.length += songs.length;
        this.recalculateIndexMap();
    }
}