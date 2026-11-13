using Microsoft.EntityFrameworkCore;
using WatchTracker.Api.Shows;

namespace WatchTracker.Api.Data;

// Test shows for an empty development database (D76): every status, plus the odd cases (not
// started, no service, a long title). Development only. `docker compose down -v` empties the
// database, and the next start seeds it again.
public static class DevelopmentSeed
{
    public static void Seed(DbContext context)
    {
        var shows = context.Set<Show>();
        if (shows.Any()) return;

        var now = DateTimeOffset.UtcNow;

        Show NewShow(string title, string status, string? service, int? season, int? episode, int daysAgo) => new()
        {
            Title = title,
            Status = status,
            Service = service,
            LastWatchedSeason = season,
            LastWatchedEpisode = episode,
            AddedAt = now.AddDays(-daysAgo - 30),
            UpdatedAt = now.AddDays(-daysAgo),
        };

        shows.AddRange(
            NewShow("Severance", "watching", "apple-tv-plus", 2, 5, daysAgo: 1),
            NewShow("The Bear", "watching", "disney-plus", 3, 2, daysAgo: 3),
            NewShow("Slow Horses", "watching", "apple-tv-plus", 4, 1, daysAgo: 6),
            NewShow("Exit", "watching", "nrk-tv", 3, 4, daysAgo: 12),
            NewShow("Shōgun", "want-to-watch", "disney-plus", null, null, daysAgo: 2),
            NewShow("The Pitt", "want-to-watch", "hbo-max", null, null, daysAgo: 9),
            NewShow("A Show With a Title Long Enough to Need an Ellipsis on a Phone", "want-to-watch", null, null, null, daysAgo: 20),
            NewShow("Fleabag", "finished", "prime-video", 2, 6, daysAgo: 40),
            NewShow("Skam", "finished", "nrk-tv", 4, 10, daysAgo: 60),
            NewShow("Lost", "dropped", null, 3, 7, daysAgo: 90));
        context.SaveChanges();
    }
}
