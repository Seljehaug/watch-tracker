using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Net.Http.Headers;
using WatchTracker.Api.Data;
using WatchTracker.Api.Users;

namespace WatchTracker.Api.Tests.Auth;

public class AuthEndpointsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private const string CookieName = "__Host-watchtracker";
    private const string WrongPassword = "not the password at all";

    [Fact]
    public async Task Login_ReturnsTheUser_AndGetUserReturnsThemAfterwards()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        // Another user first, so the endpoint can't pass by returning the first user in the table.
        await factory.CreateUserAsync();
        var user = await factory.CreateUserAsync();
        var client = factory.CreateClient();

        var login = await LogInAsync(client, user.Email!, ApiFactory.Password);

        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        // Only the email, nothing else about the user.
        var expected = $$"""{ "email": "{{user.Email}}" }""";
        AssertJsonEquals(expected, await login.Content.ReadAsStringAsync(cancellationToken));

        // The client sends the cookie back, like a browser.
        var currentUser = await client.GetAsync("/api/auth/user", cancellationToken);

        Assert.Equal(HttpStatusCode.OK, currentUser.StatusCode);
        AssertJsonEquals(expected, await currentUser.Content.ReadAsStringAsync(cancellationToken));
    }

    // These settings are what keep the login safe, and a change to them wouldn't show anywhere
    // else.
    [Fact]
    public async Task Login_SetsAnHttpOnlySecureStrictHostCookieForSixtyDays()
    {
        var user = await factory.CreateUserAsync();
        var client = factory.CreateClient();

        var login = await LogInAsync(client, user.Email!, ApiFactory.Password);

        var cookie = Assert.Single(
            SetCookieHeaderValue.ParseList(login.Headers.GetValues(HeaderNames.SetCookie).ToList()),
            cookie => cookie.Name == CookieName);
        Assert.True(cookie.HttpOnly);
        Assert.True(cookie.Secure);
        Assert.Equal(SameSiteMode.Strict, cookie.SameSite);
        // Required by the __Host- prefix, or the browser rejects the cookie.
        Assert.Equal("/", cookie.Path.Value);
        Assert.False(cookie.Domain.HasValue);
        // An expiry date keeps the cookie when the browser closes.
        Assert.NotNull(cookie.Expires);
        var inSixtyDays = DateTimeOffset.UtcNow.AddDays(60);
        Assert.InRange(cookie.Expires.Value, inSixtyDays.AddMinutes(-1), inSixtyDays.AddMinutes(1));
    }

    // The same 401 for both, so the answer doesn't tell whether an account exists.
    [Fact]
    public async Task Login_WithAWrongPasswordOrAnUnknownEmail_Is401WithoutACookie()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var user = await factory.CreateUserAsync();
        var client = factory.CreateClient();

        var wrongPassword = await LogInAsync(client, user.Email!, WrongPassword);
        var unknownEmail = await LogInAsync(client, "nobody@example.test", ApiFactory.Password);

        foreach (var response in new[] { wrongPassword, unknownEmail })
        {
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            Assert.False(response.Headers.Contains(HeaderNames.SetCookie));
            Assert.Empty(await response.Content.ReadAsStringAsync(cancellationToken));
        }
    }

    // Without lockoutOnFailure in the login, wrong passwords aren't counted and anyone can keep
    // guessing (D80).
    [Fact]
    public async Task Login_LocksTheAccountAfterFiveWrongPasswords()
    {
        var user = await factory.CreateUserAsync();
        var client = factory.CreateClient();

        for (var attempt = 1; attempt <= 5; attempt++)
        {
            var wrong = await LogInAsync(client, user.Email!, WrongPassword);
            Assert.Equal(HttpStatusCode.Unauthorized, wrong.StatusCode);
        }

        // Now the right password is turned away too, with the same 401 as a wrong one.
        var right = await LogInAsync(client, user.Email!, ApiFactory.Password);

        Assert.Equal(HttpStatusCode.Unauthorized, right.StatusCode);
        Assert.False(right.Headers.Contains(HeaderNames.SetCookie));
        // Because the account is locked.
        using var scope = factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var stored = await userManager.FindByIdAsync(user.Id);
        Assert.True(await userManager.IsLockedOutAsync(stored!));
    }

    // A 401, not a redirect to a login page.
    [Fact]
    public async Task GetUser_WithoutALogin_Is401()
    {
        var response = await factory.CreateClient().GetAsync("/api/auth/user", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Null(response.Headers.Location);
    }

    [Fact]
    public async Task Logout_EndsTheSession()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var client = await factory.CreateLoggedInClientAsync();

        var logout = await client.PostAsync("/api/auth/logout", null, cancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);
        var currentUser = await client.GetAsync("/api/auth/user", cancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, currentUser.StatusCode);
    }

    // A deploy starts a new instance of the app. The cookie must still work there, or every
    // deploy logs everyone out.
    [Fact]
    public async Task ACookie_StillWorksInANewInstanceOfTheApp()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var user = await factory.CreateUserAsync();
        // Cookies by hand, to carry this one over to the new instance.
        var withoutCookies = new WebApplicationFactoryClientOptions
        {
            BaseAddress = factory.ClientOptions.BaseAddress,
            AllowAutoRedirect = false,
            HandleCookies = false,
        };
        var login = await LogInAsync(factory.CreateClient(withoutCookies), user.Email!, ApiFactory.Password);
        var cookie = SetCookieHeaderValue.ParseList(login.Headers.GetValues(HeaderNames.SetCookie).ToList())
            .Single(cookie => cookie.Name == CookieName);

        // The keys are in the database. Checked directly: on one machine, both instances would
        // share the default key folder, and the rest of the test would pass anyway.
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<WatchTrackerDbContext>();
            Assert.NotEmpty(await db.DataProtectionKeys.ToListAsync(cancellationToken));
        }

        // A new instance of the app against the same database, as after a deploy.
        await using var redeployed = factory.WithWebHostBuilder(_ => { });
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/user");
        request.Headers.Add(HeaderNames.Cookie, $"{cookie.Name}={cookie.Value}");
        var currentUser = await redeployed.CreateClient(withoutCookies).SendAsync(request, cancellationToken);

        Assert.Equal(HttpStatusCode.OK, currentUser.StatusCode);
    }

    private static Task<HttpResponseMessage> LogInAsync(HttpClient client, string email, string password) =>
        client.PostAsJsonAsync("/api/auth/login", new { email, password }, TestContext.Current.CancellationToken);

    private static void AssertJsonEquals(string expected, string actual)
    {
        var expectedJson = JsonNode.Parse(expected);
        var actualJson = JsonNode.Parse(actual);
        Assert.True(JsonNode.DeepEquals(expectedJson, actualJson), $"Expected:\n{expectedJson}\nbut got:\n{actualJson}");
    }
}
