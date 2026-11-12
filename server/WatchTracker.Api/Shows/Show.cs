namespace WatchTracker.Api.Shows;

// A tracked show as the database holds it. Status and service hold the same ids as Angular's
// show-status.ts and streaming-service.ts ("watching", "netflix"), so the data reads the same
// in both places (D31). Both last-watched numbers are null while the show isn't started.
public class Show
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Status { get; set; }
    public string? Service { get; set; }
    public int? LastWatchedSeason { get; set; }
    public int? LastWatchedEpisode { get; set; }
    public DateTimeOffset AddedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
