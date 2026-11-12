using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Testcontainers.PostgreSql;

namespace WatchTracker.Api.Tests;

// The API in memory – WebApplicationFactory runs Program.cs with a test server instead of a real
// port – against its own Postgres in a Docker container, never Compose's development database
// (D76). A test class that takes it as a fixture (IClassFixture<ApiFactory>) gets one container
// for all its tests; test classes run in parallel, each with its own container.
public class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    // The same major version as Compose and Neon.
    public PostgreSqlContainer Postgres { get; } = new PostgreSqlBuilder("postgres:18").Build();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Not Development, the factory's default: Development seeds DevelopmentSeed's 10 shows,
        // which would mix with each test's own data.
        builder.UseEnvironment("Testing");

        // Program.cs reads the connection string before builder.Build(). UseSetting reaches it in
        // time – the factory hands these settings to Program as command-line arguments – while
        // ConfigureAppConfiguration is only applied at Build(), too late for that line.
        builder.UseSetting("ConnectionStrings:Default", Postgres.GetConnectionString());
    }

    // xUnit runs this before the class's first test, so the container is up before the factory
    // starts the app, and Program's Database.Migrate() creates the tables in it.
    public async ValueTask InitializeAsync() => await Postgres.StartAsync();

    // After the class's last test: stop the app first, then remove the container.
    public override async ValueTask DisposeAsync()
    {
        await base.DisposeAsync();
        await Postgres.DisposeAsync();
    }
}
