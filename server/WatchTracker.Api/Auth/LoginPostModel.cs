namespace WatchTracker.Api.Auth;

// The body of POST /api/auth/login.
public record LoginPostModel(string Email, string Password)
{
    // Leaves the password out, so it can't end up in a log line.
    public override string ToString() => $"LoginPostModel {{ Email = {Email} }}";
}
