using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Relation_IMS.Migrations
{
    /// <inheritdoc />
    public partial class Mig2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "InventoryTransferRecordId",
                table: "ProductItems",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "InventoryTransferRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SourceInventoryId = table.Column<int>(type: "integer", nullable: false),
                    DestinationInventoryId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    DateTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryTransferRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InventoryTransferRecords_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductItems_InventoryTransferRecordId",
                table: "ProductItems",
                column: "InventoryTransferRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransferRecords_UserId",
                table: "InventoryTransferRecords",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductItems_InventoryTransferRecords_InventoryTransferReco~",
                table: "ProductItems",
                column: "InventoryTransferRecordId",
                principalTable: "InventoryTransferRecords",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductItems_InventoryTransferRecords_InventoryTransferReco~",
                table: "ProductItems");

            migrationBuilder.DropTable(
                name: "InventoryTransferRecords");

            migrationBuilder.DropIndex(
                name: "IX_ProductItems_InventoryTransferRecordId",
                table: "ProductItems");

            migrationBuilder.DropColumn(
                name: "InventoryTransferRecordId",
                table: "ProductItems");
        }
    }
}
