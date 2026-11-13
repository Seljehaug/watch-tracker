using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using WatchTracker.Api.Shows;
using WatchTracker.Api.Users;

namespace WatchTracker.Api.Data;

// IdentityUserContext adds Identity's user tables (AspNetUsers and three side tables), without
// roles. DataProtectionKeys holds the keys that encrypt the login cookie (see Program.cs).
public class WatchTrackerDbContext(DbContextOptions<WatchTrackerDbContext> options)
    : IdentityUserContext<User>(options), IDataProtectionKeyContext
{
    public DbSet<Show> Shows => Set<Show>();

    public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();
}
