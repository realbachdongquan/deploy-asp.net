using ConnectDB.Data;
using ConnectDB.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Moq;

namespace Cinema.Tests;

public abstract class TestBase : IDisposable
{
    protected readonly AppDbContext Context;
    protected readonly Mock<IMemoryCache> MockCache;
    protected readonly Mock<IHubContext<ShowtimeHub>> MockHubContext;
    protected readonly Mock<IHubClients> MockHubClients;
    protected readonly Mock<IGroupManager> MockGroups;

    protected TestBase()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        // Note: AppDbContext in the new project might have a slightly different constructor
        // But since I copied the old one, it should still need IHttpContextAccessor
        var mockHttpAccessor = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();

        Context = new AppDbContext(options, mockHttpAccessor.Object);
        Context.Database.EnsureCreated();

        MockCache = new Mock<IMemoryCache>();
        
        MockHubContext = new Mock<IHubContext<ShowtimeHub>>();
        MockHubClients = new Mock<IHubClients>();
        MockGroups = new Mock<IGroupManager>();

        MockHubContext.Setup(h => h.Clients).Returns(MockHubClients.Object);
        MockHubContext.Setup(h => h.Groups).Returns(MockGroups.Object);
        
        MockHubClients.Setup(c => c.Group(It.IsAny<string>())).Returns(new Mock<IClientProxy>().As<ISingleClientProxy>().Object);
    }

    public void Dispose()
    {
        Context.Database.EnsureDeleted();
        Context.Dispose();
    }
}
