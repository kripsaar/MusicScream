using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MusicScream.Models;
using MusicScream.Utilities;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace MusicScream.Services
{
    public interface IAuthService
    {
        User Authenticate(string username, string password);
        IEnumerable<User> GetAllUsers();
    }

    public class AuthService : IAuthService
    {
        private List<User> _users = new List<User>()
        {
            new User { Id = 1, Password = "test", Username = "test", Permissions = new List<string>{ UserPermissions.BasicServiceRights } }
        };

        private readonly AuthSettings _authSettings;

        public AuthService(IOptions<AuthSettings> authSettings)
        {
            _authSettings = authSettings.Value;
        }

        public User Authenticate(string username, string password)
        {
            var user = _users.SingleOrDefault(u => u.Username == username && u.Password == password);

            if (user == null)
                return null;

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_authSettings.Secret);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new Claim[]
                {
                    new Claim(ClaimTypes.Name, user.Id.ToString())
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            user.Token = tokenHandler.WriteToken(token);

            user.Password = null;

            return user;
        }

        public IEnumerable<User> GetAllUsers()
        {
            return _users.Select(user =>
            {
                user.Password = null;
                return user;
            });
        }
    }
}
