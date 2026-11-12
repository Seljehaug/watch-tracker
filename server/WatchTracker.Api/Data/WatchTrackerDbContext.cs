using Microsoft.EntityFrameworkCore;
using WatchTracker.Api.Shows;

namespace WatchTracker.Api.Data;

public class WatchTrackerDbContext(DbContextOptions<WatchTrackerDbContext> options) : DbContext(options)
{
    public DbSet<Show> Shows => Set<Show>();
}
