import { Song, PlayableElement } from "../../Models/SongModel";
import * as Uuid from "uuid"

type PlaylistElement = PlayableElement | Playlist | PlaylistMarker; 

/*  IDEA:
    Keep member playlist state in here, export to server when appropriate (TBD: on change or some other point, dunno?)
*/

export class Playlist
{
    private name : string;
    private internalList : PlaylistElement[] = [];
    private currentIndex : number;
    private songCount : number = 0;

    private startMarker : PlaylistMarker;
    private endMarker : PlaylistMarker;


    public constructor(listOfSongs : Song[], name = "Unnamed Playlist")
    {
        this.name = name;
        listOfSongs.forEach(song => this.internalList.push(new PlayableElement(song)));
        this.currentIndex = 0;
        this.songCount = listOfSongs.length;
        this.startMarker = new PlaylistMarker(this, true);
        this.endMarker = new PlaylistMarker(this, false);
    }

    private isSong(object : PlaylistElement) : object is PlayableElement
    {
        return "uuid" in object;
    }

    private isPlaylist(object : PlaylistElement) : object is Playlist
    {
        return "internalList" in object;
    }

    private isPlaylistMarker(object : PlaylistElement) : object is PlaylistMarker
    {
        return ("start" in object) && ("playlist" in object);
    }

    public getFlatList() : PlaylistElement[]
    {
        return this.internalList;
    }

    public getName() : string
    {
        return this.name;
    }

    public getLength() : number
    {
        return this.internalList.length;
    }

    public getSongCount() : number
    {
        return this.songCount;
    }

    private setCurrentIndex(newIndex : number) 
    {
        this.currentIndex = newIndex;
    }

    private getStartMarker() : PlaylistMarker
    {
        return this.startMarker;
    }

    private getEndMarker() : PlaylistMarker
    {
        return this.endMarker;
    }

    private containsPlaylist(playlist : Playlist) : boolean
    {
        if (this == playlist)
            return true;
        for (var element of this.internalList)
        {
            if (!this.isPlaylistMarker(element))
                continue;
            if (!element.isStart())
                continue;
            if (element.getPlaylist().containsPlaylist(playlist))
                return true;
        }
        return false;
    }

    public getCurrentSong() : PlayableElement | null
    {
        if (this.currentIndex >= this.internalList.length)
            throw "Current playlist index out of bounds!";
        var element = this.internalList[this.currentIndex];
        if (this.isSong(element))
            return element;
        if (this.isPlaylistMarker(element))
            return element.getPlaylist().getCurrentSong();
        return element.getCurrentSong();
    }

    public selectSong(index : number) : PlayableElement | null
    {
        if (index < 0 || index >= this.internalList.length)
            throw "Index out of bounds!";
        var element = this.internalList[index];
        if (!this.isSong(element))
            return null;
        this.setCurrentIndex(index);
        return element;
    }

    public removeElement(index : number)
    {
        if (index < 0 || index >= this.internalList.length)
            throw "Index out of bounds!";
        var element = this.internalList[index];
        if (!this.isPlaylistMarker(element))
        {
            this.internalList.splice(index, 1);
            if (this.currentIndex >= index)
                this.setCurrentIndex(this.currentIndex - 1);
        }
        else
        {
            var playlistMarker = element;
            var otherIndex = this.internalList.findIndex(value =>
                this.isPlaylistMarker(value) && value.getPlaylist() == playlistMarker.getPlaylist() && value.isStart() != playlistMarker.isStart());
            var startIndex = index < otherIndex ? index : otherIndex;
            var endIndex = index > otherIndex ? index : otherIndex;
            var length = endIndex - startIndex;
            this.internalList.splice(startIndex, length);
            if (this.currentIndex >= startIndex && this.currentIndex <=  endIndex)
                this.setCurrentIndex(startIndex - 1);
            else if (this.currentIndex > endIndex)
                this.setCurrentIndex(this.currentIndex - length);
        }

        if (this.currentIndex < 0)
            this.setCurrentIndex(0);
    }

    public getNextSong() : PlayableElement | null
    {
        return this.getOrSelectNextSong(false);
    }

    public selectNextSong() : PlayableElement | null
    {
        return this.getOrSelectNextSong(true);
    }

    private getOrSelectNextSong(selectSong : boolean) : PlayableElement | null
    {
        var index = this.currentIndex + 1;
        if (index >= this.internalList.length)
            return null;
        var element = this.internalList[index];
        while(index < this.internalList.length && this.isPlaylistMarker(element))
        {
            index++;
            element = this.internalList[index];
        }
        if (index >= this.internalList.length)
            return null;
        if (this.isSong(element))
        {
            if (selectSong)
                this.setCurrentIndex(index);
            return element;
        }
        if (this.isPlaylist(element))
        {
            if (selectSong)
                this.setCurrentIndex(index);
            var nextSong = element.getOrSelectNextSong(selectSong);
            if (nextSong == null)
            {
                // Assume we passed end of inner playlist
                return this.getOrSelectNextSong(selectSong);
            }
            return nextSong;
        }
        return null;
    }


    public getPreviousSong() : PlayableElement | null
    {
        return this.getOrSelectPreviousSong(false);
    }

    public selectPreviousSong() : PlayableElement | null
    {
        return this.getOrSelectPreviousSong(true);
    }

    private getOrSelectPreviousSong(selectSong : boolean) : PlayableElement | null
    {
        var index = this.currentIndex - 1;
        if (index < 0)
            return null;
        var element = this.internalList[index];
        while (index >= 0 && this.isPlaylistMarker(element))
        {
            index--;
            element = this.internalList[index]
        }
        if (index < 0)
            return null;
        if (this.isSong(element))
        {
            if (selectSong)
                this.setCurrentIndex(index);
            return element;
        }    
        if (this.isPlaylist(element))
        {
            if (selectSong)
                this.setCurrentIndex(index);
            var previousSong = element.getOrSelectPreviousSong(selectSong);
            if (previousSong == null)
            {
                // Assume we passed first song of child playlist
                return this.getOrSelectPreviousSong(selectSong);
            }
            return previousSong;
        }
        return null;
    }

    public addSongs(index : number, ...songs : Song[])
    {
        if (index < 0)
            throw "Index out of bounds!"
        if (index >= this.internalList.length)
            this.queueSongs(...songs);
        var playableElements = songs.map(song => new PlayableElement(song));
        this.internalList.splice(index, 0, ...playableElements);
        if (index <= this.currentIndex)
            this.setCurrentIndex(this.currentIndex + songs.length);
    }

    public addPlaylist(index: number, playlist : Playlist)
    {
        if (index < 0)
            throw "Index out of bounds!";
        if (index >= this.internalList.length)
            this.queuePlaylist(playlist);
        this.internalList.splice(index, 0, playlist.getStartMarker());
        this.internalList.splice(index + 1, 0, ...playlist.internalList);
        this.internalList.splice(index + 1 + playlist.internalList.length, 0, playlist.getEndMarker());
        if (index <= this.currentIndex)
            this.setCurrentIndex(this.currentIndex + playlist.internalList.length + 2);
    }

    public queueSongs(...songs : Song[])
    {
        this.internalList.push(...songs.map(song => new PlayableElement(song)));
    }

    public queuePlaylist(playlist : Playlist)
    {
        this.internalList.push(playlist.getStartMarker())
        this.internalList.push(...playlist.internalList);
        this.internalList.push(playlist.getEndMarker());
    }

    public foldPlaylist(index : number)
    {
        if (index < 0 || index >= this.internalList.length)
            throw "Index out of bounds!";
        var element = this.internalList[index];
        if (!this.isPlaylistMarker(element))
            return;
        if (!element.isStart())
            index = this.internalList.findIndex(value => this.isPlaylistMarker(value) && value == element && value.isStart());
        var playlist = element.getPlaylist();
        var currentIndex = this.currentIndex;
        var limit = playlist.internalList.length + 2;
        this.internalList.splice(index, limit, playlist);

        if (index < currentIndex && currentIndex < index + limit)
        {
            playlist.setCurrentIndex(currentIndex - index - 1);
            this.setCurrentIndex(index);
        }
        else if (currentIndex >= index + limit)
            this.setCurrentIndex(currentIndex - (limit - 1))
    }

    public unfoldPlaylist(index : number)
    {
        if (index < 0 || index >= this.internalList.length)
            throw "Index out of bounds!";
        var element = this.internalList[index];
        if (!this.isPlaylist(element))
            return;
        var currentIndex = this.currentIndex;
        this.internalList.splice(index, 1, element.getStartMarker(), ...element.internalList, element.getEndMarker());

        if (currentIndex == index)
            this.setCurrentIndex(index + element.currentIndex + 1);
        if (currentIndex > index)
            this.setCurrentIndex(currentIndex + element.internalList.length + 2);
    }

    public moveElement(index : number, newIndex : number)
    {
        // TODO
    }

    private finalizePlaylist()
    {

    }

    private exportPlaylist()
    {

    }
}

class PlaylistMarker
{
    private playlist : Playlist;
    private start : boolean;

    public constructor(playlist: Playlist, start : boolean)
    {
        this.playlist = playlist;
        this.start = start;
    }

    public getPlaylist() : Playlist
    {
        return this.playlist;
    }

    public isStart() : boolean
    {
        return this.start;
    }
}