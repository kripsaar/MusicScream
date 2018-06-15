using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using MusicScream.Models;

namespace MusicScream.Utilities
{
    public class MusicLibraryHandler
    {
        private readonly MusicScreamContext _dbContext;
        private readonly string _musicFilesFolder;
        private readonly VgmdbLookupHandler _vgmdbLookupHandler;

        public MusicLibraryHandler(MusicScreamContext dbcontext, IConfiguration config, VgmdbLookupHandler vgmdbLookupHandler)
        {
            _dbContext = dbcontext;
            _musicFilesFolder = config["MusicFilesFolder"];
            _vgmdbLookupHandler = vgmdbLookupHandler;
        }

        public SongData GetSong(int songId)
        {
            var filename = _dbContext.Songs.FirstOrDefault(song => song.Id == songId)?.Filename;
            if (filename == null)
                return null;
            var file = TagLib.File.Create(filename);
            var data = File.ReadAllBytes(filename);
            var songData = new SongData(file.MimeType, data);
            return songData;
        }

        public SongData GetAlbumArt(int songId)
        {
            var filename = _dbContext.Songs.FirstOrDefault(song => song.Id == songId)?.Filename;
            if (filename == null)
                return null;
            var file = TagLib.File.Create(filename);
            if (file.Tag.Pictures.Length < 1)
                return null;
            var art = file.Tag.Pictures[0];
            var songData = new SongData(art.MimeType, art.Data.Data);
            return songData;
        }

        private void ScanFolder(string folderName)
        {
            var filenames = Directory.GetFiles(folderName);

            foreach (var filename in filenames)
            {
                TagLib.File file = TagLib.File.Create(filename);
                if (file.MimeType != "audio/mpeg")
                    continue;
                if (_dbContext.Songs.Any(s =>
                    s.Artist == file.Tag.FirstPerformer && s.Title == file.Tag.Title))
                    continue;
                var song = new Song
                {
                    Title = file.Tag.Title,
                    Artist = file.Tag.FirstPerformer,
                    Album = file.Tag.Album,
                    Genre = file.Tag.FirstGenre,
                    Year = file.Tag.Year,
                    Filename = filename
                };
                _dbContext.Add(song);
            }

            _dbContext.SaveChanges();

            // Check subdirectories

            var subdirs = Directory.GetDirectories(folderName);
            foreach (var folder in subdirs)
            {
                ScanFolder(folder);
            }
        }

        public bool RescanMusicFolder()
        {
            if (!Directory.Exists(_musicFilesFolder))
            {
                Directory.CreateDirectory(_musicFilesFolder);
                Thread.Sleep(500);
            }

            try
            {
                ScanFolder(_musicFilesFolder);
                return true;
            }
            catch (Exception e)
            {
                return false;
            }
        }

        public async void CreateArtist(string artistName)
        {
            var artist = await _vgmdbLookupHandler.GetArtistInfo(artistName);
        }

        public class SongData
        {
            public string MimeType { get; }
            public byte[] Data { get; }

            public SongData(string mimeType, byte[] data)
            {
                MimeType = mimeType;
                Data = data;
            }
        }
    }
}
