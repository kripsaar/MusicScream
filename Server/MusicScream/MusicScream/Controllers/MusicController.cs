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
                    song.Artist,
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
                    song.Artist,
                    song.Album,
                    song.Genre,
                    song.Year
                })
            }));
        }

        public IActionResult GetAllSongs()
        {
            return SongsToJson(_dbContext.Songs);
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

        public IActionResult RefreshMusicLibrary()
        {
            if (!_libraryHandler.RescanMusicFolder())
                return BadRequest();

            //TODO: Remove test
            _libraryHandler.CreateArtist("Nano");
            _libraryHandler.CreateArtist("nano.RIPE");
            _libraryHandler.CreateArtist("やなぎなぎ");
            _libraryHandler.CreateArtist("Kawada Mami");

            return Ok();
        }
    }
}
