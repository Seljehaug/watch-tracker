using System.Net;
using Microsoft.Extensions.DependencyInjection;
using WatchTracker.Api.Data;

namespace WatchTracker.Api.Tests;

public class HealthCheckTests
{
    // Guards D75 and D87: Fly stops sending traffic to a machine whose check fails, so a
    // database check on /healthz would turn a sleeping Neon into a 503 for the whole app.
    [Fact]
    public async Task Healthz_AnswersWhileTheDatabaseIsDown()
    {
        var cancellationToken = TestContext.Current.CancellationToken;

        // Its own factory and container rather than a class fixture: the test stops the
        // database, which would leave a shared one gone for the next test.
        await using var factory = new ApiFactory();
        await factory.InitializeAsync();
        // Starts the app, which migrates the database while it is still up.
        var client = factory.CreateClient();

        await factory.Postgres.StopAsync(cancellationToken);

        // The app really has lost its database – otherwise the test would prove nothing.
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WatchTrackerDbContext>();
        Assert.False(await db.Database.CanConnectAsync(cancellationToken));

        var response = await client.GetAsync("/healthz", cancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync(cancellationToken));
    }
}
