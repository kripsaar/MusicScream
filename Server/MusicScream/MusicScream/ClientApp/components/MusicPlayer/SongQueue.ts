import { Song } from "../../Models/SongModel";

export class SongQueue
{
    private internalList : Song[] = [];
    private currIndex : number = 0;

    constructor(songList : Song[])
    {
        this.internalList = songList;
    }

    public getQueue() : Song[]
    {
        return this.internalList;
    }

    public getCurrentIndex() : number
    {
        return this.currIndex.valueOf();
    }

    public getCurrentSong() : Song | null
    {
        if (this.currIndex >= this.internalList.length)
            return null;
        return this.internalList[this.currIndex];
    }

    public removeCurrentSong()
    {
        if (this.currIndex >= this.internalList.length)
            return;
        this.internalList.splice(this.currIndex, 1);
    }

    public selectSong(index : number) : Song | null
    {
        if (index >= this.internalList.length || index < 0)
            return null;
        this.currIndex = index;
        return this.internalList[index];
    }

    public removeSong(index : number)
    {
        if (index >= this.internalList.length || index < 0)
            return;
        this.internalList.splice(index, 1)
    }

    public getPreviousSong() : Song | null
    {
        if (this.internalList.length < 1)
            return null;
        if (this.currIndex == 0)
            this.currIndex = this.internalList.length;
        this.currIndex--;
        return this.internalList[this.currIndex];
    }

    public getNextSong() : Song | null
    {
        if (this.internalList.length < 1)
            return null;
        this.currIndex++;
        if (this.currIndex == this.internalList.length)
            this.currIndex = 0;
        return this.internalList[this.currIndex];
    }

    public queueSong(song : Song)
    {
        this.internalList.push(song);
    }

    public queueSongs(songs : Song[])
    {
        this.internalList.concat(songs);
    }

    public playSongNext(song: Song)
    {
        this.internalList.splice(this.currIndex + 1, 0, song);
    }

    public playSongsNext(songs: Song[])
    {
        this.internalList.splice(this.currIndex + 1, 0, ...songs);
    }
}