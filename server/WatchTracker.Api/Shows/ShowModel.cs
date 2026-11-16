using System.ComponentModel.DataAnnotations;

namespace WatchTracker.Api.Shows;

// A show as the API returns it: Angular's TrackedShow, with a number id (D67). A null service
// or lastWatched is left out of the JSON (see Program.cs).
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

// Both from 1, as in Angular's form; {0} is the field's name. A number missing from the JSON
// arrives as 0, so it is refused too.
public record EpisodeRef(
    [Range(1, int.MaxValue, ErrorMessage = "{0} cannot be lower than 1.")] int Season,
    [Range(1, int.MaxValue, ErrorMessage = "{0} cannot be lower than 1.")] int Episode);
