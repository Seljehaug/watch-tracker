using System.Text.Json.Serialization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using WatchTracker.Api.Data;
using WatchTracker.Api.Shows;
using WatchTracker.Api.Users;

var builder = WebApplication.CreateBuilder(args);

// Postgres: Compose's db in Development (appsettings.Development.json), Neon in production,
// where a Fly secret sets it as the environment variable ConnectionStrings__Default (D74).
// Npgsql tries Kerberos (GSS) encryption first by default, and the Docker image has no Kerberos
// library, so .NET printed "Cannot load library libgssapi_krb5.so.2" – a harmless error, and not
// JSON – at every start. Neither Compose's Postgres nor Neon uses Kerberos.
var connectionString = new NpgsqlConnectionStringBuilder(
    builder.Configuration.GetConnectionString("Default")
        ?? throw new InvalidOperationException("ConnectionStrings:Default is not set."))
{
    GssEncryptionMode = GssEncryptionMode.Disable,
}.ConnectionString;
builder.Services.AddDbContext<WatchTrackerDbContext>(options =>
{
    options.UseNpgsql(connectionString);
    if (builder.Environment.IsDevelopment())
    {
        options.UseSeeding((context, _) => DevelopmentSeed.Seed(context));
    }
});

// Login (M2 B3, D70): ASP.NET Core Identity's users and password hashing, and its sign-in
// cookie, with the app's own endpoints rather than MapIdentityApi. AddIdentityCore leaves out
// roles and the default UI; AddSignInManager is what checks a password and writes the cookie.
builder.Services
    .AddIdentityCore<User>(options =>
    {
        options.User.RequireUniqueEmail = true;
        // Length rather than character classes, as NIST SP 800-63B advises: at least 15
        // characters, any mix. Checked when a user is created (the create-user command).
        options.Password.RequiredLength = 15;
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
        // Five wrong passwords in a row lock the account for five minutes (D80) – Identity's
        // defaults, written out. Only when the login endpoint asks for it: lockoutOnFailure is
        // false unless the call sets it. The repo is public, so is the login endpoint's address;
        // the protection is the password and this.
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    })
    .AddEntityFrameworkStores<WatchTrackerDbContext>()
    .AddSignInManager();

builder.Services.AddAuthentication(IdentityConstants.ApplicationScheme).AddIdentityCookies();
builder.Services.AddAuthorization();
builder.Services.ConfigureApplicationCookie(options =>
{
    // The __Host- prefix makes the browser refuse the cookie unless it is Secure, for the whole
    // site (Path=/) and for this host alone (no Domain). Something else on cseljehaug.no then
    // can't set or overwrite it – which could log the browser in to another account.
    options.Cookie.Name = "__Host-watchtracker";
    // JavaScript can't read it, so an XSS hole can't steal the session.
    options.Cookie.HttpOnly = true;
    // Fly's proxy ends HTTPS and talks plain HTTP to the app, so the default, SameAsRequest,
    // would leave Secure off in production. Always sets it whatever the request came in as.
    // Chrome and Firefox still take a Secure cookie from http://localhost (ng serve, C1).
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    // The browser leaves it out of requests another site starts. A site is the whole domain,
    // cseljehaug.no, so a page on cseljehaug.no or another of its subdomains still gets it sent
    // along: this is one layer against CSRF, not all of it.
    options.Cookie.SameSite = SameSiteMode.Strict;
    // 60 days, sliding: a request in the second half renews it, so it only runs out after 30–60
    // days without the app being opened.
    options.ExpireTimeSpan = TimeSpan.FromDays(60);
    options.SlidingExpiration = true;
    // Identity sends a request that isn't logged in to /Account/Login and one that isn't allowed
    // to /Account/AccessDenied – a redirect Angular would follow to index.html and get a 200. An
    // API answers with the status code instead; Angular shows its login page on a 401 (C2).
    // Set on the Events Identity already made, not a new CookieAuthenticationEvents: Identity has
    // put its security stamp check there, which logs every device out within 30 minutes of a
    // password change.
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

// The keys that encrypt and sign the cookie. By default they are files inside the container,
// and every deploy starts a new container with new keys – everyone would be logged out. In the
// database they survive deploys. They are stored unencrypted, which the app logs a warning about
// when it makes a key (every 90 days): whoever can read the database could make a cookie, but
// could read and change the shows directly anyway.
builder.Services.AddDataProtection()
    .PersistKeysToDbContext<WatchTrackerDbContext>()
    // A cookie can only be read by an app with the same name. The default name is the folder the
    // app runs from, so a new WORKDIR in the Dockerfile would quietly log everyone out.
    .SetApplicationName("WatchTracker");

// The API's JSON leaves out null properties rather than sending "service": null, so an empty
// optional field is missing, as in Angular's models (service?: …) and in localStorage.
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull);

// The health check Fly calls (D75). No checks are registered, so /healthz answers 200
// "Healthy" as long as the app serves requests. Never add a database check: Neon sleeps when
// idle, and a slow wake-up would make Fly stop sending traffic to the whole app.
builder.Services.AddHealthChecks();

// One log line per request with the method, path, status and duration, and nothing else
// (D75): headers and bodies are where cookies and passwords travel. appsettings.json lets
// the middleware's category through, since the template keeps Microsoft.AspNetCore at Warning.
builder.Services.AddHttpLogging(options =>
{
    options.LoggingFields = HttpLoggingFields.RequestMethod
        | HttpLoggingFields.RequestPath
        | HttpLoggingFields.ResponseStatusCode
        | HttpLoggingFields.Duration;
    options.CombineLogs = true;
});

// Angular's files are sent compressed, as nginx did in v1: main.js is about half the size on
// the first load. ASP.NET Core leaves compression off for HTTPS by default because of an attack
// called BREACH: in a response that holds a secret (a token) beside text an attacker chooses,
// a guess that matches the secret compresses better, and TLS hides the content but not the
// size. Angular's files are the same for everyone and hold no secrets, so only their types are
// compressed, over HTTPS too; the API's JSON is never compressed. Fly's proxy speaks plain HTTP
// to the app today, but EnableForHttps keeps this working if the app ever sees HTTPS.
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.MimeTypes = ["text/html", "text/css", "text/javascript"];
});

var app = builder.Build();

// Brings the database up to the latest migration before the app takes requests (D68), and
// in Development seeds an empty one.
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<WatchTrackerDbContext>().Database.Migrate();
}

app.UseResponseCompression();

// The Angular build in wwwroot (Dockerfile v2, D71). Before the logging: a request for a file
// that exists – the JS, CSS and fonts – is answered here and goes no further, so it gets no log
// line. index.html names the bundles by their hash (main-XXXXXXXX.js), so after a deploy the
// browser must ask for a fresh copy; an old one points at bundles that are gone.
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

// Reads the cookie into the request's user, then lets endpoints that require a login turn the
// rest away with a 401. After the logging, so those requests get a log line too.
app.UseAuthentication();
app.UseAuthorization();

// Not logged: Fly calls it every 30 seconds.
app.MapHealthChecks("/healthz").WithHttpLogging(HttpLoggingFields.None);
app.MapShowEndpoints();

// The fallbacks answer only paths that none of the endpoints above has. An unknown /api path is
// a 404, not index.html, so a wrong URL in Angular fails as an error instead of "succeeding"
// with a page of HTML.
app.MapFallback("/api/{**path}", () => Results.NotFound());
// Any other path that isn't a file is one of Angular's routes (/shows/add, /shows/1/edit): send
// index.html, and Angular's router picks the page from the URL in the browser.
app.MapFallbackToFile("index.html", angularFiles);

app.Run();
