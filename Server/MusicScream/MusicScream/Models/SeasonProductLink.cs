using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class SeasonProductLink
    {
        public int SeasonId { get; set; }
        public Season Season { get; set; }
        public int ProductId { get; set; }
        public Product Product { get; set; }
    }
}
