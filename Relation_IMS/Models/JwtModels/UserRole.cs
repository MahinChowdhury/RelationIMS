namespace Relation_IMS.Models.JWTModels
{
    public class UserRole
    {

        public int Id { get; set; }
        // Foreign key referencing User.
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        // Foreign key referencing Role.
        public int RoleId { get; set; }
        public Role Role { get; set; } = null!;
    }
}
