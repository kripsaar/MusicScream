using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MusicScream.Models;
using MusicScream.Services;
using Newtonsoft.Json.Linq;

namespace MusicScream.Controllers
{
    [Authorize]
    public class AccountController : Controller
    {
        private IAuthService _authService;

        public AccountController(
            IAuthService authService
        )
        {
            _authService = authService;
        }

        private JsonResult UserToJson(User user)
        {
            return Json(JObject.FromObject(new
            {
                userTO = new
                {
                    user.Id,
                    user.Username,
                    user.Password,
                    user.Permissions,
                    user.Token
                }
            }));
        }

        [AllowAnonymous]
        [HttpPost]
        public IActionResult Login([FromBody]User userParam)
        {
            var user = _authService.Authenticate(userParam.Username, userParam.Password);

            if (user == null)
                return BadRequest(new { message = "Username or password is incorrect!" });

            return UserToJson(user);
        }

        [HttpGet]
        public IActionResult GetAllUsers()
        {
            var users = _authService.GetAllUsers();
            return Ok(users);
        }
    }
}