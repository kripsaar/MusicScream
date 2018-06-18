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

        private async Task ScanFolder(string folderName)
        {
            var filenames = Directory.GetFiles(folderName);

            foreach (var filename in filenames)
            {
                await CreateSong(filename);
            }

            // Check subdirectories

            var subdirs = Directory.GetDirectories(folderName);
            foreach (var folder in subdirs)
            {
                await ScanFolder(folder);
            }
        }

        public async Task<bool> RescanMusicFolder()
        {
            if (!Directory.Exists(_musicFilesFolder))
            {
                Directory.CreateDirectory(_musicFilesFolder);
                Thread.Sleep(500);
            }

            try
            {
                await ScanFolder(_musicFilesFolder);
                return true;
            }
            catch (Exception e)
            {
                return false;
            }
        }

        private async Task CreateSong(string filename)
        {
            TagLib.File file = TagLib.File.Create(filename);
            if (!(file.MimeType == "audio/mpeg" || file.MimeType == "taglib/mp3"))
                return;
            var title = file.Tag.Title.Trim();
            var rawArtistName = file.Tag.FirstPerformer.Trim();
            var artistNames = ParseArtistNames(rawArtistName);
            var albumName = file.Tag.Album.Trim();
            if (CheckIfSongExists(title, artistNames))
                return;
            var song = new Song
            {
                Title = title,
                Album = albumName,
                Genre = file.Tag.FirstGenre,
                Year = file.Tag.Year,
                Filename = filename
            };
            _dbContext.Add(song);
            await _dbContext.SaveChangesAsync();

            foreach (var artistName in artistNames)
            {
                if (!CheckIfArtistExists(artistName))
                    await CreateArtist(artistName);
            }

            var artists = FindArtistsWithNames(artistNames);
            var artistIds = artists.Select(_ => _.Id);

            foreach (var artistId in artistIds)
            {
                var artistSongLink = new ArtistSongLink
                {
                    ArtistId = artistId,
                    SongId = song.Id
                };
                try
                {

                    _dbContext.Add(artistSongLink);
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.StackTrace);
                }
            }

            await _dbContext.SaveChangesAsync();
        }

        private bool CheckIfSongExists(string title, IEnumerable<string> artistNames)
        {
            var songs = _dbContext.Songs.Where(_ => _.Title == title);
            foreach (var song in songs)
            {
                if (song.ArtistSongLinks == null)
                    return true;
                if (song.ArtistSongLinks.Any(_ =>
                    artistNames.Contains(_.Artist.Name) || _.Artist.Aliases.Intersect(artistNames).Any()
                ))
                    return true;
            }
            return false;
        }

        public async Task CreateArtists(IEnumerable<string> artistNames)
        {
            foreach (var artistName in artistNames)
            {
                await CreateArtist(artistName);
            }
        }

        public async Task CreateArtist(string artistName)
        {
            var artist = await _vgmdbLookupHandler.GetArtistInfo(artistName);

            if (artist.Name.ContainsCJK() && artist.Name.Contains(" "))
            {
                artist.Aliases.Append(artist.Name);
                artist.Name = String.Join("", artist.Name.Split(" "));
            }

            _dbContext.Add(artist);
            await _dbContext.SaveChangesAsync();

            var unitNames = await _vgmdbLookupHandler.GetArtistUnitNames(artist.VgmdbLink);
            var units = new List<Artist>();
            foreach (var unitName in unitNames)
            {
                units.AddRange(FindArtistsWithName(unitName));
            }

            foreach (var unit in units)
            {
                var artistUnitLink = new ArtistUnitLink
                { 
                    ArtistId = artist.Id,
                    UnitId = unit.Id
                };
                _dbContext.Add(artistUnitLink);
            }

            await _dbContext.SaveChangesAsync();
        }

        private List<Artist> FindArtistsWithNames(IEnumerable<string> names)
        {
            var artists = new List<Artist>();
            foreach (var name in names)
            {
                artists.AddRange(FindArtistsWithName(name));
            }
            return artists;
        }

        private List<Artist> FindArtistsWithName(string name)
        {
            var artists = _dbContext.Artists.Where(_ => _.Name == name || _.Aliases.Contains(name)).ToList();
            return artists;
        }

        private bool CheckIfArtistExists(string artistName)
        {
            var artists = FindArtistsWithName(artistName);
            return artists.Any();
        }

        private IEnumerable<string> ParseArtistNames(string artistNameString)
        {
            string[] names;
            if (artistNameString.Contains(","))
            {
                names = artistNameString.Split(",");
            }
            else if (artistNameString.Contains("、"))
            {
                names = artistNameString.Split("、");
            }
            else
                return new[] {HandleNameWithParenthesis(artistNameString)};

            var parsedNames = names.Select(HandleNameWithParenthesis);

            return parsedNames;
        }

        private string HandleNameWithParenthesis(string name)
        {
            var mainName = name;
            if ((name.Contains("(") && name.Contains(")")) || name.Contains("（") && name.Contains("）"))
            {
                var braceStart = '(';
                var braceEnd = ')';
                if (name.Contains("（"))
                {
                    braceStart = '（';
                    braceEnd = '）';
                }
//                高海千歌(CV.伊波杏樹)
//                キャロル・マールス・ディーンハイム（CV：水瀬 いのり）
                var splitName = name.Split(braceStart);
                if (splitName.Length < 2)
                    return mainName;
                splitName[0].TrimEnd();
                splitName[1].TrimEnd(braceEnd);
                if (splitName[1].StartsWith("CV") || splitName[1].StartsWith("cv"))
                {
                    mainName = splitName[1].Substring(2).Trim();
                    if (mainName.StartsWith(".") || mainName.StartsWith("：") || mainName.StartsWith(":"))
                        mainName = mainName.Substring(1).Trim();
                }
                else
                {
                    mainName = splitName[0];
                }
            }

            return mainName;
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
