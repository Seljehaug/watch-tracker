using WatchTracker.Api.Users;

namespace WatchTracker.Api.Shows;

// A show in the database. Status and service use the same ids as Angular ("watching",
// "netflix", D31). Both last-watched numbers are null until the show is started.
public class Show
{
    public int Id { get; set; }

    // The user the show belongs to (D60). The API only ever gives a user their own shows.
    public required string UserId { get; set; }

    // Tells EF that UserId points to a user in AspNetUsers. Never loaded: the endpoints only
    // need UserId. Deleting a user deletes their shows.
    public User User { get; set; } = null!;

    public required string Title { get; set; }
    public required string Status { get; set; }
    public string? Service { get; set; }
    public int? LastWatchedSeason { get; set; }
    public int? LastWatchedEpisode { get; set; }
    public DateTimeOffset AddedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
