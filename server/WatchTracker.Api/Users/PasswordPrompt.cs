using System.Text;

namespace WatchTracker.Api.Users;

// The hidden password prompt of the create-user and set-password commands (D95).
public static class PasswordPrompt
{
    // Asks for a new password twice. Null if it couldn't be read or the two don't match; the reason
    // is written to the error output.
    public static string? ReadNewPassword()
    {
        // The hidden prompt needs a terminal: it can't read from a pipe or a file.
        if (Console.IsInputRedirected)
        {
            Console.Error.WriteLine("Run this in a terminal, so the password can be typed at a hidden prompt.");
            return null;
        }

        var password = ReadHiddenLine("Password: ");
        var again = ReadHiddenLine("Password again: ");
        if (password is null || again is null)
        {
            Console.Error.WriteLine("The input had an escape sequence in it, such as the Esc key.");
            return null;
        }

        if (again != password)
        {
            Console.Error.WriteLine("The passwords don't match.");
            return null;
        }

        return password;
    }

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
