using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.CustomerDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.CustomerModels;

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

        public async Task<List<Customer>> GetAllCustomersAsync()
        {
            var customers = await _context.Customers.ToListAsync();

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
            customer.Email = updateDto.Email;
            customer.Phone = updateDto.Phone;
            customer.Address = updateDto.Address;

            await _context.SaveChangesAsync();

            return customer;
        }
    }
}
