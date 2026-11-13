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
        var again = ReadHiddenLine("Password again: ");
        if (password is null || again is null)
        {
            Console.Error.WriteLine("The input had an escape sequence in it, such as the Esc key. No user was created.");
            return 1;
        }

        if (again != password)
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
    // Null if the line had an escape sequence in it.
    private static string? ReadHiddenLine(string prompt)
    {
        // Turn off the terminal's "bracketed paste". When it is on, pasted text comes wrapped in
        // ESC[200~ … ESC[201~, and ReadKey returns the markers' characters as part of the line.
        Console.Write("\u001b[?2004l");
        Console.Write(prompt);
        var text = new StringBuilder();
        var hadEscape = false;
        while (true)
        {
            var key = Console.ReadKey(intercept: true);
            if (key.Key == ConsoleKey.Enter)
            {
                break;
            }

            // An Esc starts a terminal sequence, whose characters would end up in the password.
            // The whole line is rejected rather than guessing where the sequence ends.
            if (key.Key == ConsoleKey.Escape)
            {
                hadEscape = true;
            }
            else if (key.Key == ConsoleKey.Backspace)
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
        return hadEscape ? null : text.ToString();
    }
}
