﻿using System;
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
                    song.Aliases,
                    song.Year,
                    Artists = song.ArtistLinks.Select(_ => new { Id = _.ArtistId, Name = _.Artist.Name }),
                    Albums = song.AlbumLinks.Select(_ => new { Id = _.AlbumId, Title = _.Album.Title}),
                    Genres = song.GenreLinks.Select(_ => new {Id = _.GenreId, Name = _.Genre.Name}),
                    Products = song.ProductLinks.Select(_ => new {Id = _.ProductId, Title = _.Product.Title}),
                    Seasons = song.SeasonLinks.Select(_ => new { Id = _.SeasonId, Name = _.Season.Name })

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
                    song.Aliases,
                    song.Year,
                    Artists = song.ArtistLinks.Select(_ => new { Id = _.ArtistId, Name = _.Artist.Name }),
                    Albums = song.AlbumLinks.Select(_ => new { Id = _.AlbumId, Title = _.Album.Title }),
                    Genres = song.GenreLinks.Select(_ => new { Id = _.GenreId, Name = _.Genre.Name }),
                    Products = song.ProductLinks.Select(_ => new { Id = _.ProductId, Title = _.Product.Title }),
                    Seasons = song.SeasonLinks.Select(_ => new { Id = _.SeasonId, Name = _.Season.Name })
                })
            }));
        }

        private JsonResult ArtistToJson(Artist artist)
        {
            return Json(JObject.FromObject(new
            {
                artist = new
                {
                    artist.Id,
                    artist.Name,
                    artist.Aliases,

                    Albums = artist.AlbumLinks.Select(_ => new { Id = _.AlbumId, Title = _.Album.Title }),
                    Songs = artist.SongLinks.Select(_ => new { Id = _.SongId, Title = _.Song.Title }),
                    Units = artist.ArtistUnitLinks.Select(_ => new { Id = _.UnitId, Name = _.Unit.Name }),
                    UnitMembers = artist.UnitArtistLinks.Select(_ => new { Id = _.ArtistId, Name = _.Artist.Name })
                }
            }));
        }

        public IActionResult GetAllSongs()
        {
            return SongsToJson(_dbContext.Songs
                .Include(_ => _.ArtistLinks).ThenInclude(_ => _.Artist)
                .Include(_ => _.AlbumLinks).ThenInclude(_ => _.Album)
                .Include(_ => _.GenreLinks).ThenInclude(_ => _.Genre)
                .Include(_ => _.ProductLinks).ThenInclude(_ => _.Product)
                .Include(_ => _.SeasonLinks).ThenInclude(_ => _.Season)
            );
        }

        public IActionResult GetSong(int songId)
        {
            var songData = _libraryHandler.GetSong(songId);
            var fileResult = new FileContentResult(songData.Data, songData.MimeType);
            fileResult.EnableRangeProcessing = true;
            return fileResult;
        }

        public async Task<IActionResult> GetAlbumArt(int songId)
        {
            var songData = await _libraryHandler.GetAlbumArt(songId);
            if (songData == null)
                return Ok();
            return new FileContentResult(songData.Data, songData.MimeType);
        }

        public IActionResult GetArtist(int id)
        {
            var artist = _dbContext.Artists
                .Include(_ => _.AlbumLinks).ThenInclude(_ => _.Album)
                .Include(_ => _.SongLinks).ThenInclude(_ => _.Song)
                .Include(_ => _.ArtistUnitLinks).ThenInclude(_ => _.Unit)
                .Include(_ => _.UnitArtistLinks).ThenInclude(_ => _.Artist)
                .Single(e => e.Id == id);
            var result = ArtistToJson(artist);
            return result;
        }

        public async Task<IActionResult> RefreshMusicLibrary()
        {
            if (!(await _libraryHandler.RescanMusicFolder()))
                return BadRequest();

            return Ok();
        }
    }
}
