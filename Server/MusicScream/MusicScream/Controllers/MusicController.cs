using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MusicScream.Models;
using MusicScream.Utilities;
using Newtonsoft.Json.Linq;

namespace MusicScream.Controllers
{
    public class MusicController : Controller
    {
        private readonly MusicScreamContext _dbContext;
        private readonly MusicLibraryHandler _libraryHandler;

        public MusicController(MusicScreamContext dbcontext, MusicLibraryHandler libraryHandler)
        {
            _dbContext = dbcontext;
            _libraryHandler = libraryHandler;
        }

        private JsonResult SongToJson(Song song)
        {
            return Json(JObject.FromObject(new
            {
                song = new
                {
                    song.Id,
                    song.Title,
                    Artist = song.ArtistLinks.Any() ? String.Join(", ", song.ArtistLinks.Select(_ => _.Artist.Name)) : "Unknown Artist",
                    Album = song.AlbumLinks.Any() ? String.Join(", ", song.AlbumLinks.Select(_ => _.Album.Title)) : "Unknown Album",
                    Genre = song.GenreLinks.Any() ? String.Join(", ", song.GenreLinks.Select(_ => _.Genre.Name)) : "Unknown Genre",
                    song.Year
                }
            }));
        }

        private JsonResult SongsToJson(IEnumerable<Song> songs)
        {
            return Json(JObject.FromObject(new
            {
                songs = songs.Select(song => new
                {
                    song.Id,
                    song.Title,
                    Artist = song.ArtistLinks.Any() ? String.Join(", ", song.ArtistLinks.Select(_ => _.Artist.Name)) : "Unknown Artist",
                    Album = song.AlbumLinks.Any() ? String.Join(", ", song.AlbumLinks.Select(_ => _.Album.Title)) : "Unknown Album",
                    Genre = song.GenreLinks.Any() ? String.Join(", ", song.GenreLinks.Select(_ => _.Genre.Name)) : "Unknown Genre",
                    song.Year
                })
            }));
        }

        public IActionResult GetAllSongs()
        {
            return SongsToJson(_dbContext.Songs
                .Include(_ => _.ArtistLinks).ThenInclude(_ => _.Artist)
                .Include(_ => _.AlbumLinks).ThenInclude(_ => _.Album)
                .Include(_ => _.GenreLinks).ThenInclude(_ => _.Genre)
            );
        }

        public IActionResult GetSong(int songId)
        {
            var songData = _libraryHandler.GetSong(songId);
            var fileResult = new FileContentResult(songData.Data, songData.MimeType);
            return fileResult;
        }

        public IActionResult GetAlbumArt(int songId)
        {
            var songData = _libraryHandler.GetAlbumArt(songId);
            if (songData == null)
                return Ok();
            return new FileContentResult(songData.Data, songData.MimeType);
        }

        public async Task<IActionResult> RefreshMusicLibrary()
        {
            if (!(await _libraryHandler.RescanMusicFolder()))
                return BadRequest();

            return Ok();
        }
    }
}
