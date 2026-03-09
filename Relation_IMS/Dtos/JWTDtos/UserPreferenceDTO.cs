namespace Relation_IMS.Dtos.JWTDtos
{
    public class UserPreferenceDTO
    {
        public string PreferredLanguage { get; set; } = "en";
        public string PreferredTheme { get; set; } = "light";
    }

    public class UserInfoDTO
    {
        public int Id { get; set; }
        public string Firstname { get; set; } = null!;
        public string? Lastname { get; set; }
        public string Email { get; set; } = null!;
        public string PhoneNumber { get; set; } = null!;
        public string PreferredLanguage { get; set; } = "en";
        public string PreferredTheme { get; set; } = "light";
        public List<string> Roles { get; set; } = new();
    }
}
