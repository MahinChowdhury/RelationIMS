using Relation_IMS.Dtos.UserProfileDtos;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IUserProfileRepository
    {
        Task<UserProfileDTO?> GetUserProfileAsync(int userId);
        Task<UserProfileDTO?> UpdateUserProfileAsync(int userId, UpdateUserProfileDTO updateDto);
        Task<List<SalaryRecordDTO>> GetSalaryRecordsAsync(int userId);
        Task<SalaryRecordDTO?> AddSalaryRecordAsync(int userId, CreateSalaryRecordDTO createDto);
        Task<bool> DeleteSalaryRecordAsync(int id);
        Task<(bool Success, string Message)> ChangePasswordAsync(int userId, ChangePasswordDTO dto);
    }
}
