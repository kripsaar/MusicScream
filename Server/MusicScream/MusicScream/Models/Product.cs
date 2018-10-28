using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class Product
    {
        public const string Animation = "Animation";
        public const string Game = "Game";
        public const string Franchise = "Franchise";
        public const string Other = "Other";

        public int Id { get; set; }
        public string Title { get; set; }
        public string[] Aliases { get; set; }
        public int Year { get; set; }
        public string Type { get; set; }
        public string VgmdbLink { get; set; }

        public IEnumerable<ProductSongLink> SongLinks { get; set; }
        public IEnumerable<ProductAlbumLink> AlbumLinks { get; set; }
        public IEnumerable<SeasonProductLink> SeasonLinks { get; set; }
        public IEnumerable<FranchiseProductLink> FranchiseLinks { get; set; }
        public IEnumerable<FranchiseProductLink> SubProductLinks { get; set; }
    }

    public class ProductInfo
    {
        public int Id { get; set; }
        public string Title { get; set; }
    }
}
