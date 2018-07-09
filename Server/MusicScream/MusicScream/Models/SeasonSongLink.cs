using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class SeasonSongLink
    {
        public int SeasonId { get; set; }
        public Season Season { get; set; }
        public int SongId { get; set; }
        public Song Song { get; set; }
    }
}
