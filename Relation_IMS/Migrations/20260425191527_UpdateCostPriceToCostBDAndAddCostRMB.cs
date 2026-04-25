using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Relation_IMS.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCostPriceToCostBDAndAddCostRMB : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "CostPrice",
                table: "Products",
                newName: "CostBD");

            migrationBuilder.RenameColumn(
                name: "CostPrice",
                table: "OrderItems",
                newName: "CostBD");

            migrationBuilder.AddColumn<decimal>(
                name: "CostRMB",
                table: "Products",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CostRMB",
                table: "OrderItems",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$PyhM70nHYFYPMYf0RHs1SeKP/S3sfIkV3izbUI.u7Tj7x6Pmz15y2");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CostRMB",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "CostRMB",
                table: "OrderItems");

            migrationBuilder.RenameColumn(
                name: "CostBD",
                table: "Products",
                newName: "CostPrice");

            migrationBuilder.RenameColumn(
                name: "CostBD",
                table: "OrderItems",
                newName: "CostPrice");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$zlYgHoXQ2hE5kJpid3c6wO3.jk2kIcwsm9L3aQx4LszxvW4OwBoES");
        }
    }
}
