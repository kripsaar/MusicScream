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
using NodaTime;

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

        public async Task<SongData> GetAlbumArt(int songId)
        {
            var filename = _dbContext.Songs.FirstOrDefault(song => song.Id == songId)?.Filename;
            if (filename == null)
                return null;
            var file = TagLib.File.Create(filename);
            if (file.Tag.Pictures.Length < 1)
            {
                var albumSongLink = _dbContext.AlbumSongLinks.Include(_ => _.Album).FirstOrDefault(_ => _.SongId == songId);
                if (albumSongLink == null)
                    return null;
                var (dbArtData, dbArtMimeType) = await _vgmdbLookupHandler.GetAlbumArt(albumSongLink.Album.VgmdbLink);
                if (dbArtData == null || dbArtMimeType == null)
                    return null;
                var picture = new TagLib.Picture(new TagLib.ByteVector(dbArtData));
                var pictureFrame =
                    new TagLib.Id3v2.AttachedPictureFrame(picture) {Type = TagLib.PictureType.FrontCover};
                TagLib.IPicture[] frames = {pictureFrame};
                file.Tag.Pictures = frames;
                file.Save();
            }

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
            var rawTitle = file.Tag.Title.Trim();
            var rawArtistName = file.Tag.FirstPerformer.Trim();
            var rawArtistNames = ParseArtistNames(rawArtistName);
            var rawAlbumName = file.Tag.Album.Trim();
            var rawGenres = file.Tag.Genres;
            if (CheckIfSongExists(rawTitle, rawArtistNames))
                return;

            foreach (var artistName in rawArtistNames)
            {
                if (!CheckIfArtistExists(artistName))
                    await CreateArtist(artistName);
            }

            var artists = FindArtistsWithNames(rawArtistNames);

            // Create album

            Album album;
            if (CheckIfAlbumExists(rawAlbumName, artists))
                album = FindAlbumWithTitleAndArtists(rawAlbumName, artists);
            else
                album = await CreateAlbum(rawAlbumName, artists, rawGenres);

            // Find proper song title(s) from album

            var (songtitle, aliases) = await _vgmdbLookupHandler.FindSongTitleAndAliases(rawTitle, album.VgmdbLink);

            // Create song

            var song = new Song
            {
                Title = songtitle,
                Aliases = aliases.Append(rawTitle).Distinct().ToArray(),
                Year = (uint) album.ReleaseDate.ToDateTimeUtc().Year,
                Filename = filename
            };
            _dbContext.Add(song);
            _dbContext.SaveChanges();

            // Create song links

            // ReSharper disable once PossibleNullReferenceException
            if (_dbContext.Albums.Include(_ => _.ProductLinks).ThenInclude(_ => _.Product)
                .FirstOrDefault(_ => _.Id == album.Id).ProductLinks.Any(_ => _.Product.Type == Product.Animation))
                CreateSeasonSongLinks(song, album.ReleaseDate);

            CreateArtistSongLinks(artists, song);
            CreateAlbumSongLink(album, song);
            CreateSongGenreLinks(song, album);
            CreateProductSongLinks(song, album);
        }

        private void CreateSeasonSongLinks(Song song, Instant releaseDate)
        {
            var season = ResolveSeason(releaseDate);
            var seasonSongLink = new SeasonSongLink
            {
                SeasonId = season.Id,
                SongId = song.Id
            };
            _dbContext.Add(seasonSongLink);
            _dbContext.SaveChanges();
        }

        private void CreateProductSongLinks(Song song, Album album)
        {
            var productSongLinks = _dbContext.ProductSongLinks.ToList();
            foreach (var productAlbumLink in album.ProductLinks)
            {
                if (productSongLinks.Any(_ =>
                    _.SongId == song.Id && _.ProductId == productAlbumLink.ProductId))
                    continue;
                var productSongLink = new ProductSongLink
                {
                    ProductId = productAlbumLink.ProductId,
                    SongId = song.Id
                };
                _dbContext.Add(productSongLink);
                _dbContext.SaveChanges();
            }
        }

        private void CreateSongGenreLinks(Song song, Album album)
        {
            var songGenreLinks = _dbContext.SongGenreLinks.ToList();
            foreach (var genreLink in album.GenreLinks)
            {
                var genreId = genreLink.GenreId;
                if (songGenreLinks.Any(_ => _.SongId == song.Id && _.GenreId == genreId))
                    continue;
                var songGenreLink = new SongGenreLink
                {
                    SongId = song.Id,
                    GenreId = genreId
                };
                _dbContext.Add(songGenreLink);
                _dbContext.SaveChanges();
            }
        }

        private bool CheckIfSongExists(string title, IReadOnlyList<string> artistNames)
        {
            var song = _dbContext.Songs.Include(_ => _.ArtistLinks).ThenInclude(_ => _.Artist)
                .FirstOrDefault(_ => (_.Title == title || _.Aliases.Contains(title)) 
                                     && _.ArtistLinks.Any(artist => artistNames.Contains(artist.Artist.Name) || artist.Artist.Aliases.Intersect(artistNames).Any()));
            return song != null;
        }

        private bool CheckIfAlbumExists(string title, IReadOnlyList<Artist> artists)
        {
            var albums = _dbContext.Albums.Where(album => album.Title == title || album.Aliases.Contains(title));
            foreach (var album in albums)
            {
                if (album.ArtistLinks == null)
                    return true;
                if (album.ArtistLinks.Any(artistAlbumLink =>
                    artists.Any(artist => artist.Id == artistAlbumLink.ArtistId)))
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
            var artistSongLinks = _dbContext.ArtistSongLinks.ToList();
            foreach (var artist in artists)
            {
                if (artistSongLinks.Any(_ => _.SongId == song.Id && _.ArtistId == artist.Id))
                    continue;
                var artistSongLink = new ArtistSongLink
                {
                    ArtistId = artist.Id,
                    SongId = song.Id
                };
                _dbContext.Add(artistSongLink);
            }

            _dbContext.SaveChanges();
        }

        private async Task<Album> CreateAlbum(string albumName, IReadOnlyList<Artist> artists, IReadOnlyList<string> genres)
        {
            Album album;
            if (albumName == "" || albumName == "Single")
            {
                var unknownAlbum = _dbContext.Albums.FirstOrDefault(_ => _.Title == "Unknown Album");
                if (unknownAlbum == null)
                {
                    unknownAlbum = new Album
                    {
                        Title = "Unknown Album",
                        Aliases = new string[0],
                        ReleaseDate = Instant.MinValue,
                        VgmdbLink = ""
                    };
                    _dbContext.Add(unknownAlbum);
                    _dbContext.SaveChanges();
                }
                album = unknownAlbum;
            }
            else
            {
                var firstArtist = artists.FirstOrDefault();
                if (!string.IsNullOrEmpty(firstArtist?.VgmdbLink))
                {
                    album = await _vgmdbLookupHandler.FindAlbumFromArtistDiscography(albumName, firstArtist.VgmdbLink);
                }
                else
                    album = await _vgmdbLookupHandler.FindAlbumFromSearch(albumName);
            }

            // Double check if album exists

            if (_dbContext.Albums.Any(_ => _.Title == album.Title && _.VgmdbLink == album.VgmdbLink))
                album = _dbContext.Albums.FirstOrDefault(_ => _.Title == album.Title && _.VgmdbLink == album.VgmdbLink);
            else
            {
                // Adds album to DB context
                _dbContext.Add(album);
                _dbContext.SaveChanges();

                // Create Product-Album links
                await CreateProductAlbumLinks(album);

                // Create Season-Product links if necessary
                CreateSeasonProductLinks(album);

                // Create Album-Genre links
                CreateAlbumGenreLinks(album, genres);
            }

            // Create Artist-Album links
            CreateArtistAlbumLinks(artists, album);

            return album;
        }

        private void CreateSeasonProductLinks(Album album)
        {
            var season = ResolveSeason(album.ReleaseDate);

            var yes = album.ProductLinks;
            var albumProducts = album.ProductLinks.Select(_ => _.Product);
//            var albumProducts = _dbContext.ProductAlbumLinks.Where(_ => _.AlbumId == album.Id).Select(_ => _.Product);
            var seasonProductLinks = _dbContext.SeasonProductLinks.ToList();
            foreach (var product in albumProducts)
            {
                if (product.Type != Product.Animation || seasonProductLinks.Any(_ => _.ProductId == product.Id && _.SeasonId == season.Id))
                    continue;
                var seasonProductLink = new SeasonProductLink
                {
                    ProductId = product.Id,
                    SeasonId = season.Id
                };
                _dbContext.Add(seasonProductLink);
                _dbContext.SaveChanges();
            }
        }

        private void CreateAlbumGenreLinks(Album album, IReadOnlyList<string> genres)
        {
            var albumGenreLinks = _dbContext.AlbumGenreLinks.ToList();
            foreach (var genreName in genres)
            {
                var genre = _dbContext.Genres.FirstOrDefault(_ => _.Name == genreName);
                if (genre == null)
                {
                    genre = new Genre
                    {
                        Name = genreName
                    };
                    _dbContext.Add(genre);
                    _dbContext.SaveChanges();
                }

                if (albumGenreLinks.Any(_ => _.AlbumId == album.Id && _.GenreId == genre.Id))
                    continue;

                var albumGenreLink = new AlbumGenreLink
                {
                    AlbumId = album.Id,
                    GenreId = genre.Id
                };
                _dbContext.Add(albumGenreLink);
                _dbContext.SaveChanges();
            }

        }

        private async Task CreateProductAlbumLinks(Album album)
        {
            var products = await _vgmdbLookupHandler.FindProductsForAlbum(album.VgmdbLink);

            foreach (var product in products)
            {
                var dbProduct = _dbContext.Products.FirstOrDefault(_ => _.VgmdbLink == product.VgmdbLink);
                if (dbProduct != null)
                {
                    CreateProductAlbumLink(dbProduct, album);
                    continue;
                }

                _dbContext.Add(product);
                _dbContext.SaveChanges();
                CreateProductAlbumLink(product, album);
            }
        }

        private void CreateProductAlbumLink(Product product, Album album)
        {
            if (_dbContext.ProductAlbumLinks.Any(_ => _.ProductId == product.Id && _.AlbumId == album.Id))
                return;
            var productAlbumLink = new ProductAlbumLink
            {
                ProductId = product.Id,
                AlbumId = album.Id
            };
            _dbContext.Add(productAlbumLink);
            _dbContext.SaveChanges();
        }

        private void CreateArtistAlbumLinks(IReadOnlyList<Artist> artists, Album album)
        {
            var artistAlbumLinks = _dbContext.ArtistAlbumLinks.ToList();
            foreach (var artist in artists)
            {
                if (artistAlbumLinks.Any(_ => _.ArtistId == artist.Id && _.AlbumId == album.Id))
                    continue;
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
            if (_dbContext.AlbumSongLinks.Any(_ => _.AlbumId == album.Id && _.SongId == song.Id))
                return;
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
            var artists = _dbContext.Artists.Where(_ => _.Name == name || _.Aliases.Contains(name))
                .Include(_ => _.AlbumLinks)
                .Include(_ => _.ArtistUnitLinks)
                .Include(_ => _.UnitArtistLinks)
                .ToList();
            return artists;
        }

        private Album FindAlbumWithTitleAndArtists(string title, IReadOnlyList<Artist> artists)
        {
            var albums = _dbContext.Albums.Where(album => album.Title == title || album.Aliases.Contains(title)).Include(_ => _.GenreLinks).Include(_ => _.ArtistLinks);
            var artistAlbumLinks = artists.SelectMany(_ => _.AlbumLinks);
            return albums.FirstOrDefault(album => album.ArtistLinks.Intersect(artistAlbumLinks).Any());
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

        private Season ResolveSeason(Instant releaseDate)
        {
            var year = releaseDate.InUtc().Year;
            var month = releaseDate.InUtc().Month;
            string seasonPrefix;
            if (month < 4)
                seasonPrefix = "Winter";
            else if (month < 7)
                seasonPrefix = "Spring";
            else if (month < 10)
                seasonPrefix = "Summer";
            else
                seasonPrefix = "Autumn";
            var season = new Season
            {
                Year = year,
                Name = seasonPrefix + " " + year
            };

            var dbSeason = _dbContext.Seasons.FirstOrDefault(_ => _.Name == season.Name);
            if (dbSeason != null)
                return dbSeason;

            _dbContext.Add(season);
            _dbContext.SaveChanges();

            return season;
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
