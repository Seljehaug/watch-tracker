using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using WatchTracker.Api.Users;

namespace WatchTracker.Api.Auth;

// Login, logout and the logged-in user (D70). No registration: users are created with the
// create-user command.
public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/api/auth");

        // Open to everyone. Every failure gets the same 401, so the answer never reveals whether
        // an account exists.
        auth.MapPost("/login", async Task<Results<Ok<UserModel>, UnauthorizedHttpResult>> (
            LoginPostModel login, UserManager<User> userManager, SignInManager<User> signInManager) =>
        {
            // A field missing from the JSON arrives as null.
            if (string.IsNullOrEmpty(login.Email) || string.IsNullOrEmpty(login.Password))
            {
                return TypedResults.Unauthorized();
            }

            var user = await userManager.FindByEmailAsync(login.Email);
            if (user is null)
            {
                return TypedResults.Unauthorized();
            }

            // isPersistent: keep the cookie when the browser closes.
            // lockoutOnFailure: count wrong passwords towards the lockout.
            var result = await signInManager.PasswordSignInAsync(user, login.Password, isPersistent: true, lockoutOnFailure: true);
            if (!result.Succeeded)
            {
                return TypedResults.Unauthorized();
            }

            return TypedResults.Ok(UserModel.MapFrom(user));
        }).AllowAnonymous();

        // Deletes the cookie in this browser. A copy of the cookie keeps working until it
        // expires or the password is changed.
        auth.MapPost("/logout", async Task<NoContent> (SignInManager<User> signInManager) =>
        {
            await signInManager.SignOutAsync();
            return TypedResults.NoContent();
        });

        // The logged-in user. Angular asks at start-up, to know whether to show the login page.
        auth.MapGet("/user", async Task<Results<Ok<UserModel>, UnauthorizedHttpResult>> (
            ClaimsPrincipal principal, UserManager<User> userManager) =>
        {
            // Null if the user has been deleted since logging in.
            var user = await userManager.GetUserAsync(principal);
            if (user is null)
            {
                return TypedResults.Unauthorized();
            }

            return TypedResults.Ok(UserModel.MapFrom(user));
        });
    }
}
