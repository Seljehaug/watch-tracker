using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using WatchTracker.Api.Shows;
using WatchTracker.Api.Users;

namespace WatchTracker.Api.Data;

// Test data for the development database (D76): a user to log in as, and their shows, with every
// status plus the odd cases (not started, no service, a long title). Development only. `docker
// compose down -v` empties the database, and the next start seeds it again.
public static class DevelopmentSeed
{
    // The user first: the shows belong to them.
    public static async Task SeedAsync(IServiceProvider services)
    {
        var user = await SeedUserAsync(services.GetRequiredService<UserManager<User>>(), services.GetRequiredService<IConfiguration>());
        await SeedShowsAsync(services.GetRequiredService<WatchTrackerDbContext>(), user);
    }

    // The login in appsettings.Development.json, made the same way as with the create-user command.
    private static async Task<User> SeedUserAsync(UserManager<User> userManager, IConfiguration configuration)
    {
        var email = configuration["DevelopmentUser:Email"]
            ?? throw new InvalidOperationException("DevelopmentUser:Email is not set.");
        var password = configuration["DevelopmentUser:Password"]
            ?? throw new InvalidOperationException("DevelopmentUser:Password is not set.");

        var existing = await userManager.FindByEmailAsync(email);
        if (existing is not null) return existing;

        var result = await CreateUserCommand.CreateAsync(userManager, email, password);

        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                "The development user could not be created: " + string.Join(" ", result.Errors.Select(error => error.Description)));
        }

        return (await userManager.FindByEmailAsync(email))!;
    }

    private static async Task SeedShowsAsync(WatchTrackerDbContext db, User user)
    {
        if (await db.Shows.AnyAsync()) return;

        var now = DateTimeOffset.UtcNow;

        Show NewShow(string title, string status, string? service, int? season, int? episode, int daysAgo) => new()
        {
            UserId = user.Id,
            Title = title,
            Status = status,
            Service = service,
            LastWatchedSeason = season,
            LastWatchedEpisode = episode,
            AddedAt = now.AddDays(-daysAgo - 30),
            UpdatedAt = now.AddDays(-daysAgo),
        };

        db.Shows.AddRange(
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
        await db.SaveChangesAsync();
    }
}
