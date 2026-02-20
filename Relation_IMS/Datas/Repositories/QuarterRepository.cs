using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Datas.Repositories
{
    public class QuarterRepository : IQuarterRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public QuarterRepository(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Quarter> CreateQuarterAsync(CreateQuarterDTO quarterDto)
        {
            var quarter = _mapper.Map<Quarter>(quarterDto);
            await _context.Quarters.AddAsync(quarter);
            await _context.SaveChangesAsync();
            return quarter;
        }

        public async Task<Quarter?> DeleteQuarterByIdAsync(int id)
        {
            var quarter = await _context.Quarters.FirstOrDefaultAsync(q => q.Id == id);
            if (quarter == null) return null;

            _context.Quarters.Remove(quarter);
            await _context.SaveChangesAsync();
            return quarter;
        }

        public async Task<List<Quarter>> GetAllQuartersAsync()
        {
            return await _context.Quarters.ToListAsync();
        }

        public async Task<Quarter?> GetQuarterByIdAsync(int id)
        {
            return await _context.Quarters.FirstOrDefaultAsync(q => q.Id == id);
        }

        public async Task<Quarter?> UpdateQuarterByIdAsync(int id, UpdateQuarterDTO quarterDto)
        {
            var quarter = await _context.Quarters.FirstOrDefaultAsync(q => q.Id == id);
            if (quarter == null) return null;

            quarter.Name = quarterDto.Name;
            await _context.SaveChangesAsync();
            return quarter;
        }
    }
}
