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
        public string Name { get; set; }
        public ZonedDateTime CreationTime { get; set; }
        public ZonedDateTime LastModified { get; set; }
        public List<PlaylistElement> PlaylistElements { get; set; }

        public Playlist()
        {
            PlaylistElements = new List<PlaylistElement>();
        }
    }

    public class PlaylistInfo
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }
}
