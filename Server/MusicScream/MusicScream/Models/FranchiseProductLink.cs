using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class FranchiseProductLink
    {
        public int FranchiseId { get; set; }
        public Product Franchise { get; set; }
        public int ProductId { get; set; }
        public Product Product { get; set; }
    }
}
