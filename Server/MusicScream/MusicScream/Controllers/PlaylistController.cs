using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MusicScream.Models;
using MusicScream.Utilities;
using Newtonsoft.Json.Linq;
using Microsoft.EntityFrameworkCore;

namespace MusicScream.Controllers
{
    public class PlaylistController : Controller
    {
        private readonly MusicScreamContext _dbContext;
        private readonly MusicLibraryHandler _libraryHandler;

        private static Object obj = new object();

        public PlaylistController(MusicScreamContext dbcontext, MusicLibraryHandler libraryHandler)
        {
            _dbContext = dbcontext;
            _libraryHandler = libraryHandler;
        }

        private IEnumerable<PlaylistElementTO> GetPlaylistElements(int playlistId)
        {
            var playlist = _dbContext.Playlists
                                .Include(pl => pl.PlaylistElements)
                                    .ThenInclude(ple => ple.Playlist)
                                .Single(pl => pl.Id == playlistId);
            var list = new List<PlaylistElementTO>();
            playlist.PlaylistElements.ForEach(element =>
            {
                if (element.PlaylistId != null)
                {
                    list.Add(new PlaylistElementTO
                    {
                        Id = element.PlaylistId.Value,
                        Name = element.Playlist.Name,
                        List = GetPlaylistElements(element.PlaylistId.Value)
                    });
                }
                else
                {
                    var song = _dbContext.Songs
                                    .Include(_ => _.ArtistLinks).ThenInclude(_ => _.Artist)
                                    .Include(_ => _.AlbumLinks).ThenInclude(_ => _.Album)
                                    .Include(_ => _.GenreLinks).ThenInclude(_ => _.Genre)
                                    .Include(_ => _.ProductLinks).ThenInclude(_ => _.Product)
                                    .Include(_ => _.SeasonLinks).ThenInclude(_ => _.Season)
                                    .Single(s => s.Id == element.SongId.Value);
                    list.Add(new PlaylistElementTO
                    {
                        Id = element.SongId.Value,
                        Title = song.Title,
                        Aliases = song.Aliases,
                        Year = song.Year,

                        Artists = song.ArtistLinks.Select(al => new ArtistInfo { Id = al.Artist.Id, Name = al.Artist.Name }),
                        Albums = song.AlbumLinks.Select(al => new AlbumInfo { Id = al.Album.Id, Title = al.Album.Title }),
                        Genres = song.GenreLinks.Select(al => new GenreInfo { Id = al.Genre.Id, Name = al.Genre.Name }),
                        Products = song.ProductLinks.Select(al => new ProductInfo { Id = al.Product.Id, Title = al.Product.Title }),
                        Seasons = song.SeasonLinks.Select(al => new SeasonInfo { Id = al.Season.Id, Name = al.Season.Name })
                    });
                }
            });
            return list;
        }

        private JsonResult PlaylistToJson(Playlist playlist)
        {
            // TODO: Send DateTime stuff
            // TODO: The actual list
            var list = GetPlaylistElements(playlist.Id);
            return Json(JObject.FromObject(new
            {
                playlistTO = new
                {
                    playlist.Id,
                    playlist.Name,
                    list
                }
            }));
        }


        [HttpPost]
        public IActionResult UpdatePlaylist([FromBody] PlaylistUpdateViewModel updateData)
        {
            if (updateData == null)
                return BadRequest();
            Playlist playlist;
            if (updateData.Id == 0)
            {
                // If ID is 0, create new persistent Playlist object
                playlist = CreateNewPlaylist(updateData);
                return PlaylistToJson(playlist);
            }
            else
                playlist = _dbContext.Playlists.Single(p => p.Id == updateData.Id);

            playlist.Name = updateData.Name;
            playlist.LastModified = NodaTime.SystemClock.Instance.GetCurrentInstant().InUtc();
            UpdatePlaylistElementList(playlist, updateData.List);
            return PlaylistToJson(playlist);
        }

        private Playlist CreateNewPlaylist(PlaylistUpdateViewModel playlistTO)
        {
            Playlist playlist = new Playlist
            {
                Name = playlistTO.Name,
                PlaylistElements = new List<PlaylistElement>(),
                CreationTime = NodaTime.SystemClock.Instance.GetCurrentInstant().InUtc(),
                LastModified = NodaTime.SystemClock.Instance.GetCurrentInstant().InUtc()
            };
            _dbContext.Add(playlist);
            _dbContext.SaveChanges();
            UpdatePlaylistElementList(playlist, playlistTO.List);
            return playlist;
        }

        private void UpdatePlaylistElementList(Playlist playlist, IEnumerable<PlaylistUpdateViewModel> playlistElementListTO)
        {
            var playlistElementList = playlist.PlaylistElements;
            var index = 0;
            foreach (var playlistElementTO in playlistElementListTO)
            {
                int? playlistId;
                int? songId;
                if (playlistElementTO.Name != null)
                {
                    playlistId = playlistElementTO.Id;
                    songId = null;
                }
                else
                {
                    playlistId = null;
                    songId = playlistElementTO.Id;
                }
                PlaylistElement playlistElement;
                lock (obj)
                {
                    _dbContext.Entry(playlist).Reload();
                    _dbContext.Entry(playlist).Collection(pl => pl.PlaylistElements).Load();
                    if (index >= playlist.PlaylistElements.Count())
                    {
                        playlistElement = new PlaylistElement
                        {
                            ParentPlaylistId = playlist.Id,
                            Position = index,
                            PlaylistId = playlistId,
                            SongId = songId
                        };
                        _dbContext.Add(playlistElement);
                        _dbContext.SaveChanges();
                    }
                    else
                    {
                        playlistElement = playlist.PlaylistElements.Single(pe => pe.Position == index);
                        playlistElement.SongId = songId;
                        playlistElement.PlaylistId = playlistId;
                        _dbContext.SaveChanges();
                    }
                }
                ++index;
            }
            if (playlistElementListTO.Count() < playlist.PlaylistElements.Count())
            {
                index = playlist.PlaylistElements.Count() - 1;
                while (playlistElementListTO.Count() < playlist.PlaylistElements.Count())
                {
                    lock(obj)
                    {
                        var playlistElement = playlist.PlaylistElements.SingleOrDefault(pe => pe.Position == index);
                        if (playlistElement != null)
                        {
                            _dbContext.Remove(playlistElement);
                            _dbContext.SaveChanges();
                        }
                        --index;
                        _dbContext.Entry(playlist).Reload();
                        _dbContext.Entry(playlist).Collection(pl => pl.PlaylistElements).Load();
                    }
                }
            }
        }

        public IActionResult GetPlaylist(int id)
        {
            // TODO: The actual function, I dunno
            var playlist = _dbContext.Playlists.SingleOrDefault(pl => pl.Id ==  id);
            if (playlist == null)
                return BadRequest();
            return PlaylistToJson(playlist);
        }

        public class PlaylistUpdateViewModel
        {
            public int Id { get; set; }
            public string Name { get; set; }
            public string Title { get; set; }
            public IEnumerable<PlaylistUpdateViewModel> List { get; set; }
        }

        public class PlaylistElementTO
        {
            public int Id { get; set; }
            public string Name { get; set; }
            public IEnumerable<PlaylistElementTO> List { get; set; }

            public string Title { get; set; }
            public string[] Aliases { get; set; }
            public uint Year { get; set; }
            public IEnumerable<ArtistInfo> Artists { get; set; }
            public IEnumerable<AlbumInfo> Albums { get; set; }
            public IEnumerable<GenreInfo> Genres { get; set; }
            public IEnumerable<ProductInfo> Products { get; set; }
            public IEnumerable<SeasonInfo> Seasons { get; set; }
        }
    }
}