namespace Relation_IMS.Dtos.JWTDtos
{
    public class UserPreferenceDTO
    {
        public string PreferredLanguage { get; set; } = "en";
    }

    public class UserInfoDTO
    {
        public int Id { get; set; }
        public string Firstname { get; set; } = null!;
        public string? Lastname { get; set; }
        public string Email { get; set; } = null!;
        public string PreferredLanguage { get; set; } = "en";
        public List<string> Roles { get; set; } = new();
    }
}
