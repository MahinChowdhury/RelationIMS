using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.UserProfileDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.UserProfileModels;

namespace Relation_IMS.Datas.Repositories
{
    public class UserProfileRepository : IUserProfileRepository
    {
        private readonly ApplicationDbContext _context;

        public UserProfileRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<UserProfileDTO?> GetUserProfileAsync(int userId)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Include(u => u.UserProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return null;

            var profile = user.UserProfile;

            return new UserProfileDTO
            {
                Id = user.Id,
                Firstname = user.Firstname,
                Lastname = user.Lastname,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                IsActive = user.IsActive,
                PreferredLanguage = user.PreferredLanguage,
                Role = user.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? "",
                Address = profile?.Address,
                CurrentSalary = profile?.CurrentSalary ?? 0,
                JoinDate = profile?.JoinDate ?? DateTime.UtcNow
            };
        }

        public async Task<UserProfileDTO?> UpdateUserProfileAsync(int userId, UpdateUserProfileDTO updateDto)
        {
            var user = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Include(u => u.UserProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return null;

            // Update User entity fields (personal info)
            if (!string.IsNullOrWhiteSpace(updateDto.Firstname))
                user.Firstname = updateDto.Firstname;
            if (updateDto.Lastname != null)
                user.Lastname = updateDto.Lastname;
            if (!string.IsNullOrWhiteSpace(updateDto.Email))
                user.Email = updateDto.Email;
            if (!string.IsNullOrWhiteSpace(updateDto.PhoneNumber))
                user.PhoneNumber = updateDto.PhoneNumber;

            // Update UserProfile entity fields
            if (user.UserProfile == null)
            {
                user.UserProfile = new UserProfile
                {
                    UserId = userId,
                    Address = updateDto.Address,
                    CurrentSalary = updateDto.CurrentSalary,
                    JoinDate = DateTime.UtcNow
                };
                _context.UserProfiles.Add(user.UserProfile);
            }
            else
            {
                user.UserProfile.Address = updateDto.Address;
                user.UserProfile.CurrentSalary = updateDto.CurrentSalary;
            }

            await _context.SaveChangesAsync();

            return new UserProfileDTO
            {
                Id = user.Id,
                Firstname = user.Firstname,
                Lastname = user.Lastname,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                IsActive = user.IsActive,
                PreferredLanguage = user.PreferredLanguage,
                Role = user.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? "",
                Address = user.UserProfile.Address,
                CurrentSalary = user.UserProfile.CurrentSalary,
                JoinDate = user.UserProfile.JoinDate
            };
        }

        public async Task<List<SalaryRecordDTO>> GetSalaryRecordsAsync(int userId)
        {
            return await _context.SalaryRecords
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.Year)
                .ThenByDescending(s => s.Id)
                .Select(s => new SalaryRecordDTO
                {
                    Id = s.Id,
                    UserId = s.UserId,
                    Month = s.Month,
                    Year = s.Year,
                    Amount = s.Amount,
                    Status = s.Status,
                    PaidDate = s.PaidDate,
                    Notes = s.Notes,
                    CreatedAt = s.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<SalaryRecordDTO?> AddSalaryRecordAsync(int userId, CreateSalaryRecordDTO createDto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return null;

            var record = new SalaryRecord
            {
                UserId = userId,
                Month = createDto.Month,
                Year = createDto.Year,
                Amount = createDto.Amount,
                Status = "paid",
                PaidDate = DateTime.UtcNow,
                Notes = createDto.Notes
            };

            _context.SalaryRecords.Add(record);
            await _context.SaveChangesAsync();

            return new SalaryRecordDTO
            {
                Id = record.Id,
                UserId = record.UserId,
                Month = record.Month,
                Year = record.Year,
                Amount = record.Amount,
                Status = record.Status,
                PaidDate = record.PaidDate,
                Notes = record.Notes,
                CreatedAt = record.CreatedAt
            };
        }

        public async Task<bool> DeleteSalaryRecordAsync(int id)
        {
            var record = await _context.SalaryRecords.FindAsync(id);
            if (record == null) return false;

            _context.SalaryRecords.Remove(record);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(bool Success, string Message)> ChangePasswordAsync(int userId, ChangePasswordDTO dto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return (false, "User not found.");

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                return (false, "Current password is incorrect.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();

            return (true, "Password changed successfully.");
        }
    }
}
