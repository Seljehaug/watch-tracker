using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using WatchTracker.Api.Users;

namespace WatchTracker.Api.Tests.Users;

// set-password is the way back in after a lost phone or a leaked password (B5, D96). These test
// SetAsync, the part after the prompt. The prompt needs a terminal and was tried in one.
public class SetPasswordCommandTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private const string NewPassword = "a brand new password for the test";
    private const string WrongPassword = "not the password at all";

    // Without it, a cookie on a lost phone keeps working for 60 days (D94).
    [Fact]
    public async Task ANewPassword_EndsTheLoginsMadeBeforeIt()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        // Identity checks a cookie against the user every 30 minutes. Here at every request, so
        // the test needn't wait.
        await using var app = factory.WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
            services.Configure<SecurityStampValidatorOptions>(options => options.ValidationInterval = TimeSpan.Zero)));
        var user = await factory.CreateUserAsync();
        var client = app.CreateClient();
        (await LogInAsync(client, user.Email!, ApiFactory.Password)).EnsureSuccessStatusCode();
        // The cookie works while the password is unchanged, even with the check at every request.
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/auth/user", cancellationToken)).StatusCode);

        Assert.True((await SetPasswordAsync(user.Email!, NewPassword)).Succeeded);

        var currentUser = await client.GetAsync("/api/auth/user", cancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, currentUser.StatusCode);
    }

    // The rules are checked before anything changes: a refused password must leave the old one in
    // place, not a user with no password at all.
    [Fact]
    public async Task APasswordShorterThan15Characters_IsRefused_AndTheOldOneStillWorks()
    {
        var user = await factory.CreateUserAsync();

        var result = await SetPasswordAsync(user.Email!, "fourteen chars");

        var error = Assert.Single(result.Errors);
        Assert.Equal("PasswordTooShort", error.Code);
        var login = await LogInAsync(factory.CreateClient(), user.Email!, ApiFactory.Password);
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }

    // When guessing has locked the account, the new password works at once, not after the five
    // minutes – or anyone who knows the email could keep me out (D94).
    [Fact]
    public async Task ANewPassword_LiftsALockout()
    {
        var user = await factory.CreateUserAsync();
        var client = factory.CreateClient();
        for (var attempt = 1; attempt <= 5; attempt++)
        {
            await LogInAsync(client, user.Email!, WrongPassword);
        }
        Assert.True(await IsLockedOutAsync(user.Email!));

        Assert.True((await SetPasswordAsync(user.Email!, NewPassword)).Succeeded);

        var login = await LogInAsync(client, user.Email!, NewPassword);
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
    }

    // As the command does it: find the user, then set the password. A fresh lookup, since the
    // logins above may have changed the user since it was made.
    private async Task<IdentityResult> SetPasswordAsync(string email, string password)
    {
        using var scope = factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var user = await userManager.FindByEmailAsync(email);
        return await SetPasswordCommand.SetAsync(userManager, user!, password);
    }

    private async Task<bool> IsLockedOutAsync(string email)
    {
        using var scope = factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var user = await userManager.FindByEmailAsync(email);
        return await userManager.IsLockedOutAsync(user!);
    }

    private static Task<HttpResponseMessage> LogInAsync(HttpClient client, string email, string password) =>
        client.PostAsJsonAsync("/api/auth/login", new { email, password }, TestContext.Current.CancellationToken);
}
