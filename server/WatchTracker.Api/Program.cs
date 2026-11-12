using System.Text.Json.Serialization;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using WatchTracker.Api.Data;
using WatchTracker.Api.Shows;

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
