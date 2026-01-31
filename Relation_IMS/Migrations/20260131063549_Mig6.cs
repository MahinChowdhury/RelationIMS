using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Relation_IMS.Migrations
{
    /// <inheritdoc />
    public partial class Mig6 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OrderId",
                table: "CustomerReturnRecords",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CustomerReturnRecords_OrderId",
                table: "CustomerReturnRecords",
                column: "OrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_CustomerReturnRecords_Orders_OrderId",
                table: "CustomerReturnRecords",
                column: "OrderId",
                principalTable: "Orders",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CustomerReturnRecords_Orders_OrderId",
                table: "CustomerReturnRecords");

            migrationBuilder.DropIndex(
                name: "IX_CustomerReturnRecords_OrderId",
                table: "CustomerReturnRecords");

            migrationBuilder.DropColumn(
                name: "OrderId",
                table: "CustomerReturnRecords");
        }
    }
}
