namespace WatchTracker.Api.Shows;

// The status ids Angular stores (D31), from SHOW_STATUSES in shows/show-status.ts. Constants, so
// validation attributes can use them. A new status is added in both places; AngularListsTests
// checks that they match.
public static class ShowStatuses
{
    public const string Watching = "watching";
    public const string WantToWatch = "want-to-watch";
    public const string Finished = "finished";
    public const string Dropped = "dropped";
}
