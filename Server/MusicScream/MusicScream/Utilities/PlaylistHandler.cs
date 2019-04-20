using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MusicScream.Models;

namespace MusicScream.Utilities
{
    public class PlaylistHandler
    {
        private readonly MusicScreamContext _dbContext;

        public PlaylistHandler(MusicScreamContext dbContext)
        {
            _dbContext = dbContext;
        }
    }
}
