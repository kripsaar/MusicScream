using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class PlaylistElement
    {
        public int ParentPlaylistId { get; set; }
        public Playlist ParentPlaylist { get; set; }
        public int Position { get; set; }
        public int? PlaylistId { get; set; }
        public Playlist Playlist { get; set; }
        public int? SongId { get; set; }
        public Song Song { get; set; }
    }
}
