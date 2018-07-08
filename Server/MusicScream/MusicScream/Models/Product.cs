using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string[] Aliases { get; set; }
        public int Year { get; set; }
    }
}
