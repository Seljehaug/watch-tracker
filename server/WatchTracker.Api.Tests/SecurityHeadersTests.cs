using Microsoft.AspNetCore.Hosting;

namespace WatchTracker.Api.Tests;

public class SecurityHeadersTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    // Angular's files are answered before every other step in Program.cs, so if they have the
    // security headers, the middleware comes early enough for every response.
    [Fact]
    public async Task AngularsFiles_HaveTheSecurityHeaders()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        // The tests have no Angular build, so this test makes a tiny one.
        var webRoot = Directory.CreateTempSubdirectory("watch-tracker-wwwroot-");
        try
        {
            await File.WriteAllTextAsync(Path.Combine(webRoot.FullName, "main.js"), "console.log('main');", cancellationToken);
            await using var withAngular = factory.WithWebHostBuilder(builder => builder.UseWebRoot(webRoot.FullName));

            var response = await withAngular.CreateClient().GetAsync("/main.js", cancellationToken);

            response.EnsureSuccessStatusCode();
            Assert.Equal("max-age=31536000", Assert.Single(response.Headers.GetValues("Strict-Transport-Security")));
            Assert.Equal("nosniff", Assert.Single(response.Headers.GetValues("X-Content-Type-Options")));
            Assert.Equal("frame-ancestors 'none'", Assert.Single(response.Headers.GetValues("Content-Security-Policy")));
            Assert.Equal("DENY", Assert.Single(response.Headers.GetValues("X-Frame-Options")));
        }
        finally
        {
            webRoot.Delete(recursive: true);
        }
    }
}
