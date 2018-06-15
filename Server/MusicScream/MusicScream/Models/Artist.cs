using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class Artist
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string[] Aliases { get; set; }
        public ArtistAlbumLink[] ArtistAlbumLinks { get; set; }
        public ArtistUnitLink[] ArtistUnitLinks { get; set; }
        public ArtistSongLink[] ArtistSongLinks { get; set; }
        public string VgmdbLink { get; set; }
    }
}
