using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WatchTracker.Api.Data;
using WatchTracker.Api.Shows;

namespace WatchTracker.Api.Tests.Shows;

public class ShowEndpointsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task GetShows_ReturnsTheShowsAsAngularsTrackedShow()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var client = await factory.CreateLoggedInClientAsync();

        // Added straight to the database, since no endpoint can add shows yet. The table is
        // emptied first: the class's tests share the database.
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WatchTrackerDbContext>();
        await db.Shows.ExecuteDeleteAsync(cancellationToken);
        var severance = new Show
        {
            Title = "Severance",
            Status = "watching",
            Service = "apple-tv-plus",
            LastWatchedSeason = 2,
            LastWatchedEpisode = 5,
            AddedAt = new DateTimeOffset(2026, 10, 1, 18, 0, 0, TimeSpan.Zero),
            UpdatedAt = new DateTimeOffset(2026, 11, 10, 21, 30, 0, TimeSpan.Zero),
        };
        var notStarted = new Show
        {
            Title = "The Pitt",
            Status = "want-to-watch",
            AddedAt = new DateTimeOffset(2026, 11, 5, 12, 0, 0, TimeSpan.Zero),
            UpdatedAt = new DateTimeOffset(2026, 11, 5, 12, 0, 0, TimeSpan.Zero),
        };
        db.Shows.AddRange(severance, notStarted);
        await db.SaveChangesAsync(cancellationToken);

        var json = await client.GetStringAsync("/api/shows", cancellationToken);

        // The JSON Angular expects: a number id, camelCase names, lastWatched as an object, and
        // no service or lastWatched at all when they are empty (not "service": null).
        // DeepEquals ignores the order of the properties, but not of the shows.
        var expected = JsonNode.Parse($$"""
            [
              {
                "id": {{severance.Id}},
                "title": "Severance",
                "status": "watching",
                "service": "apple-tv-plus",
                "lastWatched": { "season": 2, "episode": 5 },
                "addedAt": "2026-10-01T18:00:00+00:00",
                "updatedAt": "2026-11-10T21:30:00+00:00"
              },
              {
                "id": {{notStarted.Id}},
                "title": "The Pitt",
                "status": "want-to-watch",
                "addedAt": "2026-11-05T12:00:00+00:00",
                "updatedAt": "2026-11-05T12:00:00+00:00"
              }
            ]
            """);
        var actual = JsonNode.Parse(json);
        Assert.True(JsonNode.DeepEquals(expected, actual), $"Expected:\n{expected}\nbut got:\n{actual}");
    }
}
