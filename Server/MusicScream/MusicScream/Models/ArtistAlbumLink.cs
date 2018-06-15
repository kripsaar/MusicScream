using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class ArtistAlbumLink
    {
        public int ArtistId { get; set; }
        public Artist Artist { get; set; }

        public int AlbumId { get; set; }
        public Album Album { get; set; }
    }
}
