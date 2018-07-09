using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class AlbumGenreLink
    {
        public int AlbumId { get; set; }
        public Album Album { get; set; }
        public int GenreId { get; set; }
        public Genre Genre { get; set; }
    }
}
