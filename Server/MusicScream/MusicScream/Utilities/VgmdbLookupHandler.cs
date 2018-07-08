using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MusicScream.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NodaTime;
using NodaTime.Text;

namespace MusicScream.Utilities
{
    public class VgmdbLookupHandler
    {
        private readonly HttpClient _httpClient;
        private readonly string _vgmdbApiBaseUrl = "https://vgmdb.info/";
        private readonly string _vgmdbBaseUrl = "https://vgmdb.net/";
        private readonly string _formatSpecifier = "?format=json";

        public VgmdbLookupHandler(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        private string GetSearchUrl(string query)
        {
            return _vgmdbApiBaseUrl + "search/" + query + _formatSpecifier;
        }

        private string GetAlternateSearchUrl(string query)
        {
            return _vgmdbBaseUrl + "search?q=" + query;
        }

        private string GetPageUrl(string link)
        {
            return _vgmdbApiBaseUrl + link + _formatSpecifier;
        }

        private async Task<string> FindArtistPage(string artistName)
        {
            var requestUrl = GetSearchUrl(artistName);
            var response = await _httpClient.GetStringAsync(requestUrl);
            var searchResult = JObject.Parse(response)["results"].ToObject<SearchResults>();
            // Find closest match
            return FindClosestArtistNameMatchLink(artistName, searchResult.Artists);
        }

        private async Task<ArtistResult> GetArtistPageInfo(string artistLink)
        {
            if (artistLink == "")
                return null;
            var requestUrl = GetPageUrl(artistLink);
            var response = await _httpClient.GetStringAsync(requestUrl);
            var artistResult = JObject.Parse(response).ToObject<ArtistResult>();
            return artistResult;
        }

        public async Task<Artist> GetArtistInfo(string artistName)
        {
            var artistLink = await FindArtistPage(artistName);
            if (artistLink == "")
            {
                return new Artist
                {
                    Name = artistName,
                    VgmdbLink = "",
                    Aliases = new string[0]
                };
            }
            var artistResult = await GetArtistPageInfo(artistLink);
            var aliases = new List<string>();
            if (artistResult.Aliases != null)
                aliases.AddRange(StringUtils.GetStringsWithPermutations(artistResult.Aliases.Select(_ => _.Names.En)));
            if (artistResult.Info.Variations != null)
            {
                var enNames = artistResult.Info.Variations.Where(_ => _.Names.En != null).Select(_ => _.Names.En);
                var jaNames = artistResult.Info.Variations.Where(_ => _.Names.Ja != null).Select(_ => _.Names.Ja);
                aliases.AddRange(StringUtils.GetStringsWithPermutations(enNames.Concat(jaNames)));
            }
            if (artistResult.Name_Real != null)
                aliases.AddRange(StringUtils.GetStringsWithPermutations(new []{artistResult.Name}));
            var artist = new Artist
            {
                VgmdbLink = artistResult.Link,
                Name = artistResult.Name_Real ?? artistResult.Name,
                Aliases = aliases.ToArray()
            };
            
            return artist;
        }

        public async Task<IEnumerable<string>> GetArtistUnitNames(string artistLink)
        {
            if (artistLink == "")
                return Enumerable.Empty<string>();
            var artistResult = await GetArtistPageInfo(artistLink);
            var res = artistResult.Units.Select(_ => _.Names.En);
            return res;
        }

        private async Task<AlbumResult> GetAlbumPageInfo(string albumLink)
        {
            if (albumLink == "")
                return null;

            var requestUrl = GetPageUrl(albumLink);
            var response = await _httpClient.GetStringAsync(requestUrl);
            var albumResponse = JObject.Parse(response).ToObject<AlbumResult>();
            return albumResponse;
        }

        public async Task<string> FindAlbumPage(string albumName)
        {
            try
            {
                var requestUrl = GetSearchUrl(albumName);
                var response = await _httpClient.GetStringAsync(requestUrl);
                var searchResult = JObject.Parse(response)["results"].ToObject<SearchResults>();
                // Find closest match
                return FindClosestAlbumNameMatchLink(albumName, searchResult.Albums);
            }
            catch
            {
                var requestUrl = GetAlternateSearchUrl(albumName);
                var response = await _httpClient.GetAsync(requestUrl);
                var newRequestUrl = response.RequestMessage.RequestUri.ToString();
                if (string.IsNullOrEmpty(newRequestUrl))
                    return "";
                var linkIndex = newRequestUrl.IndexOf("album/");
                if (linkIndex == -1)
                    return "";
                return newRequestUrl.Substring(linkIndex);
            }
        }

        public async Task<Album> FindAlbumFromSearch(string albumName)
        {
            var albumLink = await FindAlbumPage(albumName);
            if (albumLink == "")
                return new Album
                {
                    Title = albumName,
                    VgmdbLink = "",
                    Aliases = new string[0]
                };
            return await GetAlbumFromAlbumLink(albumName, albumLink);
        }

        public async Task<Album> FindAlbumFromArtistDiscography(string albumName, string artistLink)
        {
            var cleanAlbumName = CleanAlbumName(albumName);
            if (artistLink == "")
                return new Album
                {
                    Title = cleanAlbumName,
                    VgmdbLink = ""
                };
            var artistResult = await GetArtistPageInfo(artistLink);
            var discographyResult = artistResult.Discography;
            var albumLink = FindClosestAlbumNameMatchLink(cleanAlbumName, discographyResult);
            return await GetAlbumFromAlbumLink(albumName, albumLink);
        }

        public async Task<Album> GetAlbumFromAlbumLink(string albumName, string albumLink)
        {
            var albumPage = await GetAlbumPageInfo(albumLink);
            if (albumPage == null)
                return null;
            string name;
            var aliases = new List<string> {albumName};
            var enNames = SeparateAlbumArtistNames(albumPage.Names.En);
            if (albumPage.Names.Ja != null)
            {
                var jaNames = SeparateAlbumArtistNames(albumPage.Names.Ja);
                name = jaNames.Last();
                aliases.AddRange(jaNames.SkipLast(1));
                aliases.AddRange(enNames);
                if (albumPage.Names.Ja_Latn != null)
                    aliases.AddRange(SeparateAlbumArtistNames(albumPage.Names.Ja_Latn));
            }
            else if (albumPage.Names.Ja_Latn != null)
            {
                var jaLatnNames = SeparateAlbumArtistNames(albumPage.Names.Ja_Latn);
                name = jaLatnNames.Last();
                aliases.AddRange(jaLatnNames.SkipLast(1));
                aliases.AddRange(enNames);
            }
            else
            {
                name = enNames.Last();
                aliases.AddRange(enNames.SkipLast(1));
                if (albumPage.Names.Ja_Latn != null)
                    aliases.AddRange(SeparateAlbumArtistNames(albumPage.Names.Ja_Latn));
            }

            var releaseDate = albumPage.Release_Date != null
                ? InstantPattern.CreateWithCurrentCulture("yyyy-MM-dd").Parse(albumPage.Release_Date).Value
                : Instant.MinValue;
            var album = new Album
            {
                Title = name,
                Aliases = aliases.Distinct().ToArray(),
                ReleaseDate = releaseDate,
                VgmdbLink = albumPage.Link
            };

            return album;
        }

        private string FindClosestArtistNameMatchLink(string query, IEnumerable<ArtistSearchResults> artists)
        {
            string minRes = "";
            int minDist = int.MaxValue;
            foreach (var artist in artists)
            {
                var artistDist = GetNameDistanceForArtistSearchResult(query, artist);
                if (artistDist == 0)
                    return artist.Link;
                if (artistDist < minDist)
                {
                    minDist = artistDist;
                    minRes = artist.Link;
                }
            }

            return minRes;
        }

        private int GetNameDistanceForArtistSearchResult(string query, ArtistSearchResults artist)
        {
            var minDist = StringUtils.GetLevenshteinDistanceWordOrderIndependent(query, artist.Names.En);
            foreach (var alias in artist.Aliases)
            {
                minDist = Math.Min(minDist, StringUtils.GetLevenshteinDistanceWordOrderIndependent(query, alias));
            }

            return minDist;
        }

        private string FindClosestAlbumNameMatchLink(string query, IEnumerable<AlbumInfoResult> albumInfo)
        {
            var minRes = "";
            var minDist = int.MaxValue;
            foreach (var album in albumInfo)
            {
                var albumDist = GetAlbumNameDistance(query, album.Titles);
                if (albumDist == 0)
                    return album.Link;
                if (albumDist < minDist)
                {
                    minDist = albumDist;
                    minRes = album.Link;
                }
            }

            return minRes;
        }

        private int GetAlbumNameDistance(string query, TitlesResult albumTitles)
        {
            var minDist = int.MaxValue;
            var enNames = SeparateAlbumArtistNames(albumTitles.En);
            foreach (var name in enNames)
                minDist = Math.Min(minDist, StringUtils.GetLevenshteinDistance(query, name));
            if (albumTitles.Ja != null)
            {
                var jaNames = SeparateAlbumArtistNames(albumTitles.Ja);
                foreach (var name in jaNames)
                    minDist = Math.Min(minDist, StringUtils.GetLevenshteinDistance(query, name));
            }
            return minDist;
        }

        private IEnumerable<string> SeparateAlbumArtistNames(string albumName)
        {
            const string separator = " / ";
            var albumNames = new List<string> {albumName};
            var lastSeparatorIndex = albumName.LastIndexOf(separator);
            if (lastSeparatorIndex == -1)
                return albumNames;
            albumNames.Add(albumName.Substring(0, lastSeparatorIndex));
            return albumNames;
        }

        private string CleanAlbumName(string albumName)
        {
            const string target = "Single - ";
            var targetIndex = albumName.IndexOf(target);
            if (targetIndex == -1)
                return albumName;
            var cleanAlbumName = albumName.Substring(targetIndex + target.Length);
            return cleanAlbumName;
        }

        public async Task<(string songTitle, IEnumerable<string> aliases)> FindSongTitleAndAliases(string prelimTitle,
            string albumLink)
        {
            var albumPage = await GetAlbumPageInfo(albumLink);
            var minDist = int.MaxValue;
            var title = prelimTitle;
            var aliases = new List<string>();
            foreach (var disc in albumPage.Discs)
            {
                foreach (var track in disc.Tracks)
                {
                    var trackMinDist = int.MaxValue;
                    if (track.Names.Japanese != null)
                        trackMinDist = Math.Min(trackMinDist, StringUtils.GetLevenshteinDistance(prelimTitle, track.Names.Japanese));
                    if (track.Names.Romaji != null)
                        trackMinDist = Math.Min(trackMinDist, StringUtils.GetLevenshteinDistance(prelimTitle, track.Names.Romaji));
                    if (track.Names.English != null)
                        trackMinDist = Math.Min(trackMinDist, StringUtils.GetLevenshteinDistance(prelimTitle, track.Names.English));
                    if (trackMinDist < minDist)
                    {
                        minDist = trackMinDist;
                        aliases.Clear();
                        if (track.Names.Japanese != null)
                        {
                            title = track.Names.Japanese;
                            if (track.Names.English != null)
                                aliases.Add(track.Names.English);
                            if (track.Names.Romaji != null)
                                aliases.Add(track.Names.Romaji);
                        }
                        else if (track.Names.Romaji != null)
                        {
                            title = track.Names.Romaji;
                            if (track.Names.English != null)
                                aliases.Add(track.Names.English);
                        }
                        else if (track.Names.English != null)
                        {
                            title = track.Names.English;
                        }

                        if (minDist == 0)
                            return (title, aliases);
                    }
                }
            }

            return (title, aliases);
        }

        private class SearchResults
        {
            public IEnumerable<ArtistSearchResults> Artists { get; set; }
            public IEnumerable<AlbumInfoResult> Albums { get; set; }
        }

        private class ArtistSearchResults
        {
            public NamesResult Names { get; set; }
            public IEnumerable<string> Aliases { get; set; }
            public string Link { get; set; }
        }

        private class NamesResult
        {
            public string En { get; set; }
            public string Ja { get; set; }
            [JsonProperty("ja-latn")]
            public string Ja_Latn { get; set; }
        }

        private class TitlesResult
        {
            public string En { get; set; }
            public string Ja { get; set; }
        }

        private class ArtistResult
        {
            public string Name { get; set; }
            public string Name_Real { get; set; }
            public IEnumerable<ArtistShortResult> Aliases { get; set; }
            public string Link { get; set; }
            public IEnumerable<ArtistShortResult> Units { get; set; }
            public IEnumerable<AlbumInfoResult> Discography { get; set; }
            public ArtistInfoResult Info { get; set; }
        }

        private class ArtistShortResult
        {
            public string Link { get; set; }
            public NamesResult Names { get; set; }
        }

        private class AlbumInfoResult
        {
            public string Link { get; set; }
            public TitlesResult Titles { get; set; }
        }

        private class ArtistInfoResult
        {
            public IEnumerable<ArtistShortResult> Variations { get; set; }
        }

        public class ArtistInfo
        {
            public string Name { get; set; }
            public string[] Aliases { get; set; }
            public string VgmdbLink { get; set; }
        }

        private class AlbumResult
        {
            public NamesResult Names { get; set; }
            public string Link { get; set; }
            public IEnumerable<ArtistShortResult> Performers { get; set; }
            public IEnumerable<DiscResult> Discs { get; set; }
            public string Release_Date { get; set; }
        }

        private class DiscResult
        {
            public string Disc_Length { get; set; }
            public string Name { get; set; }
            public IEnumerable<TrackResult> Tracks { get; set; }
        }

        private class TrackResult
        {
            public string Track_Length { get; set; }
            public TrackNameResult Names { get; set; }
        }

        private class TrackNameResult
        {
            public string English { get; set; }
            public string Japanese { get; set; }
            public string Romaji { get; set; }
        }
    }
}
