using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Relation_IMS.Migrations
{
    /// <inheritdoc />
    public partial class Mig5 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Balance",
                table: "Customers",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "CustomerReturnRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CustomerId = table.Column<int>(type: "integer", nullable: false),
                    RefundAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    ReturnDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerReturnRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerReturnRecords_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CustomerReturnItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CustomerReturnRecordId = table.Column<int>(type: "integer", nullable: false),
                    ProductItemId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerReturnItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerReturnItems_CustomerReturnRecords_CustomerReturnRec~",
                        column: x => x.CustomerReturnRecordId,
                        principalTable: "CustomerReturnRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CustomerReturnItems_ProductItems_ProductItemId",
                        column: x => x.ProductItemId,
                        principalTable: "ProductItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerReturnItems_CustomerReturnRecordId",
                table: "CustomerReturnItems",
                column: "CustomerReturnRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerReturnItems_ProductItemId",
                table: "CustomerReturnItems",
                column: "ProductItemId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerReturnRecords_CustomerId",
                table: "CustomerReturnRecords",
                column: "CustomerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CustomerReturnItems");

            migrationBuilder.DropTable(
                name: "CustomerReturnRecords");

            migrationBuilder.DropColumn(
                name: "Balance",
                table: "Customers");
        }
    }
}
