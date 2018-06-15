using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using NodaTime;

namespace MusicScream.Models
{
    public class Playlist
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public ZonedDateTime CreationTime { get; set; }
        public ZonedDateTime LastModified { get; set; }
        public IEnumerable<SongPlaylistLink> SongPlaylistLinks { get; set; }
    }
}
