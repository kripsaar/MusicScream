using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class AlbumSongLink
    {
        public int AlbumId { get; set; }
        public Album Album { get; set; }

        public int SongId { get; set; }
        public Song Song { get; set; }
    }
}
