using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MusicScream.Models
{
    public class Album
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string[] Aliases { get; set; }
        public DateTime ReleaseDate { get; set; }
        public IEnumerable<AlbumSongLink> AlbumSongLinks { get; set; }
        public IEnumerable<ArtistAlbumLink> ArtistAlbumLinks { get; set; }
        // TODO: Genre & Shows
    }
}
