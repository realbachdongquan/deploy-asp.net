using System.Threading.Tasks;

namespace ConnectDB.Services
{
    public interface IAuditService
    {
        Task LogActionAsync(string action, string targetTable, string targetId);
    }
}
