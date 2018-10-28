using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class Song
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string[] Aliases { get; set; }
        public uint Year { get; set; }
        public string Filename { get; set; }

        public IEnumerable<ArtistSongLink> ArtistLinks { get; set; }
        public IEnumerable<AlbumSongLink> AlbumLinks { get; set; }
        public IEnumerable<SongGenreLink> GenreLinks { get; set; }
        public IEnumerable<ProductSongLink> ProductLinks { get; set; }
        public IEnumerable<SeasonSongLink> SeasonLinks { get; set; }
    }

    public class SongInfo
    {
        public int Id { get; set; }
        public string Title { get; set; }
    }
}
