using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using WatchTracker.Api.Data;

namespace WatchTracker.Api.Shows;

// The /api/shows endpoints (D69). They require a login (see Program.cs), and every query is
// filtered on the logged-in user, so another user's show is a 404, as if it didn't exist (D67).
public static class ShowEndpoints
{
    public static void MapShowEndpoints(this IEndpointRouteBuilder app)
    {
        var shows = app.MapGroup("/api/shows");

        // The user's shows, the newest first. Angular sorts its lists itself.
        shows.MapGet("/", async (ClaimsPrincipal principal, WatchTrackerDbContext db, CancellationToken cancellationToken) =>
        {
            var userId = GetUserId(principal);

            var userShows = await db.Shows.AsNoTracking()
                .Where(show => show.UserId == userId)
                .OrderByDescending(show => show.Id)
                .ToListAsync(cancellationToken);

            return ShowModel.MapListFrom(userShows);
        });

        // Adds a show for the user. The server sets the id and both timestamps (D67).
        shows.MapPost("/", async Task<Created<ShowModel>> (
            ShowPostModel post, ClaimsPrincipal principal, WatchTrackerDbContext db, CancellationToken cancellationToken) =>
        {
            var now = Now();
            var show = new Show
            {
                UserId = GetUserId(principal),
                Title = post.Title.Trim(),
                Status = post.Status,
                Service = post.Service,
                LastWatchedSeason = post.LastWatched?.Season,
                LastWatchedEpisode = post.LastWatched?.Episode,
                AddedAt = now,
                UpdatedAt = now,
            };
            db.Shows.Add(show);
            await db.SaveChangesAsync(cancellationToken);

            // Location is the show's own address, where PUT and DELETE work on it.
            return TypedResults.Created($"/api/shows/{show.Id}", ShowModel.MapFrom(show));
        });
    }

    // Now, to the microsecond: Postgres keeps no more, so what an endpoint returns is what it
    // saved. .NET on Linux, where CI and Fly run, counts in tenths of a microsecond.
    private static DateTimeOffset Now()
    {
        var now = DateTimeOffset.UtcNow;
        return now.AddTicks(-(now.Ticks % TimeSpan.TicksPerMicrosecond));
    }

    // The logged-in user's id, read from the login cookie – no database query. Every endpoint
    // here requires a login, so it is always there; if not, something is badly wrong.
    private static string GetUserId(ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new InvalidOperationException("No logged in user.");
    }
}
