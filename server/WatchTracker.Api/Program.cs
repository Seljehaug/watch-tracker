using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using WatchTracker.Api.Auth;
using WatchTracker.Api.Data;
using WatchTracker.Api.Shows;
using WatchTracker.Api.Users;

var builder = WebApplication.CreateBuilder(args);

// The database: Compose's Postgres locally, Neon in production (set as a Fly secret).
// Kerberos (GSS) is turned off: neither database uses it, and without its library in the
// Docker image, Npgsql wrote a confusing error line at every start.
var connectionString = new NpgsqlConnectionStringBuilder(
    builder.Configuration.GetConnectionString("Default")
        ?? throw new InvalidOperationException("ConnectionStrings:Default is not set."))
{
    GssEncryptionMode = GssEncryptionMode.Disable,
}.ConnectionString;
builder.Services.AddDbContext<WatchTrackerDbContext>(options => options.UseNpgsql(connectionString));

// Login with ASP.NET Core Identity (D70): users, password hashing and the login cookie.
// AddIdentityCore leaves out roles and Identity's built-in pages.
builder.Services
    .AddIdentityCore<User>(options =>
    {
        options.User.RequireUniqueEmail = true;

        // At least 15 characters, with no rules about digits or symbols: length matters most.
        options.Password.RequiredLength = 15;
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;

        // Five wrong passwords in a row lock the account for five minutes (D80).
        // They are only counted when the login asks for it (lockoutOnFailure in AuthEndpoints).
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    })
    .AddEntityFrameworkStores<WatchTrackerDbContext>()
    .AddSignInManager();

builder.Services.AddAuthentication(IdentityConstants.ApplicationScheme).AddIdentityCookies();

// Every endpoint requires a login unless it is marked AllowAnonymous(),
// so a new endpoint can't be left open by mistake.
builder.Services.AddAuthorizationBuilder()
    .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());

builder.Services.ConfigureApplicationCookie(options =>
{
    // The __Host- prefix stops other subdomains from setting or replacing this cookie.
    options.Cookie.Name = "__Host-watchtracker";

    // JavaScript can't read the cookie, so a script injected into the page can't steal it.
    options.Cookie.HttpOnly = true;

    // Only sent over HTTPS. "Always", because Fly passes requests on to the app as plain HTTP.
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;

    // Not sent with requests that start on another site (CSRF). Other subdomains count as the
    // same site, so the Sec-Fetch-Site check further down covers those.
    options.Cookie.SameSite = SameSiteMode.Strict;

    // Lasts 60 days, and is renewed while the app is in use.
    options.ExpireTimeSpan = TimeSpan.FromDays(60);
    options.SlidingExpiration = true;

    // Answer 401 and 403 instead of redirecting to login pages that don't exist. Set on the
    // existing Events: replacing them would drop Identity's check that logs a user out
    // after a password change.
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

// The keys that encrypt the cookie are kept in the database. Inside the container they would
// be lost on every deploy, logging everyone out. They are stored unencrypted, which is why the
// log warns about it when a new key is made.
builder.Services.AddDataProtection()
    .PersistKeysToDbContext<WatchTrackerDbContext>()
    // A fixed name, so the keys don't depend on the folder the app runs from.
    .SetApplicationName("WatchTracker");

// Leave null properties out of the JSON, as in Angular's models (service?: …).
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull);

// /healthz for Fly (D75). Never add a database check: a sleeping Neon would make Fly
// stop sending traffic to the app.
builder.Services.AddHealthChecks();

// One log line per request: method, path, status and duration. Never headers or bodies,
// which hold cookies and passwords (D75).
builder.Services.AddHttpLogging(options =>
{
    options.LoggingFields = HttpLoggingFields.RequestMethod
        | HttpLoggingFields.RequestPath
        | HttpLoggingFields.ResponseStatusCode
        | HttpLoggingFields.Duration;
    options.CombineLogs = true;
});

// Compress Angular's files, which halves main.js. Only those: compressing a response that
// holds a secret is unsafe over HTTPS (the BREACH attack), so the API's JSON is left alone.
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.MimeTypes = ["text/html", "text/css", "text/javascript"];
});

var app = builder.Build();

// Run new migrations before taking requests (D68). In Development, also add the dev user and the
// test shows, if they are missing.
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<WatchTrackerDbContext>().Database.Migrate();
    if (app.Environment.IsDevelopment())
    {
        await DevelopmentSeed.SeedAsync(scope.ServiceProvider);
    }
}

// `dotnet WatchTracker.Api.dll create-user <email>` creates a user and stops, without starting the
// web server – the app that is already running has the port.
if (args is ["create-user", ..])
{
    Environment.ExitCode = await CreateUserCommand.RunAsync(app.Services, args);
    return;
}

app.UseResponseCompression();

// Serve Angular's build from wwwroot. Before the logging, so its files get no log lines.
// index.html is never cached: it names the current bundles, which change with every deploy.
var angularFiles = new StaticFileOptions
{
    OnPrepareResponse = context =>
    {
        if (context.File.Name == "index.html")
        {
            context.Context.Response.Headers.CacheControl = "no-cache";
        }
    },
};
app.UseStaticFiles(angularFiles);

app.UseHttpLogging();

// Block changes (anything but GET and HEAD) that don't come from the app's own pages (CSRF).
// Browsers say where a request comes from in the Sec-Fetch-Site header. Requests without it,
// such as curl and the tests, are let through.
app.Use(async (context, next) =>
{
    var method = context.Request.Method;
    var site = context.Request.Headers["Sec-Fetch-Site"].ToString();
    if (!HttpMethods.IsGet(method) && !HttpMethods.IsHead(method) && site is not ("" or "same-origin"))
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return;
    }

    await next(context);
});

// Read the login cookie, then turn away requests that need a login (401).
app.UseAuthentication();
app.UseAuthorization();

// Open, and not logged: Fly calls it every 30 seconds.
app.MapHealthChecks("/healthz").WithHttpLogging(HttpLoggingFields.None).AllowAnonymous();
app.MapAuthEndpoints();
app.MapShowEndpoints();

// Unknown /api paths get a 404, not index.html.
app.MapFallback("/api/{**path}", () => Results.NotFound());
// Every other path is one of Angular's pages: send index.html. Open, so a user who isn't
// logged in can reach the login page.
app.MapFallbackToFile("index.html", angularFiles).AllowAnonymous();

app.Run();
