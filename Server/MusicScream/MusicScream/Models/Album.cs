﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using NodaTime;

namespace MusicScream.Models
{
    public class Album
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string[] Aliases { get; set; }
        public LocalDate ReleaseDate { get; set; }
        public string VgmdbLink { get; set; }
        public IEnumerable<AlbumSongLink> AlbumSongLinks { get; set; }
        public IEnumerable<ArtistAlbumLink> ArtistAlbumLinks { get; set; }
        // TODO: Genre & Shows
    }
}
