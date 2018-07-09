using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class ProductSongLink
    {
        public int ProductId { get; set; }
        public Product Product { get; set; }
        public int SongId { get; set; }
        public Song Song { get; set; }
    }
}
