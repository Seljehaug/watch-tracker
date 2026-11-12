using Microsoft.EntityFrameworkCore;
using WatchTracker.Api.Data;

namespace WatchTracker.Api.Shows;

// The /api/shows endpoints (D69). Open to anyone until login comes in B3 (D88).
public static class ShowEndpoints
{
    public static void MapShowEndpoints(this IEndpointRouteBuilder app)
    {
        var shows = app.MapGroup("/api/shows");

        shows.MapGet("/", async (WatchTrackerDbContext db, CancellationToken cancellationToken) =>
        {
            var all = await db.Shows.AsNoTracking().OrderBy(show => show.Id).ToListAsync(cancellationToken);
            return ShowModel.MapListFrom(all);
        });
    }
}
