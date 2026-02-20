using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IQuarterRepository
    {
        Task<List<Quarter>> GetAllQuartersAsync();
        Task<Quarter?> GetQuarterByIdAsync(int id);
        Task<Quarter> CreateQuarterAsync(CreateQuarterDTO quarterDto);
        Task<Quarter?> UpdateQuarterByIdAsync(int id, UpdateQuarterDTO quarterDto);
        Task<Quarter?> DeleteQuarterByIdAsync(int id);
    }
}
