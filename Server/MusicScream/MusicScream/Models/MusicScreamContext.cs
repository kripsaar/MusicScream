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
        public DbSet<AlbumGenreLink> AlbumGenreLinks { get; set; }

        public DbSet<Product> Products { get; set; }
        public DbSet<ProductSongLink> ProductSongLinks { get; set; }
        public DbSet<ProductAlbumLink> ProductAlbumLinks { get; set; }

        public DbSet<Season> Seasons { get; set; }
        public DbSet<SeasonSongLink> SeasonSongLinks { get; set; }
        public DbSet<SeasonProductLink> SeasonProductLinks { get; set; }

        public DbSet<Genre> Genres { get; set; }
        public DbSet<SongGenreLink> SongGenreLinks { get; set; }

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
                .WithMany(s => s.PlaylistLinks)
                .HasForeignKey(spl => spl.SongId);

            modelBuilder.Entity<SongPlaylistLink>()
                .HasOne(spl => spl.Playlist)
                .WithMany(pl => pl.SongPlaylistLinks)
                .HasForeignKey(spl => spl.PlaylistId);

            modelBuilder.Entity<SongGenreLink>()
                .HasKey(_ => new {_.SongId, _.GenreId});

            modelBuilder.Entity<SongGenreLink>()
                .HasOne(_ => _.Song)
                .WithMany(_ => _.GenreLinks)
                .HasForeignKey(_ => _.SongId);

            modelBuilder.Entity<SongGenreLink>()
                .HasOne(_ => _.Genre)
                .WithMany(_ => _.SongLinks)
                .HasForeignKey(_ => _.GenreId);

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
                .WithMany(a => a.AlbumLinks)
                .HasForeignKey(aal => aal.ArtistId);

            modelBuilder.Entity<ArtistAlbumLink>()
                .HasOne(aal => aal.Album)
                .WithMany(a => a.ArtistLinks)
                .HasForeignKey(aal => aal.AlbumId);

            modelBuilder.Entity<ArtistSongLink>()
                .HasKey(aal => new { aal.ArtistId, aal.SongId });

            modelBuilder.Entity<ArtistSongLink>()
                .HasOne(asl => asl.Artist)
                .WithMany(a => a.SongLinks)
                .HasForeignKey(asl => asl.ArtistId);

            modelBuilder.Entity<ArtistSongLink>()
                .HasOne(asl => asl.Song)
                .WithMany(a => a.ArtistLinks)
                .HasForeignKey(asl => asl.SongId);

            modelBuilder.Entity<AlbumSongLink>()
                .HasKey(_ => new {_.AlbumId, _.SongId});

            modelBuilder.Entity<AlbumSongLink>()
                .HasOne(asl => asl.Album)
                .WithMany(al => al.SongLinks)
                .HasForeignKey(asl => asl.AlbumId);

            modelBuilder.Entity<AlbumSongLink>()
                .HasOne(asl => asl.Song)
                .WithMany(s => s.AlbumLinks)
                .HasForeignKey(asl => asl.SongId);

            modelBuilder.Entity<AlbumGenreLink>()
                .HasKey(_ => new {_.AlbumId, _.GenreId});

            modelBuilder.Entity<AlbumGenreLink>()
                .HasOne(_ => _.Album)
                .WithMany(_ => _.GenreLinks)
                .HasForeignKey(_ => _.AlbumId);

            modelBuilder.Entity<AlbumGenreLink>()
                .HasOne(_ => _.Genre)
                .WithMany(_ => _.AlbumLinks)
                .HasForeignKey(_ => _.GenreId);

            modelBuilder.Entity<ProductAlbumLink>()
                .HasKey(_ => new { _.ProductId, _.AlbumId });

            modelBuilder.Entity<ProductAlbumLink>()
                .HasOne(_ => _.Product)
                .WithMany(_ => _.AlbumLinks)
                .HasForeignKey(_ => _.ProductId);

            modelBuilder.Entity<ProductAlbumLink>()
                .HasOne(_ => _.Album)
                .WithMany(_ => _.ProductLinks)
                .HasForeignKey(_ => _.AlbumId);

            modelBuilder.Entity<ProductSongLink>()
                .HasKey(_ => new { _.ProductId, _.SongId });

            modelBuilder.Entity<ProductSongLink>()
                .HasOne(_ => _.Product)
                .WithMany(_ => _.SongLinks)
                .HasForeignKey(_ => _.ProductId);

            modelBuilder.Entity<ProductSongLink>()
                .HasOne(_ => _.Song)
                .WithMany(_ => _.ProductLinks)
                .HasForeignKey(_ => _.SongId);

            modelBuilder.Entity<SeasonProductLink>()
                .HasKey(_ => new { _.SeasonId, _.ProductId });

            modelBuilder.Entity<SeasonProductLink>()
                .HasOne(_ => _.Season)
                .WithMany(_ => _.ProductLinks)
                .HasForeignKey(_ => _.SeasonId);

            modelBuilder.Entity<SeasonProductLink>()
                .HasOne(_ => _.Product)
                .WithMany(_ => _.SeasonLinks)
                .HasForeignKey(_ => _.ProductId);

            modelBuilder.Entity<SeasonSongLink>()
                .HasKey(_ => new { _.SeasonId, _.SongId });

            modelBuilder.Entity<SeasonSongLink>()
                .HasOne(_ => _.Season)
                .WithMany(_ => _.SongLinks)
                .HasForeignKey(_ => _.SeasonId);

            modelBuilder.Entity<SeasonSongLink>()
                .HasOne(_ => _.Song)
                .WithMany(_ => _.SeasonLinks)
                .HasForeignKey(_ => _.SongId);
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
