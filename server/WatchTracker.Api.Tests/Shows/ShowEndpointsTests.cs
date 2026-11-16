using System.Net;
using System.Text;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
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
    [InlineData("GET", "/api/shows", null)]
    [InlineData("POST", "/api/shows", ValidShowJson)]
    [InlineData("PUT", "/api/shows/1", ValidShowJson)]
    [InlineData("DELETE", "/api/shows/1", null)]
    [InlineData("POST", "/api/shows/1/next-episode", null)]
    public async Task ShowEndpoints_WithoutALogin_Are401(string method, string path, string? body)
    {
        using var request = new HttpRequestMessage(new HttpMethod(method), path);
        if (body is not null)
        {
            request.Content = JsonContent(body);
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

    [Fact]
    public async Task PutShow_ReplacesTheFieldsTheUserDecides_AndKeepsAddedAt()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var user = await factory.CreateUserAsync();
        var client = await factory.CreateLoggedInClientAsync(user);
        var show = NewShow(user, "Severence", "apple-tv-plus", season: 2, episode: 5);
        await AddShowsAsync(show);
        var before = DateTimeOffset.UtcNow;

        var response = await PutShowAsync(client, show.Id, """
            {
              "title": "  Severance  ",
              "status": "finished",
              "service": "netflix",
              "lastWatched": { "season": 3, "episode": 1 }
            }
            """);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        var updatedAt = JsonNode.Parse(json)!["updatedAt"]!;
        Assert.InRange(updatedAt.GetValue<DateTimeOffset>(), ToMicroseconds(before), DateTimeOffset.UtcNow);
        AssertJsonEquals($$"""
            {
              "id": {{show.Id}},
              "title": "Severance",
              "status": "finished",
              "service": "netflix",
              "lastWatched": { "season": 3, "episode": 1 },
              "addedAt": "2026-10-01T18:00:00+00:00",
              "updatedAt": {{updatedAt.ToJsonString()}}
            }
            """, json);
        AssertJsonEquals($"[{json}]", await client.GetStringAsync("/api/shows", cancellationToken));
    }

    // PUT takes every field, so a service or lastWatched left out clears it (D69).
    [Fact]
    public async Task PutShow_WithoutServiceAndLastWatched_ClearsThem()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var user = await factory.CreateUserAsync();
        var client = await factory.CreateLoggedInClientAsync(user);
        var show = NewShow(user, "Severance", "apple-tv-plus", season: 2, episode: 5);
        await AddShowsAsync(show);

        var response = await PutShowAsync(client, show.Id, """{ "title": "Severance", "status": "want-to-watch" }""");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var saved = await FindShowAsync(show.Id);
        Assert.Null(saved.Service);
        Assert.Null(saved.LastWatchedSeason);
        Assert.Null(saved.LastWatchedEpisode);
    }

    // Another user's show is a 404, as if it didn't exist (D67), and stays as it was.
    [Fact]
    public async Task PutShow_OnAnotherUsersShow_Is404_AndChangesNothing()
    {
        var otherUsersShow = NewShow(await factory.CreateUserAsync(), "The Bear");
        await AddShowsAsync(otherUsersShow);
        var client = await factory.CreateLoggedInClientAsync();

        var response = await PutShowAsync(client, otherUsersShow.Id, ValidShowJson);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(ShowModel.MapFrom(otherUsersShow), ShowModel.MapFrom(await FindShowAsync(otherUsersShow.Id)));
    }

    // PUT takes the same ShowPostModel as POST, so one broken field shows the validation runs.
    [Fact]
    public async Task PutShow_WithAFieldBroken_Is400_AndChangesNothing()
    {
        var user = await factory.CreateUserAsync();
        var client = await factory.CreateLoggedInClientAsync(user);
        var show = NewShow(user, "Severance");
        await AddShowsAsync(show);

        var response = await PutShowAsync(client, show.Id, """{ "title": "Severance", "status": "paused" }""");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ShowModel.MapFrom(show), ShowModel.MapFrom(await FindShowAsync(show.Id)));
    }

    [Fact]
    public async Task DeleteShow_Is204_AndDeletesThatShowOnly()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var user = await factory.CreateUserAsync();
        var client = await factory.CreateLoggedInClientAsync(user);
        var toDelete = NewShow(user, "Lost");
        var toKeep = NewShow(user, "Severance");
        await AddShowsAsync(toDelete, toKeep);

        var response = await client.DeleteAsync($"/api/shows/{toDelete.Id}", cancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var list = JsonNode.Parse(await client.GetStringAsync("/api/shows", cancellationToken))!;
        Assert.Equal(toKeep.Id, Assert.Single(list.AsArray())!["id"]!.GetValue<int>());
    }

    [Fact]
    public async Task DeleteShow_OnAnotherUsersShow_Is404_AndDeletesNothing()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var otherUsersShow = NewShow(await factory.CreateUserAsync(), "The Bear");
        await AddShowsAsync(otherUsersShow);
        var client = await factory.CreateLoggedInClientAsync();

        var response = await client.DeleteAsync($"/api/shows/{otherUsersShow.Id}", cancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        await FindShowAsync(otherUsersShow.Id);
    }

    // D34: not started becomes S01E01, otherwise the next episode in the same season; Want to
    // watch becomes Watching.
    [Theory]
    [InlineData("want-to-watch", null, null, 1, 1)]
    [InlineData("watching", null, null, 1, 1)]
    [InlineData("watching", 2, 5, 2, 6)]
    [InlineData("want-to-watch", 3, 9, 3, 10)]
    public async Task NextEpisode_MarksTheNextEpisode_AndTheShowAsWatching(
        string status, int? season, int? episode, int nextSeason, int nextEpisode)
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var user = await factory.CreateUserAsync();
        var client = await factory.CreateLoggedInClientAsync(user);
        var show = NewShow(user, "Severance", status: status, season: season, episode: episode);
        await AddShowsAsync(show);
        var before = DateTimeOffset.UtcNow;

        var response = await client.PostAsync($"/api/shows/{show.Id}/next-episode", null, cancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        var updatedAt = JsonNode.Parse(json)!["updatedAt"]!;
        Assert.InRange(updatedAt.GetValue<DateTimeOffset>(), ToMicroseconds(before), DateTimeOffset.UtcNow);
        AssertJsonEquals($$"""
            {
              "id": {{show.Id}},
              "title": "Severance",
              "status": "watching",
              "lastWatched": { "season": {{nextSeason}}, "episode": {{nextEpisode}} },
              "addedAt": "2026-10-01T18:00:00+00:00",
              "updatedAt": {{updatedAt.ToJsonString()}}
            }
            """, json);
        AssertJsonEquals($"[{json}]", await client.GetStringAsync("/api/shows", cancellationToken));
    }

    // The user's own choice, which a stray tap mustn't undo (D34): no new episode, status or
    // updatedAt. The show comes back as it is, so a device with an old list catches up.
    [Theory]
    [InlineData("finished")]
    [InlineData("dropped")]
    public async Task NextEpisode_OnAFinishedOrDroppedShow_ChangesNothing(string status)
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var user = await factory.CreateUserAsync();
        var client = await factory.CreateLoggedInClientAsync(user);
        var show = NewShow(user, "Severance", status: status, season: 2, episode: 6);
        await AddShowsAsync(show);

        var response = await client.PostAsync($"/api/shows/{show.Id}/next-episode", null, cancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        AssertJsonEquals($$"""
            {
              "id": {{show.Id}},
              "title": "Severance",
              "status": "{{status}}",
              "lastWatched": { "season": 2, "episode": 6 },
              "addedAt": "2026-10-01T18:00:00+00:00",
              "updatedAt": "2026-10-01T18:00:00+00:00"
            }
            """, await response.Content.ReadAsStringAsync(cancellationToken));
        Assert.Equal(ShowModel.MapFrom(show), ShowModel.MapFrom(await FindShowAsync(show.Id)));
    }

    [Fact]
    public async Task NextEpisode_OnAnotherUsersShow_Is404_AndChangesNothing()
    {
        var otherUsersShow = NewShow(await factory.CreateUserAsync(), "The Bear", season: 3, episode: 2);
        await AddShowsAsync(otherUsersShow);
        var client = await factory.CreateLoggedInClientAsync();

        var response = await client.PostAsync(
            $"/api/shows/{otherUsersShow.Id}/next-episode", null, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(ShowModel.MapFrom(otherUsersShow), ShowModel.MapFrom(await FindShowAsync(otherUsersShow.Id)));
    }

    private static Task<HttpResponseMessage> PostShowAsync(HttpClient client, string json) =>
        client.PostAsync("/api/shows", JsonContent(json), TestContext.Current.CancellationToken);

    // JSON as written, so a test can send fields that are missing, unknown or of the wrong kind.
    private static Task<HttpResponseMessage> PutShowAsync(HttpClient client, int id, string json) =>
        client.PutAsync($"/api/shows/{id}", JsonContent(json), TestContext.Current.CancellationToken);

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

    // The show as it is in the database, read straight from it. Fails if it is gone.
    private async Task<Show> FindShowAsync(int id)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WatchTrackerDbContext>();
        return await db.Shows.AsNoTracking().SingleAsync(show => show.Id == id, TestContext.Current.CancellationToken);
    }

    // A show where only its user and its title matter to the test – and its status, service and
    // episode, when they are given. Both timestamps a fixed time in the past.
    private static Show NewShow(
        User user, string title, string status = "watching", string? service = null, int? season = null, int? episode = null) => new()
    {
        UserId = user.Id,
        Title = title,
        Status = status,
        Service = service,
        LastWatchedSeason = season,
        LastWatchedEpisode = episode,
        AddedAt = new DateTimeOffset(2026, 10, 1, 18, 0, 0, TimeSpan.Zero),
        UpdatedAt = new DateTimeOffset(2026, 10, 1, 18, 0, 0, TimeSpan.Zero),
    };
}
