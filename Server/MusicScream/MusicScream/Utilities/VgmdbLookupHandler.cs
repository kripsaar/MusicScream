using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MusicScream.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace MusicScream.Utilities
{
    public class VgmdbLookupHandler
    {
        private readonly HttpClient _httpClient;
        private readonly string _vgmdbApiBaseUrl = "https://vgmdb.info/";
        private readonly string _formatSpecifier = "?format=json";

        public VgmdbLookupHandler(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        private string GetSearchUrl(string query)
        {
            return _vgmdbApiBaseUrl + "search/" + query + _formatSpecifier;
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
                aliases.AddRange(StringUtils.GetStringsWithPermutations(artistResult.Info.Variations.Select(_ => _.Names.En)));
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

        private class SearchResults
        {
            public IEnumerable<ArtistSearchResults> Artists { get; set; }
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
            public IEnumerable<AliasResult> Aliases { get; set; }
            public string Link { get; set; }
            public IEnumerable<UnitResult> Units { get; set; }
            public IEnumerable<DiscographyResult> Discography { get; set; }
            public ArtistInfoResult Info { get; set; }
        }

        private class AliasResult
        {
            public string Link { get; set; }
            public NamesResult Names { get; set; }
        }

        private class UnitResult
        {
            public NamesResult Names { get; set; }
            public string Link { get; set; }
        }

        private class DiscographyResult
        {
            public string Link { get; set; }
            public TitlesResult Titles { get; set; }
            public string Date { get; set; }
        }

        private class ArtistInfoResult
        {
            public IEnumerable<AliasResult> Variations { get; set; }
        }

        public class ArtistInfo
        {
            public string Name { get; set; }
            public string[] Aliases { get; set; }
            public string VgmdbLink { get; set; }
        }
    }
}
