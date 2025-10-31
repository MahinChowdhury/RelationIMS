using Relation_IMS.Dtos.CustomerDtos;
using Relation_IMS.Models.CustomerModels;

namespace Relation_IMS.Datas.Interfaces
{
    public interface ICustomerRepository
    {
        Task<List<Customer>> GetAllCustomersAsync();
        Task<Customer?> GetCustomerByIdAsync(int id);
        Task<Customer?> DeleteCustomerByIdAsync(int id);
        Task<Customer?> CreateNewCustomerAsync(CreateCustomerDTO customerDto);
        Task<Customer?> UpdateCustomerByIdAsync(int id, UpdateCustomerDTO updateDto);
    }
}
