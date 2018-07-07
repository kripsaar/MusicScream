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

            foreach (var artistName in artistNames)
            {
                if (!CheckIfArtistExists(artistName))
                    await CreateArtist(artistName);
            }

            var artists = FindArtistsWithNames(artistNames);

            // Create album

            var album = await CreateAlbumAndLinkToArtist(albumName, artists);

            // Find proper song title(s) from album

            var titleAndAliases = await _vgmdbLookupHandler.FindSongTitleAndAliases(title, album.VgmdbLink);

            // Create song

            var song = new Song
            {
                Title = titleAndAliases.songTitle,
                Aliases = titleAndAliases.aliases.ToArray(),
                Album = album.Title,
                Genre = file.Tag.FirstGenre,
                Year = file.Tag.Year,
                Filename = filename
            };
            _dbContext.Add(song);
            _dbContext.SaveChanges();

            // Create song links

            CreateArtistSongLinks(artists, song);
            CreateAlbumSongLink(album, song);

            // TODO: Deal with duplicates
        }

        private bool CheckIfSongExists(string title, IReadOnlyList<string> artistNames)
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

        public async Task CreateArtist(string artistName)
        {
            var artist = await _vgmdbLookupHandler.GetArtistInfo(artistName);

            if (artist.Name.ContainsCJK() && artist.Name.Contains(" "))
            {
                artist.Aliases.Append(artist.Name);
                artist.Name = String.Join("", artist.Name.Split(" "));
            }

            _dbContext.Add(artist);
            _dbContext.SaveChanges();

            await CreateArtistUnitLinks(artist);
        }

        private async Task CreateArtistUnitLinks(Artist artist)
        {
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

            _dbContext.SaveChanges();

        }

        private void CreateArtistSongLinks(IReadOnlyList<Artist> artists, Song song)
        {
            foreach (var artist in artists)
            {
                var artistSongLink = new ArtistSongLink
                {
                    ArtistId = artist.Id,
                    SongId = song.Id
                };
                _dbContext.Add(artistSongLink);
            }

            _dbContext.SaveChanges();
        }

        private async Task<Album> CreateAlbumAndLinkToArtist(string albumName, IReadOnlyList<Artist> artists)
        {
            Album album;
            var firstArtist = artists.FirstOrDefault();
            if (!string.IsNullOrEmpty(firstArtist?.VgmdbLink))
            {
                 album = await _vgmdbLookupHandler.FindAlbumFromArtistDiscography(albumName, firstArtist.VgmdbLink);
            }
            else
                album = await _vgmdbLookupHandler.FindAlbumFromSearch(albumName);

            // Adds album to DB context
            _dbContext.Add(album);
            try
            {
                _dbContext.SaveChanges();
            }
            catch (Exception e)
            {
                Console.WriteLine(e);
            }

            // Create album artist link
            CreateArtistAlbumLinks(artists, album);

            return album;
        }

        private void CreateArtistAlbumLinks(IReadOnlyList<Artist> artists, Album album)
        {
            foreach (var artist in artists)
            {
                var artistAlbumLink = new ArtistAlbumLink
                {
                    AlbumId = album.Id,
                    ArtistId = artist.Id
                };
                _dbContext.Add(artistAlbumLink);
            }

            _dbContext.SaveChanges();
        }

        private void CreateAlbumSongLink(Album album, Song song)
        {
            var albumSongLink = new AlbumSongLink
            {
                AlbumId = album.Id,
                SongId = song.Id
            };
            _dbContext.Add(albumSongLink);
            _dbContext.SaveChanges();
        }

        private List<Artist> FindArtistsWithNames(IReadOnlyList<string> names)
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

        private IReadOnlyList<string> ParseArtistNames(string artistNameString)
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

            return parsedNames.ToList();
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
                splitName[0] = splitName[0].TrimEnd();
                splitName[1] = splitName[1].TrimEnd(braceEnd);
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
