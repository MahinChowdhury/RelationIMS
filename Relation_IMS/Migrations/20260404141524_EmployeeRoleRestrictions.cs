using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Relation_IMS.Migrations
{
    /// <inheritdoc />
    public partial class EmployeeRoleRestrictions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ShopNo",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ShopNo",
                table: "Orders",
                type: "integer",
                nullable: true);

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Email", "Firstname", "IsActive", "Lastname", "PasswordHash", "PhoneNumber", "PreferredLanguage", "PreferredTheme", "ShopNo" },
                values: new object[] { 1, "mahin@relationims.com", "Mahin Rashid", true, null, "$2a$11$lqUR/lLUd0Fj5GkJW19MuuuKBIYcB4g7Z2HubaVNvG.K4lUl2mJ5m", "01521583700", "en", "light", 0 });

            migrationBuilder.InsertData(
                table: "UserRoles",
                columns: new[] { "RoleId", "UserId", "Id" },
                values: new object[] { 4, 1, 0 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "UserRoles",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { 4, 1 });

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DropColumn(
                name: "ShopNo",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ShopNo",
                table: "Orders");
        }
    }
}
