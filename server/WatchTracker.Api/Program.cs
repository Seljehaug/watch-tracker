using System.Text.Json.Serialization;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.EntityFrameworkCore;
using WatchTracker.Api.Data;
using WatchTracker.Api.Shows;

var builder = WebApplication.CreateBuilder(args);

// Postgres: Compose's db in Development (appsettings.Development.json), Neon in production,
// where a Fly secret sets it as the environment variable ConnectionStrings__Default (D74).
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default is not set.");
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

var app = builder.Build();

// Brings the database up to the latest migration before the app takes requests (D68), and
// in Development seeds an empty one.
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<WatchTrackerDbContext>().Database.Migrate();
}

app.UseHttpLogging();

app.MapGet("/", () => "Hello World!");
// Not logged: Fly calls it every 30 seconds.
app.MapHealthChecks("/healthz").WithHttpLogging(HttpLoggingFields.None);
app.MapShowEndpoints();

app.Run();
