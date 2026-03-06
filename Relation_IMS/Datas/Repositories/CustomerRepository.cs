using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.CustomerDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.CustomerModels;
using Relation_IMS.Models.ProductModels;
using Relation_IMS.Models.OrderModels;

namespace Relation_IMS.Datas.Repositories
{
    public class CustomerRepository : ICustomerRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        public CustomerRepository(ApplicationDbContext context,IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Customer?> CreateNewCustomerAsync(CreateCustomerDTO customerDto)
        {
            var customer = _mapper.Map<Customer>(customerDto);
            await _context.Customers.AddAsync(customer);
            await _context.SaveChangesAsync();
            return customer;
        }

        public async Task<Customer?> DeleteCustomerByIdAsync(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return null;

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();

            return customer;
        }

        public async Task<List<Customer>> GetAllCustomersAsync(string? search, string? sortBy, int pageNumber = 1, int pageSize = 20)
        {
            var query = _context.Customers.AsQueryable();
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p => p.Name.ToLower().Contains(search.ToLower()) || p.Phone.Contains(search));

            }


            var customers = await query
                .OrderByDescending(c => c.Id)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Include(o => o.Orders)
                .ToListAsync();

            return customers;
        }

        public async Task<Customer?> GetCustomerByIdAsync(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return null;

            return customer;
        }

        public async Task<Customer?> UpdateCustomerByIdAsync(int id, UpdateCustomerDTO updateDto)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return null;

            customer.Name = updateDto.Name;
            customer.Phone = updateDto.Phone;
            customer.Address = updateDto.Address;
            customer.ShopAddress = updateDto.ShopAddress;
            customer.ShopName = updateDto.ShopName;
            customer.IsDueAllowed = updateDto.IsDueAllowed;
            customer.NidNumber = updateDto.NidNumber;
            customer.ReferenceName = updateDto.ReferenceName;
            customer.ReferencePhoneNumber = updateDto.ReferencePhoneNumber;

            await _context.SaveChangesAsync();

            return customer;
        }

        public async Task<CustomerStatsDTO?> GetCustomerStatsAsync(int id)
        {
            var customerExists = await _context.Customers.AnyAsync(c => c.Id == id);
            if (!customerExists) return null;

            var orders = await _context.Orders
                .Where(o => o.CustomerId == id)
                .Select(o => new { o.NetAmount, o.PaidAmount, o.PaymentStatus, o.CreatedAt })
                .ToListAsync();

            var stats = new CustomerStatsDTO
            {
                TotalPurchases = orders.Sum(o => o.NetAmount),
                TotalDue = orders.Sum(o => o.NetAmount - (o.PaidAmount == 0 && (int)o.PaymentStatus == 2 ? o.NetAmount : o.PaidAmount)),
                LastOrderDate = orders.Any() ? orders.Max(o => o.CreatedAt) : null
            };

            return stats;
        }
    }
}
