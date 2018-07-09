using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class Season
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int Year { get; set; }

        public IEnumerable<SeasonSongLink> SongLinks { get; set; }
        public IEnumerable<SeasonProductLink> ProductLinks { get; set; }
    }
}
