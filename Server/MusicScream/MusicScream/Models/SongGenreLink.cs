using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class SongGenreLink
    {
        public int SongId { get; set; }
        public Song Song { get; set; }
        public int GenreId { get; set; }
        public Genre Genre { get; set; }
    }
}
