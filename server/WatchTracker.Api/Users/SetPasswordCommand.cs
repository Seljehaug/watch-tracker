using Microsoft.AspNetCore.Identity;

namespace WatchTracker.Api.Users;

// The set-password command (B5, D96): the way back in after a lost phone or a leaked password.
// Like create-user, run from a terminal on the server – in production through `fly ssh console`:
//   dotnet WatchTracker.Api.dll set-password <email>
public static class SetPasswordCommand
{
    // Returns the exit code: 0 when the password was changed, 1 otherwise.
    public static async Task<int> RunAsync(IServiceProvider services, string[] args)
    {
        if (args is not ["set-password", var email])
        {
            Console.Error.WriteLine("Usage: dotnet WatchTracker.Api.dll set-password <email>");
            return 1;
        }

        using var scope = services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

        // Before the prompt, so a mistyped email is caught before the password is typed twice.
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            Console.Error.WriteLine($"There is no user with the email {email}.");
            return 1;
        }

        var password = PasswordPrompt.ReadNewPassword();
        if (password is null)
        {
            Console.Error.WriteLine("The password was not changed.");
            return 1;
        }

        var result = await SetAsync(userManager, user, password);
        if (!result.Succeeded)
        {
            // Identity's own messages, such as a password that is too short.
            foreach (var error in result.Errors)
            {
                Console.Error.WriteLine(error.Description);
            }
            Console.Error.WriteLine("The password was not changed.");
            return 1;
        }

        Console.WriteLine($"Set a new password for {email}. Every login made before it ends within 30 minutes.");
        return 0;
    }

    // Gives the user a new password and saves it all in one UPDATE, so either everything below
    // changes or nothing does. Not UserManager's own methods: ResetPasswordAsync needs a reset
    // token, which needs token providers this app doesn't register, and RemovePasswordAsync
    // followed by AddPasswordAsync saves twice – a refused password would leave the user with none.
    public static async Task<IdentityResult> SetAsync(UserManager<User> userManager, User user, string password)
    {
        // Identity's password rules (Program.cs) first, so a password that breaks them changes
        // nothing.
        var errors = new List<IdentityError>();
        foreach (var validator in userManager.PasswordValidators)
        {
            var result = await validator.ValidateAsync(userManager, user, password);
            errors.AddRange(result.Errors);
        }
        if (errors.Count > 0)
        {
            return IdentityResult.Failed([.. errors]);
        }

        user.PasswordHash = userManager.PasswordHasher.HashPassword(user, password);

        // Lift a lockout and forget earlier wrong passwords, so the new password works at once,
        // even when guessing has just locked the account (D94).
        user.LockoutEnd = null;
        user.AccessFailedCount = 0;

        // A new security stamp, then the save. Identity compares a cookie's stamp with the user's
        // every 30 minutes and logs the cookie out when they differ, so every login made before
        // this ends – a lost phone's too.
        return await userManager.UpdateSecurityStampAsync(user);
    }
}
