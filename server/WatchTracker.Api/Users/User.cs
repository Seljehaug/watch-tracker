using Microsoft.AspNetCore.Identity;

namespace WatchTracker.Api.Users;

// A user who can log in. IdentityUser holds the email, the password hash and the lockout fields;
// the table keeps Identity's own name, AspNetUsers. The app's own fields about a user go here.
public class User : IdentityUser
{
}
