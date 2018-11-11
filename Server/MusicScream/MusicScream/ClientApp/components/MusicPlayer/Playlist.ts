import { Song, PlayableElement } from "../../Models/SongModel";
import { PlaylistTO, PlaylistTOElement, PlaylistElement } from "../../Models/PlaylistModel";
import { Communication } from "../../Communication";

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
                subPlaylist.currentIndex = -1;
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
        this.refreshCurrentIndex();
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
        if (this.id == playlist.id)
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

    private refreshCurrentIndex()
    {
        let parent = this.getParentPlaylist();
        if (parent == null)
            return;
        var thisIndex = parent.findElement(this);
        if (thisIndex == -1)
        {
            thisIndex = parent.findElement(this.getStartMarker());
            if (thisIndex == -1)
                throw "Parent does not contain this element!";
        }
        let thisElement = parent.internalList[thisIndex];
        if (thisElement instanceof Playlist)
        {
            parent.currentIndex = thisIndex;
        }
        if (thisElement instanceof PlaylistMarker)
        {
            parent.currentIndex = thisIndex + 1 + this.currentIndex;
        }
        parent.refreshCurrentIndex();
    }

    public selectSong(index : number) : PlayableElement | null
    {
        if (index < 0 || index >= this.internalList.length)
            throw "Index out of bounds!";
        var element = this.internalList[index];
        if (!Playlist.isSong(element))
            return null;
        var parentPlaylist = element.getParentPlaylist();
        if (parentPlaylist == null)
            throw "Could not find parent playlist for selected song!";
        if (parentPlaylist != this)
            return parentPlaylist.selectSong(parentPlaylist.findElement(element));
        this.setCurrentIndex(index);
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
        if (index == this.currentIndex)
            this.selectPreviousSong();
        let currentElement = this.getCurrentSong();
        let element = this.internalList[index];
        if (element instanceof PlaylistMarker)
        {
            this.foldPlaylist(index);
            if (!element.isStart())
                index = this.findElement(element.getPlaylist());
            element = element.getPlaylist();
        }
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

        if (currentElement != null)
        {
            let currentElementParent = currentElement.getParentPlaylist();
            if (currentElementParent == null)
                throw "Could not find current element's parent!";
            let currentElementIndex = currentElementParent.findElement(currentElement);
            if (currentElementIndex == -1)
                throw "Could not find current element anymore!";
            currentElementParent.setCurrentIndex(currentElementIndex);
        }

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
        }
    }

    public getNextSong() : PlayableElement | null
    {
        return this.getOrSelectNextSong(false);
    }

    public selectNextSong() : PlayableElement | null
    {
        return this.getOrSelectNextSong(true);
    }

    private getOrSelectNextSong(selectSong : boolean, currentIndex = this.currentIndex) : PlayableElement | null
    {
        var index = currentIndex + 1;
        if (index >= this.internalList.length)
        {
            if (selectSong)
                this.currentIndex = -1;
            return null;
        }
        let element = this.internalList[index];
        if (element instanceof PlaylistMarker)
        {
            let targetPlaylist = element.getPlaylist();
            let result = targetPlaylist.getOrSelectNextSong(selectSong);
            if (result == null)
                return this.getOrSelectNextSong(selectSong, index);
            return result;
        }
        let parentPlaylist = element.getParentPlaylist();
        if (parentPlaylist == null)
            throw "Couldn't find parent playlist while selecting next song!";
        if (parentPlaylist != this)
            return parentPlaylist.getOrSelectNextSong(selectSong);

        if (element instanceof PlayableElement)
        {
            if (selectSong)
                this.setCurrentIndex(index);
            return element;
        }
        if (element instanceof Playlist)
        {
            var result = element.getOrSelectNextSong(selectSong);
            if (result == null)
            {
                // Assume we reached end of inner playlist
                return this.getOrSelectNextSong(selectSong, index);
            }
            return result;
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

    private getOrSelectPreviousSong(selectSong : boolean, currentIndex = this.currentIndex) : PlayableElement | null
    {
        var index = currentIndex - 1;
        if (index < 0)
        {
            if (selectSong)
                this.currentIndex = -1;
            return null;
        }
        var element = this.internalList[index];
        if (element instanceof PlaylistMarker)
        {
            let targetPlaylist = element.getPlaylist();
            let result = targetPlaylist.getOrSelectPreviousSong(selectSong);
            if (result == null)
                return this.getOrSelectPreviousSong(selectSong, index);
            return result;
        }

        let parentPlaylist = element.getParentPlaylist();
        if (parentPlaylist == null)
            throw "Couldn't find parent playlist while selecting previous song!";
        if (parentPlaylist != this)
            return parentPlaylist.getOrSelectPreviousSong(selectSong);

        if (element instanceof PlayableElement)
        {
            if (selectSong)
                this.setCurrentIndex(index);
            return element;
        }    
        if (element instanceof Playlist)
        {
            var previousSong = element.getOrSelectPreviousSong(selectSong);
            if (previousSong == null)
            {
                // Assume we passed first song of child playlist
                return this.getOrSelectPreviousSong(selectSong, index);
            }
            return previousSong;
        }
        return null;
    }

    public addSongs(index : number, ...songs : Song[])
    {
        let currentElement = this.getCurrentSong();
        let element = this.internalList[index];
        let parentPlaylist = element.getParentPlaylist();
        if (parentPlaylist == null)
            throw("No parent playlist found!");
        let indexInParent : number;
        if (element instanceof PlaylistMarker && !element.isStart())
        {
            parentPlaylist = element.getPlaylist();
            indexInParent = parentPlaylist.internalList.length;
        }
        else
            indexInParent = parentPlaylist.findElement(element);
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

        if (currentElement != null)
        {
            let currentElementParent = currentElement.getParentPlaylist();
            if (currentElementParent == null)
                throw "Couldn't find current element's parent!";
            let currentElementIndex = currentElementParent.findElement(currentElement);
            if (currentElementIndex == -1)
                throw "Couldn't find current element anymore after adding songs!";
            currentElementParent.setCurrentIndex(currentElementIndex);
        }

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
    }

    public addPlaylist(index: number, playlist : Playlist)
    {
        if (index < 0)
            throw "Index out of bounds!";
        if (index >= this.internalList.length)
            this.queuePlaylist(playlist);
        if (playlist.containsPlaylist(this))
            return;
        var currentElement = this.getCurrentSong();
        var element = this.internalList[index];
        var parentPlaylist = element.getParentPlaylist();
        if (parentPlaylist == null)
            throw "Could not find parent playlist";
        let indexInParent : number;
        if (element instanceof PlaylistMarker && !element.isStart())
        {
            parentPlaylist = element.getPlaylist();
            indexInParent = parentPlaylist.internalList.length;
        }
        else
            indexInParent = parentPlaylist.findElement(element);
        let playlistSet = Playlist.playlistCache.get(parentPlaylist.id);
        if (playlistSet == null)
            throw "Could not find playlist set for parent";
        for (let parent of playlistSet)
        {
            parent.addPlaylistInternal(indexInParent, playlist);
        }
        let parentMap = Playlist.buildParentMap(playlistSet);
        for (let [parent, children] of parentMap)
        {
            children.forEach(childId => parent.refreshPlaylistById(childId));
        }

        if (currentElement != null)
        {
            let currentElementParent = currentElement.getParentPlaylist();
            if (currentElementParent == null)
                throw "Couldn't find current element's parent!";
            let currentElementIndex = currentElementParent.findElement(currentElement);
            if (currentElementIndex == -1)
                throw "Couldn't find current element anymore after adding playlist!";
            currentElementParent.setCurrentIndex(currentElementIndex);
        }

        // this.exportPlaylist();
    }

    private addPlaylistInternal(index : number, playlist : Playlist)
    {
        if (index < 0)
            throw "Index out of bounds!";
        if (index >= this.internalList.length)
            this.queuePlaylist(playlist);
        if (playlist.containsPlaylist(this))
            return;
        
        let playlistClone = playlist.clone();
        playlistClone.setParentPlaylist(this);

        this.internalList.splice(index, 0, playlistClone.getStartMarker(), ...playlistClone.internalList, playlistClone.getEndMarker());
        // this.exportPlaylist();
    }

    private clone() : Playlist
    {
        let result = new Playlist(false, [], this.name, this.id);
        for (var index = 0; index < this.internalList.length; ++index)
        {
            let element = this.internalList[index];
            if (element instanceof PlaylistMarker && element.isStart())
            {
                let toAdd = element.getPlaylist().clone();
                result.internalList.push(toAdd.getStartMarker(), ...toAdd.internalList, toAdd.getEndMarker());
                index += element.getPlaylist().internalList.length + 1;
                continue;
            }
            if (element instanceof Playlist)
            {
                let toAdd = element.clone();
                result.internalList.push(toAdd.getStartMarker(), ...toAdd.internalList, toAdd.getEndMarker());
                continue;
            }
            if (element instanceof PlayableElement)
            {
                result.internalList.push(new PlayableElement(element.getSong(), this));
            }
        }
        return result;
    }

    public queueSongs(...songs : Song[])
    {
        this.internalList.push(...songs.map(song => new PlayableElement(song, this)));
        let parentPlaylist = this.getParentPlaylist();
        if (parentPlaylist == null)
            this.exportPlaylist();
        else
            parentPlaylist.refreshPlaylist(this, true);
    }

    public queuePlaylist(playlist : Playlist)
    {
        if (playlist.containsPlaylist(this))
            return;
        let playlistClone = playlist.clone();
        playlistClone.setParentPlaylist(this);
        this.internalList.push(playlistClone.getStartMarker(), ...playlistClone.internalList, playlistClone.getEndMarker());
        let parentPlaylist = this.getParentPlaylist();
        if (parentPlaylist == null)
            this.exportPlaylist();
        else
            parentPlaylist.refreshPlaylist(this, true);
    }

    public foldPlaylist(index : number)
    {
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
        var limit = playlist.internalList.length + 2;
        this.internalList.splice(index, limit, playlist);

        if (index < this.currentIndex && this.currentIndex < index + limit)
        {
            this.setCurrentIndex(index);
        }
        else if (this.currentIndex >= index + limit)
            this.setCurrentIndex(this.currentIndex - (limit - 1))

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
        var currentElement = this.getCurrentSong();
        var element = this.internalList[index];
        if (Playlist.isPlaylistMarker(element))
            return;
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

        if (currentElement != null)
        {
            let currentElementParent = currentElement.getParentPlaylist();
            if (currentElementParent == null)
                throw "Couldn't find current element's parent!";
            let currentElementIndex = currentElementParent.findElement(currentElement);
            if (currentElementIndex == -1)
                throw "Couldn't find current element anymore after moving element!";
            currentElementParent.setCurrentIndex(currentElementIndex);
        }

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