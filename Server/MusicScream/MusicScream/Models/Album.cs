using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using NodaTime;

namespace MusicScream.Models
{
    public class Album
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string[] Aliases { get; set; }
        public Instant ReleaseDate { get; set; }
        public string VgmdbLink { get; set; }

        public IEnumerable<AlbumSongLink> SongLinks { get; set; }
        public IEnumerable<ArtistAlbumLink> ArtistLinks { get; set; }
        public IEnumerable<AlbumGenreLink> GenreLinks { get; set; }
        public IEnumerable<ProductAlbumLink> ProductLinks { get; set; }
    }

    public class AlbumInfo
    {
        public int Id { get; set; }
        public string Title { get; set; }
    }
}
