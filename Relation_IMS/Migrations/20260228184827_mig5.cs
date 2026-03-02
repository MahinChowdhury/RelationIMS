using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Relation_IMS.Migrations
{
    /// <inheritdoc />
    public partial class mig5 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SalaryRecords_UserId",
                table: "SalaryRecords");

            migrationBuilder.CreateIndex(
                name: "IX_SalaryRecords_UserId_Month_Year",
                table: "SalaryRecords",
                columns: new[] { "UserId", "Month", "Year" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SalaryRecords_UserId_Month_Year",
                table: "SalaryRecords");

            migrationBuilder.CreateIndex(
                name: "IX_SalaryRecords_UserId",
                table: "SalaryRecords",
                column: "UserId");
        }
    }
}
