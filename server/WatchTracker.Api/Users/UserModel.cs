namespace WatchTracker.Api.Users;

// The logged-in user as the API returns it: only the email.
public record UserModel(string Email)
{
    // Never null: Program.cs requires every user to have an email (RequireUniqueEmail).
    public static UserModel MapFrom(User user) => new(user.Email!);
}
