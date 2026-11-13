namespace WatchTracker.Api.Shows;

// A show in the database. Status and service use the same ids as Angular ("watching",
// "netflix", D31). Both last-watched numbers are null until the show is started.
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
