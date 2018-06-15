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
        public DbSet<Playlist> Playlists { get; set; }
        public DbSet<SongPlaylistLink> SongPlaylistLinks { get; set; }

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
