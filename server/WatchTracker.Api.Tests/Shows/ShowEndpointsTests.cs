using System.Text.Json.Nodes;
using Microsoft.Extensions.DependencyInjection;
using WatchTracker.Api.Data;
using WatchTracker.Api.Shows;
using WatchTracker.Api.Users;

namespace WatchTracker.Api.Tests.Shows;

// Each test makes its own users, and a user only ever sees their own shows, so the tests in the
// class share the database without emptying the table.
public class ShowEndpointsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task GetShows_ReturnsTheShowsAsAngularsTrackedShow()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var user = await factory.CreateUserAsync();
        var client = await factory.CreateLoggedInClientAsync(user);
        var severance = new Show
        {
            UserId = user.Id,
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
            UserId = user.Id,
            Title = "The Pitt",
            Status = "want-to-watch",
            AddedAt = new DateTimeOffset(2026, 11, 5, 12, 0, 0, TimeSpan.Zero),
            UpdatedAt = new DateTimeOffset(2026, 11, 5, 12, 0, 0, TimeSpan.Zero),
        };
        await AddShowsAsync(severance, notStarted);

        var json = await client.GetStringAsync("/api/shows", cancellationToken);

        // The JSON Angular expects: a number id, camelCase names, lastWatched as an object, and
        // no service or lastWatched at all when they are empty (not "service": null). No userId:
        // Angular has no use for it. The newest show first, by id. DeepEquals ignores the order
        // of the properties, but not of the shows.
        var expected = JsonNode.Parse($$"""
            [
              {
                "id": {{notStarted.Id}},
                "title": "The Pitt",
                "status": "want-to-watch",
                "addedAt": "2026-11-05T12:00:00+00:00",
                "updatedAt": "2026-11-05T12:00:00+00:00"
              },
              {
                "id": {{severance.Id}},
                "title": "Severance",
                "status": "watching",
                "service": "apple-tv-plus",
                "lastWatched": { "season": 2, "episode": 5 },
                "addedAt": "2026-10-01T18:00:00+00:00",
                "updatedAt": "2026-11-10T21:30:00+00:00"
              }
            ]
            """);
        var actual = JsonNode.Parse(json);
        Assert.True(JsonNode.DeepEquals(expected, actual), $"Expected:\n{expected}\nbut got:\n{actual}");
    }

    // One user never sees another's shows (D60).
    [Fact]
    public async Task GetShows_ReturnsOnlyTheLoggedInUsersShows()
    {
        var user = await factory.CreateUserAsync();
        var otherUser = await factory.CreateUserAsync();
        var own = NewShow(user, "Severance");
        await AddShowsAsync(own, NewShow(otherUser, "The Bear"));
        var client = await factory.CreateLoggedInClientAsync(user);

        var json = JsonNode.Parse(await client.GetStringAsync("/api/shows", TestContext.Current.CancellationToken))!;

        var show = Assert.Single(json.AsArray());
        Assert.Equal(own.Id, show!["id"]!.GetValue<int>());
    }

    // Added straight to the database, since no endpoint can add shows yet (D90).
    private async Task AddShowsAsync(params Show[] shows)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WatchTrackerDbContext>();
        db.Shows.AddRange(shows);
        await db.SaveChangesAsync(TestContext.Current.CancellationToken);
    }

    // A show where only its user and its title matter to the test.
    private static Show NewShow(User user, string title) => new()
    {
        UserId = user.Id,
        Title = title,
        Status = "watching",
        AddedAt = DateTimeOffset.UtcNow,
        UpdatedAt = DateTimeOffset.UtcNow,
    };
}
