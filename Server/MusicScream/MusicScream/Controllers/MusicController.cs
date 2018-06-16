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
                    Artist = song.ArtistSongLinks.FirstOrDefault()?.Artist.Name ?? "Unknown Artist",
                    song.Album,
                    song.Genre,
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
                    Artist = song.ArtistSongLinks.FirstOrDefault()?.Artist.Name ?? "Unknown Artist",
                    song.Album,
                    song.Genre,
                    song.Year
                })
            }));
        }

        public IActionResult GetAllSongs()
        {
            return SongsToJson(_dbContext.Songs.Include(_ => _.ArtistSongLinks).ThenInclude(_ => _.Artist));
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
