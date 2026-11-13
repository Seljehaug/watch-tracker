using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;
using WatchTracker.Api.Users;

namespace WatchTracker.Api.Tests;

// Runs the API in memory against its own Postgres in a Docker container, never the development
// database. Each test class that uses it (IClassFixture<ApiFactory>) gets one container, shared
// by its tests.
public class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    // The password of every test user: a test value, at least 15 characters.
    public const string Password = "correct horse battery staple";

    // The same Postgres version as Compose and Neon.
    public PostgreSqlContainer Postgres { get; } = new PostgreSqlBuilder("postgres:18").Build();

    public ApiFactory()
    {
        // https, because the login cookie is Secure and is only sent back over https.
        ClientOptions.BaseAddress = new Uri("https://localhost");
        // Don't follow redirects, so a test sees the redirect itself.
        ClientOptions.AllowAutoRedirect = false;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Not Development, which would seed the development shows into the tests' data.
        builder.UseEnvironment("Testing");

        // Program.cs reads the connection string before builder.Build(). UseSetting arrives in
        // time; ConfigureAppConfiguration would come too late.
        builder.UseSetting("ConnectionStrings:Default", Postgres.GetConnectionString());
    }

    // Starts the container before the app starts and migrates it.
    public async ValueTask InitializeAsync() => await Postgres.StartAsync();

    // Stops the app first, then removes the container.
    public override async ValueTask DisposeAsync()
    {
        await base.DisposeAsync();
        await Postgres.DisposeAsync();
    }

    // A new user with a unique email, made the same way as with the create-user command. The tests
    // in a class share the database, so each test makes its own user, and can't lock out or log out
    // another test's user.
    public async Task<User> CreateUserAsync()
    {
        using var scope = Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var email = $"{Guid.NewGuid():N}@example.test";
        var result = await CreateUserCommand.CreateAsync(userManager, email, Password);
        Assert.True(result.Succeeded, string.Join(" ", result.Errors.Select(error => error.Description)));
        return (await userManager.FindByEmailAsync(email))!;
    }

    // A client logged in as a new user through the login endpoint. It sends the cookie with every
    // request after that, like a browser.
    public async Task<HttpClient> CreateLoggedInClientAsync()
    {
        var user = await CreateUserAsync();
        var client = CreateClient();
        var response = await client.PostAsJsonAsync(
            "/api/auth/login", new { email = user.Email, password = Password }, TestContext.Current.CancellationToken);
        response.EnsureSuccessStatusCode();
        return client;
    }
}
