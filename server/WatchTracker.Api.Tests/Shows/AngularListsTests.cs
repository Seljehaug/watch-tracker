using System.ComponentModel.DataAnnotations;
using System.Reflection;
using System.Text.RegularExpressions;
using WatchTracker.Api.Shows;

namespace WatchTracker.Api.Tests.Shows;

// Angular and the API each have the list of statuses and the list of streaming services (D31,
// D63). These tests read Angular's files – copied next to the tests by the .csproj – and fail
// when the lists differ, so an id added on one side only shows up in CI, not as a 400 when the
// app saves a show.
public class AngularListsTests
{
    [Fact]
    public void TheApi_AllowsAngularsStatuses() =>
        AssertSameIds(AngularIds("show-status.ts"), AllowedValues(nameof(ShowPostModel.Status)));

    [Fact]
    public void TheApi_AllowsAngularsStreamingServices() =>
        // null is the API's "no service"; Angular leaves the field out instead.
        AssertSameIds(AngularIds("streaming-service.ts"), AllowedValues(nameof(ShowPostModel.Service)).OfType<string>());

    // The ids in an Angular list file: every `id: '…'`, as in { id: 'netflix', label: 'Netflix' }.
    private static List<string> AngularIds(string fileName)
    {
        var source = File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "Angular", fileName));
        return Regex.Matches(source, "id: '([^']+)'").Select(match => match.Groups[1].Value).ToList();
    }

    // What the API's validation lets through: the AllowedValues on a parameter of ShowPostModel.
    private static List<string?> AllowedValues(string parameterName)
    {
        var parameter = typeof(ShowPostModel).GetConstructors().Single().GetParameters().Single(p => p.Name == parameterName);
        return parameter.GetCustomAttribute<AllowedValuesAttribute>()!.Values.Cast<string?>().ToList();
    }

    // The order doesn't matter, only that each id is on both sides. If the file's format changes
    // and no ids are found, every id of the API's shows up as missing.
    private static void AssertSameIds(IEnumerable<string> angular, IEnumerable<string?> api)
    {
        var onlyInAngular = angular.Except(api).ToList();
        var onlyInTheApi = api.Except(angular).ToList();
        Assert.True(
            onlyInAngular.Count == 0 && onlyInTheApi.Count == 0,
            $"Only in Angular: [{string.Join(", ", onlyInAngular)}]. Only in the API: [{string.Join(", ", onlyInTheApi)}].");
    }
}
