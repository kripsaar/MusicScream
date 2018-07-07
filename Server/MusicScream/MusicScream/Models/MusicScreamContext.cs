using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace MusicScream.Models
{
    public class MusicScreamContext : DbContext
    {
        public DbSet<Song> Songs { get; set; }

        public DbSet<Artist> Artists { get; set; }
        public DbSet<ArtistUnitLink> ArtistUnitLinks { get; set; }
        public DbSet<ArtistAlbumLink> ArtistAlbumLinks { get; set; }
        public DbSet<ArtistSongLink> ArtistSongLinks { get; set; }

        public DbSet<Playlist> Playlists { get; set; }
        public DbSet<SongPlaylistLink> SongPlaylistLinks { get; set; }

        public DbSet<Album> Albums { get; set; }
        public DbSet<AlbumSongLink> AlbumSongLinks { get; set; }

        public MusicScreamContext(DbContextOptions<MusicScreamContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            SetSchemaForAllDbSets(modelBuilder);

            modelBuilder.Entity<SongPlaylistLink>()
                .HasKey(_ => new {_.SongId, _.PlaylistId});

            modelBuilder.Entity<SongPlaylistLink>()
                .HasOne(spl => spl.Song)
                .WithMany(s => s.SongPlaylistLinks)
                .HasForeignKey(spl => spl.SongId);

            modelBuilder.Entity<SongPlaylistLink>()
                .HasOne(spl => spl.Playlist)
                .WithMany(pl => pl.SongPlaylistLinks)
                .HasForeignKey(spl => spl.PlaylistId);

            modelBuilder.Entity<ArtistUnitLink>()
                .HasKey(_ => new { _.ArtistId, _.UnitId });

            modelBuilder.Entity<ArtistUnitLink>()
                .HasOne(aul => aul.Artist)
                .WithMany(a => a.ArtistUnitLinks)
                .HasForeignKey(aul => aul.ArtistId);

            modelBuilder.Entity<ArtistUnitLink>()
                .HasOne(aul => aul.Unit)
                .WithMany(u => u.UnitArtistLinks)
                .HasForeignKey(aul => aul.UnitId);

            modelBuilder.Entity<ArtistAlbumLink>()
                .HasKey(aal => new {aal.ArtistId, aal.AlbumId});

            modelBuilder.Entity<ArtistAlbumLink>()
                .HasOne(aal => aal.Artist)
                .WithMany(a => a.ArtistAlbumLinks)
                .HasForeignKey(aal => aal.ArtistId);

            modelBuilder.Entity<ArtistAlbumLink>()
                .HasOne(aal => aal.Album)
                .WithMany(a => a.ArtistAlbumLinks)
                .HasForeignKey(aal => aal.AlbumId);

            modelBuilder.Entity<ArtistSongLink>()
                .HasKey(aal => new { aal.ArtistId, aal.SongId });

            modelBuilder.Entity<ArtistSongLink>()
                .HasOne(asl => asl.Artist)
                .WithMany(a => a.ArtistSongLinks)
                .HasForeignKey(asl => asl.ArtistId);

            modelBuilder.Entity<ArtistSongLink>()
                .HasOne(asl => asl.Song)
                .WithMany(a => a.ArtistSongLinks)
                .HasForeignKey(asl => asl.SongId);

            modelBuilder.Entity<AlbumSongLink>()
                .HasKey(_ => new {_.AlbumId, _.SongId});

            modelBuilder.Entity<AlbumSongLink>()
                .HasOne(asl => asl.Album)
                .WithMany(al => al.AlbumSongLinks)
                .HasForeignKey(asl => asl.AlbumId);

            modelBuilder.Entity<AlbumSongLink>()
                .HasOne(asl => asl.Song)
                .WithMany(s => s.AlbumSongLinks)
                .HasForeignKey(asl => asl.SongId);
        }

        private void SetSchemaForAllDbSets(ModelBuilder modelBuilder)
        {
            var dbSetProperties = GetType().GetProperties().Where(_ =>
                _.PropertyType.IsGenericType && _.DeclaringType == GetType() &&
                _.PropertyType.GetGenericTypeDefinition() == typeof(DbSet<>));

            foreach (var dbSetProperty in dbSetProperties)
            {
                var modelType = dbSetProperty.PropertyType.GetGenericArguments()[0];
                modelBuilder.Entity(modelType).ToTable(dbSetProperty.Name, Startup.MusicScreamDataSchemaName);
            }
        }
    }
}
