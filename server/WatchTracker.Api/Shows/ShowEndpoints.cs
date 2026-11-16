using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using WatchTracker.Api.Data;

namespace WatchTracker.Api.Shows;

// A user only sees and changes their own shows. Someone else's show is a 404, as if it didn't
// exist.
public static class ShowEndpoints
{
    public static void MapShowEndpoints(this IEndpointRouteBuilder app)
    {
        var shows = app.MapGroup("/api/shows");

        // Newest first.
        shows.MapGet("/", async (ClaimsPrincipal principal, WatchTrackerDbContext db, CancellationToken cancellationToken) =>
        {
            var userId = GetUserId(principal);

            var userShows = await db.Shows.AsNoTracking()
                .Where(show => show.UserId == userId)
                .OrderByDescending(show => show.Id)
                .ToListAsync(cancellationToken);

            return ShowModel.MapListFrom(userShows);
        });

        // The server sets the id and the timestamps, never the client.
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

            return TypedResults.Created($"/api/shows/{show.Id}", ShowModel.MapFrom(show));
        });

        // Overwrites every field, so a service or lastWatched left out is removed.
        shows.MapPut("/{id:int}", async Task<Results<Ok<ShowModel>, NotFound>> (
            int id, ShowPostModel put, ClaimsPrincipal principal, WatchTrackerDbContext db, CancellationToken cancellationToken) =>
        {
            var show = await FindUsersShowAsync(db, id, GetUserId(principal), cancellationToken);
            if (show is null)
            {
                return TypedResults.NotFound();
            }

            show.Title = put.Title.Trim();
            show.Status = put.Status;
            show.Service = put.Service;
            show.LastWatchedSeason = put.LastWatched?.Season;
            show.LastWatchedEpisode = put.LastWatched?.Episode;
            show.UpdatedAt = Now();
            await db.SaveChangesAsync(cancellationToken);

            return TypedResults.Ok(ShowModel.MapFrom(show));
        });

        shows.MapDelete("/{id:int}", async Task<Results<NoContent, NotFound>> (
            int id, ClaimsPrincipal principal, WatchTrackerDbContext db, CancellationToken cancellationToken) =>
        {
            var userId = GetUserId(principal);

            // Deleted in the database without loading the show first. 0 rows means the user has
            // no show with that id.
            var deleted = await db.Shows
                .Where(show => show.Id == id && show.UserId == userId)
                .ExecuteDeleteAsync(cancellationToken);

            return deleted == 0 ? TypedResults.NotFound() : TypedResults.NoContent();
        });
    }

    // Null also when the show is someone else's, so the endpoint answers 404.
    private static Task<Show?> FindUsersShowAsync(WatchTrackerDbContext db, int id, string userId, CancellationToken cancellationToken) =>
        db.Shows.SingleOrDefaultAsync(show => show.Id == id && show.UserId == userId, cancellationToken);

    // Cut to whole microseconds, all Postgres stores, so what an endpoint returns is what was
    // saved. On Linux, .NET's clock has one more digit.
    private static DateTimeOffset Now()
    {
        var now = DateTimeOffset.UtcNow;
        return now.AddTicks(-(now.Ticks % TimeSpan.TicksPerMicrosecond));
    }

    // From the login cookie. Always there, since every endpoint here requires a login.
    private static string GetUserId(ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? throw new InvalidOperationException("No logged in user.");
    }
}
