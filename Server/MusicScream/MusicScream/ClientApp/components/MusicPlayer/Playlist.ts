import { Song, PlayableElement } from "../../Models/SongModel";
import { PlaylistTO, PlaylistTOElement, PlaylistElement } from "../../Models/PlaylistModel";
import { Communication } from "../../Communication";

// TODO: Internal vs External functions
// TODO: Refresh Playlist if inner playlists get changed

export class Playlist extends PlaylistElement
{
    private static playlistCache : Map<number, Set<Playlist>> = new Map<number, Set<Playlist>>();

    private id : number = -1;
    private name : string;
    private internalList : PlaylistElement[] = [];
    private currentIndex : number;
    
    private startMarker : PlaylistMarker;
    private endMarker : PlaylistMarker;

    private constructor(temporary : boolean = true, listOfSongs : Song[] = [], name : string = "Unnamed Playlist", id : number = 0)
    {
        super();
        this.setId(temporary ? -1 : id);
        this.name = name;
        listOfSongs.forEach(song => this.internalList.push(new PlayableElement(song)));
        this.currentIndex = 0;
        this.startMarker = new PlaylistMarker(this, true);
        this.endMarker = new PlaylistMarker(this, false);
    }

    private setId(id : number)
    {
        let oldId = this.id;
        this.id = id;
        if (id > 0 && oldId != id)
        {
            if (oldId > 0)
                Playlist.removePlaylistFromCache(this);
            Playlist.addPlaylistToCache(this);
        }
    }

    public static getEmptyPlaylist() : Playlist
    {
        return new Playlist();
    }

    public static async createPlaylist(temporary : boolean = true, listOfSongs : Song[] = [], name : string = "Unnamed Playlist", id : number = 0) : Promise<Playlist>
    {
        var playlist = new Playlist(temporary, listOfSongs, name, id);
        await playlist.exportPlaylist();
        return playlist;
    }

    public static async fromPlaylistTO(playlistTO : PlaylistTO) : Promise<Playlist>
    {
        var playlist = new Playlist(true, [], playlistTO.name);
        playlist.setId(playlistTO.id);
        for (let element of playlistTO.list)
        {
            if (Playlist.isPlaylistInfo(element))
            {
                var subPlaylist = await Playlist.fromPlaylistTO(element);
                subPlaylist.setParentPlaylist(playlist);
                playlist.internalList.push(subPlaylist.startMarker, ...subPlaylist.internalList, subPlaylist.endMarker);
            }
            else
            {
                playlist.internalList.push(new PlayableElement(element, playlist));
            }
        }

        return playlist;
    }

    private static addPlaylistToCache(playlist : Playlist)
    {
        if (this.playlistCache.has(playlist.id))
        {
            this.playlistCache.get(playlist.id)!.add(playlist);
            return;
        }
        let set = new Set<Playlist>();
        set.add(playlist);
        this.playlistCache.set(playlist.id, set);
    }

    private static removePlaylistFromCache(playlist : Playlist)
    {
        if (!this.playlistCache.has(playlist.id))
            return;
        let set = this.playlistCache.get(playlist.id)!;
        set.delete(playlist);
    }

    private static isPlaylistInfo(object : PlaylistTOElement) : object is PlaylistTO
    {
        if (!("list" in object))
            return false;
        let testObject = object as PlaylistTO & Song;
        if (testObject.list == null)
            return false;
        return true;
    }

    public static isSong(object : PlaylistElement) : object is PlayableElement
    {
        return "song" in object;
    }

    public static isPlaylist(object : PlaylistElement) : object is Playlist
    {
        return "startMarker" in object;
    }

    public static isPlaylistMarker(object : PlaylistElement) : object is PlaylistMarker
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
        let songCount = 0;
        this.internalList.filter(element => element instanceof Playlist).forEach(element => songCount += (element as Playlist).getSongCount());
        songCount += this.internalList.filter(element => element instanceof PlayableElement).length;
        return songCount;
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

    private findElement(element : PlaylistElement) : number
    {
        return this.internalList.indexOf(element);
    }

    public setParentPlaylist(parentPlaylist: Playlist)
    {
        this.parentPlaylist = parentPlaylist;
        this.startMarker.setParentPlaylist(parentPlaylist);
        this.endMarker.setParentPlaylist(parentPlaylist);
    }

    private containsPlaylist(playlist : Playlist) : boolean
    {
        if (this == playlist)
            return true;
        for (var element of this.internalList)
        {
            if (!Playlist.isPlaylistMarker(element))
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
        if (Playlist.isSong(element))
            return element;
        if (Playlist.isPlaylistMarker(element))
            return element.getPlaylist().getCurrentSong();
        if (element instanceof Playlist)
            return element.getCurrentSong()
        return null;
    }

    public selectSong(index : number) : PlayableElement | null
    {
        if (index < 0 || index >= this.internalList.length)
            throw "Index out of bounds!";
        var element = this.internalList[index];
        if (!Playlist.isSong(element))
            return null;
        this.setCurrentIndex(index);
        var parentPlaylist = element.getParentPlaylist();
        if (parentPlaylist != null && parentPlaylist != this)
        {
            parentPlaylist.selectSong(parentPlaylist.findElement(element));
        }
        return element;
    }

    private refreshPlaylistById(playlistId : number)
    {
        let playlistIndexes = this.internalList.map((element, index) => 
        {
            if(element.getParentPlaylist() == this && element instanceof PlaylistMarker && element.isStart() && element.getPlaylist().id == playlistId)
                return index;
            return -1;
        }).filter(value => value >= 0).sort((a, b) => b - a);
        for (let index of playlistIndexes)
        {
            let playlist = (this.internalList[index] as PlaylistMarker).getPlaylist();
            let endIndex = this.internalList.indexOf(playlist.getEndMarker());
            if (endIndex == -1)
                continue;
            this.internalList.splice(index + 1, endIndex - index - 1, ...playlist.internalList);
        }
    }

    private refreshPlaylist(playlist : Playlist, recursive : boolean = false)
    {
        let startIndex = this.internalList.indexOf(playlist.getStartMarker());
        let endIndex = this.internalList.indexOf(playlist.getEndMarker());
        if (startIndex == -1 || endIndex == -1)
            return;
        this.internalList.splice(startIndex + 1, endIndex - startIndex - 1, ...playlist.internalList);
        if (recursive && playlist.getParentPlaylist() != null)
            playlist.getParentPlaylist()!.refreshPlaylist(this, true);
    }

    public removeElement(index : number)
    {
        let element = this.internalList[index];
        let parentPlaylist = element.getParentPlaylist();
        if (parentPlaylist == null)
            throw("No parent playlist found!");
        let indexInParent = parentPlaylist.findElement(element);
        let playlistSet = Playlist.playlistCache.get(parentPlaylist.id);
        if (playlistSet == undefined)
            throw "Could not find playlistSet";
        for (let playlist of playlistSet)
        {
            playlist.removeElementInternal(indexInParent);
        }
        let parentMap = Playlist.buildParentMap(playlistSet);
        for (let [parentPlaylist, children] of parentMap)
            children.forEach(childId => parentPlaylist.refreshPlaylistById(childId));

        // this.exportPlaylist()
    }

    private static buildParentMap(playlistSet : Set<Playlist>) : Map<Playlist,number[]>
    {
        var workingSet : Playlist[] = [...playlistSet];
        let parentMap = new Map<Playlist,number[]>();
        while(workingSet.length > 0)
        {
            let element = workingSet.shift()!;
            let parent = element.parentPlaylist;
            if (parent != null)
            {
                var children : number[] = [];
                if (parentMap.has(parent))
                {
                    children = parentMap.get(parent)!;
                    parentMap.delete(parent);
                }
                children.push(element.id);
                parentMap.set(parent, children);
                if (workingSet.indexOf(parent) == -1)
                    workingSet.push(parent);
            }
        }
        return parentMap;
    }

    private removeElementInternal(index : number)
    {
        if (index < 0 || index >= this.internalList.length)
            throw "Index out of bounds!";
        var element = this.internalList[index];
        if (element.getParentPlaylist() != this)
            throw "Say what?!";
        if (!Playlist.isPlaylistMarker(element))
        {
            this.internalList.splice(index, 1);
            if (this.currentIndex >= index)
                this.setCurrentIndex(this.currentIndex - 1);
        }
        else
        {
            var playlistMarker = element;
            var otherIndex = this.internalList.findIndex(value =>
                Playlist.isPlaylistMarker(value) && value == playlistMarker && value.isStart() != playlistMarker.isStart());
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
        while(index < this.internalList.length && Playlist.isPlaylistMarker(element))
        {
            index++;
            element = this.internalList[index];
        }
        if (index >= this.internalList.length)
            return null;

        var parentPlaylist = element.getParentPlaylist();
        if (parentPlaylist != null && parentPlaylist != this)
            parentPlaylist.setCurrentIndex(this.findElement(element));

        if (Playlist.isSong(element))
        {
            if (selectSong)
                this.setCurrentIndex(index);
            return element;
        }
        if (Playlist.isPlaylist(element))
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
        while (index >= 0 && Playlist.isPlaylistMarker(element))
        {
            index--;
            element = this.internalList[index]
        }
        if (index < 0)
            return null;

        var parentPlaylist = element.getParentPlaylist();
        if (parentPlaylist != null && parentPlaylist != this)
            parentPlaylist.setCurrentIndex(this.findElement(element));

        if (Playlist.isSong(element))
        {
            if (selectSong)
                this.setCurrentIndex(index);
            return element;
        }    
        if (Playlist.isPlaylist(element))
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
        let element = this.internalList[index];
        let parentPlaylist = element.getParentPlaylist();
        if (parentPlaylist == null)
            throw("No parent playlist found!");
        let indexInParent = parentPlaylist.findElement(element);
        let playlistSet = Playlist.playlistCache.get(parentPlaylist.id);
        if (playlistSet == undefined)
            throw "Could not find playlistSet";
        for (let playlist of playlistSet)
        {
            playlist.addSongsInternal(indexInParent, ...songs);
        }
        let parentMap = Playlist.buildParentMap(playlistSet);
        for (let [parentPlaylist, children] of parentMap)
            children.forEach(childId => parentPlaylist.refreshPlaylistById(childId));

        // this.exportPlaylist()
    }

    private addSongsInternal(index : number, ...songs : Song[])
    {
        if (index < 0)
            throw "Index out of bounds!"
        if (index >= this.internalList.length)
            return this.queueSongs(...songs);
        var playableElements = songs.map(song => new PlayableElement(song, this));
        this.internalList.splice(index, 0, ...playableElements);
        if (index <= this.currentIndex)
            this.setCurrentIndex(this.currentIndex + songs.length);
    }

    public addPlaylist(index: number, playlist : Playlist)
    {
        // create clone of playlist, yo, or just redo the whole thing
        if (index < 0)
            throw "Index out of bounds!";
        if (index >= this.internalList.length)
            this.queuePlaylist(playlist);
        if (playlist.containsPlaylist(this))
            return;
        var element = this.internalList[index];
        var parentPlaylist = element.getParentPlaylist();
        if (parentPlaylist != null && parentPlaylist != this)
            parentPlaylist.addPlaylist(this.findElement(element), playlist);
        
        this.internalList.splice(index, 0, playlist.getStartMarker());
        this.internalList.splice(index + 1, 0, ...playlist.internalList);
        this.internalList.splice(index + 1 + playlist.internalList.length, 0, playlist.getEndMarker());
        if (index <= this.currentIndex)
            this.setCurrentIndex(this.currentIndex + playlist.internalList.length + 2);
        this.exportPlaylist();
    }

    private addPlaylistInternal(index : number, playlist : Playlist)
    {

    }

    public queueSongs(...songs : Song[])
    {
        this.internalList.push(...songs.map(song => new PlayableElement(song)));
        let parentPlaylist = this.getParentPlaylist();
        if (parentPlaylist == null)
            this.exportPlaylist();
        else
            parentPlaylist.refreshPlaylist(this, true);
    }

    public queuePlaylist(playlist : Playlist)
    {
        // TODO: Redo
        if (playlist.containsPlaylist(this))
            return;
        this.internalList.push(playlist.getStartMarker())
        this.internalList.push(...playlist.internalList);
        this.internalList.push(playlist.getEndMarker());
        let parentPlaylist = this.getParentPlaylist();
        if (parentPlaylist == null)
            this.exportPlaylist();
        else
            parentPlaylist.refreshPlaylist(this, true);
    }

    public foldPlaylist(index : number)
    {
        // TODO: Make sure folded playlist knows added songs
        // IDEA: Just get playlist from server on unfold?
        if (index < 0 || index >= this.internalList.length)
            throw "Index out of bounds!";
        var element = this.internalList[index];

        var parentPlaylist = element.getParentPlaylist();
        if (parentPlaylist == null)
            throw "No parent playlist found!";

        parentPlaylist.foldPlaylistInternal(parentPlaylist.findElement(element));
    }

    private foldPlaylistInternal(index : number)
    {
        if (index < 0 || index >= this.internalList.length)
            throw "Index out of bounds!";
        let element = this.internalList[index];
        if (!Playlist.isPlaylistMarker(element))
            return;
        var playlist = element.getPlaylist();
        if (!element.isStart())
            index = this.internalList.indexOf(playlist.getStartMarker());
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

        let parentPlaylist = this.getParentPlaylist();
        if (parentPlaylist != null)
            parentPlaylist.refreshPlaylist(this, true);
    }

    public unfoldPlaylist(index : number)
    {
        if (index < 0 || index >= this.internalList.length)
            throw "Index out of bounds!";
        var element = this.internalList[index];
        if (!Playlist.isPlaylist(element))
            return;

        let parentPlaylist = element.getParentPlaylist();
        if (parentPlaylist == null)
            throw "No parent playlist found!";

        parentPlaylist.unfoldPlaylistInternal(parentPlaylist.findElement(element));
    }

    private unfoldPlaylistInternal(index : number)
    {
        if (index < 0 || index >= this.internalList.length)
            throw "Index out of bounds!";
        var element = this.internalList[index];
        if (!Playlist.isPlaylist(element))
            return;

        var currentIndex = this.currentIndex;
        this.internalList.splice(index, 1, element.getStartMarker(), ...element.internalList, element.getEndMarker());

        if (currentIndex == index)
            this.setCurrentIndex(index + element.currentIndex + 1);
        if (currentIndex > index)
            this.setCurrentIndex(currentIndex + element.internalList.length + 2);

        let parentPlaylist = this.getParentPlaylist();
        if (parentPlaylist != null)
            parentPlaylist.refreshPlaylist(this, true);
    }

    public moveElement(index : number, newIndex : number)
    {
        if (index < 0 || index >= this.internalList.length)
            throw "Index out of bounds!";
        var element = this.internalList[index];
        if (Playlist.isPlaylistMarker(element))
            return;
        var currentIndex = this.currentIndex;
        if (newIndex < 0)
            newIndex = 0;

        var destElement : PlaylistElement | null = null;
        if (newIndex < this.internalList.length)
            destElement = this.internalList[newIndex];

        let srcParent = element.getParentPlaylist();
        if (srcParent == null)
            throw "Couldn't find parent of source";

        let srcSet = Playlist.playlistCache.get(srcParent.id);
        if (srcSet == null)
            throw "Couldn't find parent set for source";
        let refreshSet : Set<Playlist>;
        let srcIndex = srcParent.findElement(element);
        if (srcIndex == -1)
            throw "Couldn't find source element's index";
        for (let parent of srcSet)
            parent.removeElementInternal(srcIndex);

        if (destElement == null)
        {
            this.internalList.push(element);
            element.setParentPlaylist(this)
            refreshSet = new Set<Playlist>(srcSet);
        }
        else
        {
            var destIndex : number;
            var destParent : Playlist | null;
            if (destElement instanceof PlaylistMarker && !destElement.isStart())
            {
                destParent = destElement.getPlaylist();
                destIndex = destParent.internalList.length;
            }
            destParent = destElement.getParentPlaylist();
            if (destParent == null)
                throw "Couldn't find destination playlist";
            destIndex = destParent.findElement(destElement);
            let destSet = Playlist.playlistCache.get(destParent.id);
            if (destSet == null)
                throw "Couldn't find destination playlist set";
            refreshSet = new Set<Playlist>(function*() {yield* srcSet; yield* destSet;}());
            for (let parent of destSet)
            {
                if (element instanceof PlayableElement)
                    parent.addSongsInternal(destIndex, element.getSong());
                else if (element instanceof Playlist)
                    parent.addPlaylistInternal(destIndex, element);
            }
            destParent.internalList.splice(destIndex, 1, element);
            element.setParentPlaylist(destParent);
        }

        let parentMap = Playlist.buildParentMap(refreshSet);
        for (let [parentPlaylist, children] of parentMap)
            children.forEach(childId => parentPlaylist.refreshPlaylistById(childId));

        // TODO: Something, something current index

        // this.exportPlaylist();
    }

    private async exportPlaylist()
    {
        if (this.id < 0)
            return;
        var playlistTO = this.toPlaylistTO();
        let result = await Communication.ajaxPostJsonPromise("Playlist/UpdatePlaylist", playlistTO);
        if (result.playlistTO)
        {
            this.setId(result.playlistTO.id);
        }
    }

    private toPlaylistTO() : PlaylistTO
    {
        var elementList : PlaylistTOElement[] = [];

        var index = 0;
        while(index < this.internalList.length)
        {
            var element = this.internalList[index];
            if (Playlist.isPlaylistMarker(element) && element.isStart())
            {
                elementList.push(element.getPlaylist().toPlaylistTO());
                index = index + element.getPlaylist().internalList.length + 2;
                continue;
            }
            if (Playlist.isSong(element))
            {
                elementList.push(element.getSong());
            }
            if (Playlist.isPlaylist(element))
            {
                elementList.push(element.toPlaylistTO());
            }
            index++;
        }

        var playlistTO : PlaylistTO = 
        {
            id: this.id,
            name: this.name,
            list: elementList
        };

        return playlistTO;
    }
}

class PlaylistMarker extends PlaylistElement
{
    private playlist : Playlist;
    private start : boolean;

    public constructor(playlist: Playlist, start : boolean, parentPlaylist : Playlist | null = null)
    {
        super(parentPlaylist);
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