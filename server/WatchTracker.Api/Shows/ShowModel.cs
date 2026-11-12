namespace WatchTracker.Api.Shows;

// A show as the API returns it: the shape of Angular's TrackedShow, with a number id (D67).
// A null service or lastWatched is left out of the JSON (Program.cs), as in localStorage.
public record ShowModel(
    int Id,
    string Title,
    string Status,
    string? Service,
    EpisodeRef? LastWatched,
    DateTimeOffset AddedAt,
    DateTimeOffset UpdatedAt)
{
    public static ShowModel MapFrom(Show show) => new(
        show.Id,
        show.Title,
        show.Status,
        show.Service,
        show is { LastWatchedSeason: int season, LastWatchedEpisode: int episode }
            ? new EpisodeRef(season, episode)
            : null,
        show.AddedAt,
        show.UpdatedAt);

    public static List<ShowModel> MapListFrom(IEnumerable<Show> shows) => shows.Select(MapFrom).ToList();
}

public record EpisodeRef(int Season, int Episode);
