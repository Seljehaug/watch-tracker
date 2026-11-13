using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using WatchTracker.Api.Shows;
using WatchTracker.Api.Users;

namespace WatchTracker.Api.Data;

// IdentityUserContext adds Identity's user tables (AspNetUsers and its claims, logins and tokens)
// without the role tables IdentityDbContext would bring – the app has no roles. The Data
// Protection keys that sign the login cookie live here too (Program.cs), so they survive deploys.
public class WatchTrackerDbContext(DbContextOptions<WatchTrackerDbContext> options)
    : IdentityUserContext<User>(options), IDataProtectionKeyContext
{
    public DbSet<Show> Shows => Set<Show>();

    public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();
}
