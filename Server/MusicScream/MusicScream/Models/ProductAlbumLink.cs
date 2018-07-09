using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class ProductAlbumLink
    {
        public int ProductId { get; set; }
        public Product Product { get; set; }
        public int AlbumId { get; set; }
        public Album Album { get; set; }
    }
}
