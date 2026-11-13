using System.Text;
using Microsoft.AspNetCore.Identity;

namespace WatchTracker.Api.Users;

// The create-user command (D70). There is no registration, so users are made from a terminal on
// the server – in production through `fly ssh console`:
//   dotnet WatchTracker.Api.dll create-user <email>
// The password is typed at a hidden prompt. As an argument it would end up in the shell history.
public static class CreateUserCommand
{
    // Returns the exit code: 0 when the user was created, 1 otherwise.
    public static async Task<int> RunAsync(IServiceProvider services, string[] args)
    {
        if (args is not ["create-user", var email])
        {
            Console.Error.WriteLine("Usage: dotnet WatchTracker.Api.dll create-user <email>");
            return 1;
        }

        // The hidden prompt needs a terminal: it can't read from a pipe or a file.
        if (Console.IsInputRedirected)
        {
            Console.Error.WriteLine("Run this in a terminal, so the password can be typed at a hidden prompt.");
            return 1;
        }

        var password = ReadHiddenLine("Password: ");
        if (ReadHiddenLine("Password again: ") != password)
        {
            Console.Error.WriteLine("The passwords don't match. No user was created.");
            return 1;
        }

        using var scope = services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var result = await CreateAsync(userManager, email, password);
        if (!result.Succeeded)
        {
            // Identity's own messages, such as a password that is too short or an email in use.
            foreach (var error in result.Errors)
            {
                Console.Error.WriteLine(error.Description);
            }
            return 1;
        }

        Console.WriteLine($"Created the user {email}.");
        return 0;
    }

    // Creates the user, with the email as the user name too. Shared with the Development seed.
    // Identity checks the password rules and that the email isn't in use (see Program.cs).
    public static Task<IdentityResult> CreateAsync(UserManager<User> userManager, string email, string password) =>
        userManager.CreateAsync(new User { UserName = email, Email = email }, password);

    // Reads a line without showing it, not even as asterisks. Backspace works; pasting works too.
    private static string ReadHiddenLine(string prompt)
    {
        Console.Write(prompt);
        var text = new StringBuilder();
        while (true)
        {
            var key = Console.ReadKey(intercept: true);
            if (key.Key == ConsoleKey.Enter)
            {
                break;
            }

            if (key.Key == ConsoleKey.Backspace)
            {
                if (text.Length > 0)
                {
                    text.Length--;
                }
            }
            else if (!char.IsControl(key.KeyChar))
            {
                text.Append(key.KeyChar);
            }
        }

        Console.WriteLine();
        return text.ToString();
    }
}
