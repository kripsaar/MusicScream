using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class ArtistSongLink
    {
        public int ArtistId { get; set; }
        public Artist Artist { get; set; }

        public int SongId { get; set; }
        public Song Song { get; set; }
    }
}
