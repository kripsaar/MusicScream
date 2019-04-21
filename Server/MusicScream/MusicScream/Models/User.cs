using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;

namespace MusicScream.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public IEnumerable<string> Permissions { get; set; }
        public string Token { get; set; }
    }

    public class UserPermissions
    {
        public const string BasicServiceRights = "BasicServiceRights";
        public const string WritePlaylists = "WritePlaylists";
        public const string WriteAllPlaylists = "WriteAllPlaylists";
        public const string ReadUsers = "ReadUsers";
        public const string WriteUsers = "WriteUsers";
    }
}
