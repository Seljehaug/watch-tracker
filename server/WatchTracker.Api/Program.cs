using Microsoft.AspNetCore.HttpLogging;

var builder = WebApplication.CreateBuilder(args);

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

app.UseHttpLogging();

app.MapGet("/", () => "Hello World!");
// Not logged: Fly calls it every 30 seconds.
app.MapHealthChecks("/healthz").WithHttpLogging(HttpLoggingFields.None);

app.Run();
