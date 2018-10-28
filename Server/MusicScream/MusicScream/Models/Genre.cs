using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class Genre
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public IEnumerable<SongGenreLink> SongLinks { get; set; }
        public IEnumerable<AlbumGenreLink> AlbumLinks { get; set; }
    }

    public class GenreInfo
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }
}
