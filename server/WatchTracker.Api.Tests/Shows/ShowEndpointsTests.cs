using System.Net;
using System.Text;
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
    // Valid for POST and PUT.
    private const string ValidShowJson = """{ "title": "Severance", "status": "watching" }""";

    // The fallback policy in Program.cs requires a login; no show endpoint may opt out of it.
    [Theory]
    [InlineData("GET", "/api/shows")]
    [InlineData("POST", "/api/shows")]
    public async Task ShowEndpoints_WithoutALogin_Are401(string method, string path)
    {
        using var request = new HttpRequestMessage(new HttpMethod(method), path);
        if (method != "GET")
        {
            request.Content = JsonContent(ValidShowJson);
        }

        var response = await factory.CreateClient().SendAsync(request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

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
        AssertJsonEquals($$"""
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
            """, json);
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

    [Fact]
    public async Task PostShow_SavesTheShowForTheUser_AndReturnsItWithItsLocation()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var client = await factory.CreateLoggedInClientAsync();
        var before = DateTimeOffset.UtcNow;

        // Spaces around the title, and an id and a time the server must not take from the client.
        var response = await PostShowAsync(client, """
            {
              "id": 999999,
              "title": "  Severance  ",
              "status": "watching",
              "service": "apple-tv-plus",
              "lastWatched": { "season": 2, "episode": 5 },
              "addedAt": "2020-01-01T00:00:00+00:00"
            }
            """);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        var created = JsonNode.Parse(json)!;
        var id = created["id"]!.GetValue<int>();
        Assert.NotEqual(999999, id);
        Assert.Equal($"/api/shows/{id}", response.Headers.Location?.OriginalString);

        // The server's time, the same in both. Postgres keeps microseconds, so before is cut to
        // the microsecond too.
        var addedAt = created["addedAt"]!.GetValue<DateTimeOffset>();
        Assert.Equal(addedAt, created["updatedAt"]!.GetValue<DateTimeOffset>());
        Assert.InRange(addedAt, ToMicroseconds(before), DateTimeOffset.UtcNow);

        AssertJsonEquals($$"""
            {
              "id": {{id}},
              "title": "Severance",
              "status": "watching",
              "service": "apple-tv-plus",
              "lastWatched": { "season": 2, "episode": 5 },
              "addedAt": {{created["addedAt"]!.ToJsonString()}},
              "updatedAt": {{created["updatedAt"]!.ToJsonString()}}
            }
            """, json);

        // Saved for this user exactly as returned, the timestamps included, so the show Angular
        // gets from POST is the one it gets from the list later.
        AssertJsonEquals($"[{json}]", await client.GetStringAsync("/api/shows", cancellationToken));
    }

    // Each body breaks one rule and is otherwise valid, so the 400 names that field alone.
    [Theory]
    [InlineData("""{ "title": "", "status": "watching" }""", "Title")]
    [InlineData("""{ "title": "   ", "status": "watching" }""", "Title")]
    [InlineData("""{ "status": "watching" }""", "Title")]
    [InlineData("""{ "title": "Severance", "status": "paused" }""", "Status")]
    [InlineData("""{ "title": "Severance" }""", "Status")]
    [InlineData("""{ "title": "Severance", "status": "watching", "service": "hulu" }""", "Service")]
    [InlineData("""{ "title": "Severance", "status": "watching", "service": "" }""", "Service")]
    [InlineData("""{ "title": "Severance", "status": "watching", "lastWatched": { "season": 0, "episode": 1 } }""", "LastWatched.Season")]
    [InlineData("""{ "title": "Severance", "status": "watching", "lastWatched": { "season": 1, "episode": 0 } }""", "LastWatched.Episode")]
    [InlineData("""{ "title": "Severance", "status": "watching", "lastWatched": { "season": 1 } }""", "LastWatched.Episode")]
    public async Task PostShow_WithAFieldBroken_Is400ForThatField_AndSavesNothing(string body, string field)
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var client = await factory.CreateLoggedInClientAsync();

        var response = await PostShowAsync(client, body);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var errors = JsonNode.Parse(await response.Content.ReadAsStringAsync(cancellationToken))!["errors"]!.AsObject();
        Assert.Equal(field, Assert.Single(errors).Key);
        Assert.Equal("[]", await client.GetStringAsync("/api/shows", cancellationToken));
    }

    private static Task<HttpResponseMessage> PostShowAsync(HttpClient client, string json) =>
        client.PostAsync("/api/shows", JsonContent(json), TestContext.Current.CancellationToken);

    // JSON as written, so a test can send fields that are missing, unknown or of the wrong kind.
    private static StringContent JsonContent(string json) => new(json, Encoding.UTF8, "application/json");

    // DeepEquals ignores the order of the properties, but not of the items in a list.
    private static void AssertJsonEquals(string expected, string actual)
    {
        var expectedJson = JsonNode.Parse(expected);
        var actualJson = JsonNode.Parse(actual);
        Assert.True(JsonNode.DeepEquals(expectedJson, actualJson), $"Expected:\n{expectedJson}\nbut got:\n{actualJson}");
    }

    // Postgres keeps time to the microsecond; .NET on Linux counts in tenths of one.
    private static DateTimeOffset ToMicroseconds(DateTimeOffset time) =>
        time.AddTicks(-(time.Ticks % TimeSpan.TicksPerMicrosecond));

    // Added straight to the database, so a test can give shows to another user and choose their
    // timestamps (D90).
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
