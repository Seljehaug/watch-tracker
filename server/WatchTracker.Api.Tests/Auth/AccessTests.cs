using System.Net;
using Microsoft.AspNetCore.Hosting;

namespace WatchTracker.Api.Tests.Auth;

// What needs a login, and where changes may come from (both set up in Program.cs).
public class AccessTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    // /api/shows doesn't ask for a login itself, but still requires one: the default in
    // Program.cs.
    [Fact]
    public async Task AnApiEndpoint_WithoutALogin_Is401()
    {
        var response = await factory.CreateClient().GetAsync("/api/shows", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Null(response.Headers.Location);
    }

    // Angular's pages must stay open, or a user who isn't logged in never reaches the login page.
    [Fact]
    public async Task AngularsPages_OpenWithoutALogin()
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        // The tests have no Angular build, so this test makes a tiny one.
        var webRoot = Directory.CreateTempSubdirectory("watch-tracker-wwwroot-");
        try
        {
            await File.WriteAllTextAsync(Path.Combine(webRoot.FullName, "index.html"), "<app-root></app-root>", cancellationToken);
            await using var withAngular = factory.WithWebHostBuilder(builder => builder.UseWebRoot(webRoot.FullName));

            var response = await withAngular.CreateClient().GetAsync("/shows/add", cancellationToken);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal("<app-root></app-root>", await response.Content.ReadAsStringAsync(cancellationToken));
        }
        finally
        {
            webRoot.Delete(recursive: true);
        }
    }

    // A page on another subdomain (same-site) or another site (cross-site) can't make changes;
    // here, log out.
    [Theory]
    [InlineData("same-site")]
    [InlineData("cross-site")]
    public async Task AChange_FromAnotherPage_Is403(string secFetchSite)
    {
        var cancellationToken = TestContext.Current.CancellationToken;
        var client = await factory.CreateLoggedInClientAsync();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout");
        request.Headers.Add("Sec-Fetch-Site", secFetchSite);

        var response = await client.SendAsync(request, cancellationToken);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        var currentUser = await client.GetAsync("/api/auth/user", cancellationToken);
        Assert.Equal(HttpStatusCode.OK, currentUser.StatusCode);
    }

    // Angular's own calls are same-origin and go through.
    [Fact]
    public async Task AChange_FromTheAppItself_GoesThrough()
    {
        var client = await factory.CreateLoggedInClientAsync();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout");
        request.Headers.Add("Sec-Fetch-Site", "same-origin");

        var response = await client.SendAsync(request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    // Only changes are stopped: a link to the app from another site still opens it.
    [Fact]
    public async Task AReadFromAnotherSite_GoesThrough()
    {
        var client = await factory.CreateLoggedInClientAsync();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/auth/user");
        request.Headers.Add("Sec-Fetch-Site", "cross-site");

        var response = await client.SendAsync(request, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
