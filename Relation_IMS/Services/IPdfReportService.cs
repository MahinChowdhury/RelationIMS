using System;
using System.Threading.Tasks;

namespace Relation_IMS.Services
{
    public interface IPdfReportService
    {
        Task<byte[]> GenerateDashboardReportAsync(DateTime date);
    }
}
