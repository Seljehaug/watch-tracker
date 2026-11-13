using Microsoft.AspNetCore.Identity;

namespace WatchTracker.Api.Users;

// A user who can log in. IdentityUser has the email, password hash and lockout fields, in
// Identity's table AspNetUsers. The app's own fields go here.
public class User : IdentityUser
{
}
