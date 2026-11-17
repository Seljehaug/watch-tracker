using System.ComponentModel.DataAnnotations;

namespace WatchTracker.Api.Shows;

// What POST and PUT take: the fields the user decides. A request that breaks one of the
// attributes gets a 400 naming the field before the endpoint runs (AddValidation in Program.cs).
public record ShowPostModel(
    // Required also refuses an empty title and one of only spaces.
    [Required(ErrorMessage = "Title is required.")]
    string Title,

    [AllowedValues(ShowStatuses.Watching, ShowStatuses.WantToWatch, ShowStatuses.Finished, ShowStatuses.Dropped,
        ErrorMessage = "Unknown status.")]
    string Status,

    // The ids from STREAMING_SERVICES in Angular's shows/streaming-service.ts, or null for none.
    // AngularListsTests checks that they match.
    [AllowedValues(null, "netflix", "prime-video", "hbo-max", "disney-plus", "apple-tv-plus", "viaplay", "skyshowtime", "nrk-tv", "tv2-play", "other",
        ErrorMessage = "Unknown streaming service.")]
    string? Service,

    // Null when the show isn't started. The numbers are checked in EpisodeRef.
    EpisodeRef? LastWatched);
