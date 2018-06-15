using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class ArtistUnitLink
    {
        public int ArtistId { get; set; }
        public Artist Artist { get; set; }

        public int UnitId { get; set; }
        public Artist Unit { get; set; }
    }
}
