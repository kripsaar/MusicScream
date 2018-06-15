using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class Song
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Artist { get; set; }
        public string Album { get; set; }
        public uint Year { get; set; }
        public string Genre { get; set; }
        public string Filename { get; set; }
        public IEnumerable<SongPlaylistLink> SongPlaylistLinks { get; set; }
    }
}
