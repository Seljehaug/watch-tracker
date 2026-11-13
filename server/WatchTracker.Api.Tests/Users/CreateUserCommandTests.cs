using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using WatchTracker.Api.Users;

namespace WatchTracker.Api.Tests.Users;

// The create-user command is the only way to make a user (D70). These test the part it shares with
// the Development seed and ApiFactory – every login test shows that a user made with it can log in.
// The hidden prompt needs a terminal and was tried in one.
public class CreateUserCommandTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    // At least 15 characters (Program.cs). The command is where every password is chosen.
    [Fact]
    public async Task APasswordShorterThan15Characters_IsRefused()
    {
        var result = await CreateAsync(NewEmail(), "fourteen chars");

        var error = Assert.Single(result.Errors);
        Assert.Equal("PasswordTooShort", error.Code);
    }

    // One account per email, in any mix of upper and lower case. Login finds the user by email,
    // and two matches would make it fail for both.
    [Fact]
    public async Task AnEmailAlreadyInUse_IsRefused()
    {
        var email = NewEmail();
        Assert.True((await CreateAsync(email, ApiFactory.Password)).Succeeded);

        var again = await CreateAsync(email.ToUpperInvariant(), ApiFactory.Password);

        Assert.False(again.Succeeded);
        using var scope = factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        Assert.Single(userManager.Users, user => user.NormalizedEmail == email.ToUpperInvariant());
    }

    // Unique, since the tests in the class share the database.
    private static string NewEmail() => $"{Guid.NewGuid():N}@example.test";

    private async Task<IdentityResult> CreateAsync(string email, string password)
    {
        using var scope = factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        return await CreateUserCommand.CreateAsync(userManager, email, password);
    }
}
