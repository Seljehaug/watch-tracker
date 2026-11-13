using System.Net;
using Microsoft.Extensions.DependencyInjection;
using WatchTracker.Api.Data;

namespace WatchTracker.Api.Tests;

public class HealthCheckTests
{
    // /healthz must answer without the database: when it fails, Fly stops sending traffic to
    // the app (D75). It must also be open without a login.
    [Fact]
    public async Task Healthz_AnswersWhileTheDatabaseIsDown()
    {
        var cancellationToken = TestContext.Current.CancellationToken;

        // Its own container rather than the class's, since the test stops it.
        await using var factory = new ApiFactory();
        await factory.InitializeAsync();
        // Starts the app while the database is still up.
        var client = factory.CreateClient();

        await factory.Postgres.StopAsync(cancellationToken);

        // Make sure the database really is gone, or the test proves nothing.
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WatchTrackerDbContext>();
        Assert.False(await db.Database.CanConnectAsync(cancellationToken));

        var response = await client.GetAsync("/healthz", cancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync(cancellationToken));
    }
}
