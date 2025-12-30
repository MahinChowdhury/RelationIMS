using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Relation_IMS.Migrations
{
    /// <inheritdoc />
    public partial class Mig3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductItems_InventoryTransferRecords_InventoryTransferReco~",
                table: "ProductItems");

            migrationBuilder.DropIndex(
                name: "IX_ProductItems_InventoryTransferRecordId",
                table: "ProductItems");

            migrationBuilder.DropColumn(
                name: "InventoryTransferRecordId",
                table: "ProductItems");

            migrationBuilder.CreateTable(
                name: "InventoryTransferRecordItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    InventoryTransferRecordId = table.Column<int>(type: "integer", nullable: false),
                    ProductItemId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InventoryTransferRecordItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InventoryTransferRecordItems_InventoryTransferRecords_Inven~",
                        column: x => x.InventoryTransferRecordId,
                        principalTable: "InventoryTransferRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_InventoryTransferRecordItems_ProductItems_ProductItemId",
                        column: x => x.ProductItemId,
                        principalTable: "ProductItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransferRecords_DestinationInventoryId",
                table: "InventoryTransferRecords",
                column: "DestinationInventoryId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransferRecords_SourceInventoryId",
                table: "InventoryTransferRecords",
                column: "SourceInventoryId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransferRecordItems_InventoryTransferRecordId",
                table: "InventoryTransferRecordItems",
                column: "InventoryTransferRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransferRecordItems_ProductItemId",
                table: "InventoryTransferRecordItems",
                column: "ProductItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryTransferRecords_Inventories_DestinationInventoryId",
                table: "InventoryTransferRecords",
                column: "DestinationInventoryId",
                principalTable: "Inventories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_InventoryTransferRecords_Inventories_SourceInventoryId",
                table: "InventoryTransferRecords",
                column: "SourceInventoryId",
                principalTable: "Inventories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InventoryTransferRecords_Inventories_DestinationInventoryId",
                table: "InventoryTransferRecords");

            migrationBuilder.DropForeignKey(
                name: "FK_InventoryTransferRecords_Inventories_SourceInventoryId",
                table: "InventoryTransferRecords");

            migrationBuilder.DropTable(
                name: "InventoryTransferRecordItems");

            migrationBuilder.DropIndex(
                name: "IX_InventoryTransferRecords_DestinationInventoryId",
                table: "InventoryTransferRecords");

            migrationBuilder.DropIndex(
                name: "IX_InventoryTransferRecords_SourceInventoryId",
                table: "InventoryTransferRecords");

            migrationBuilder.AddColumn<int>(
                name: "InventoryTransferRecordId",
                table: "ProductItems",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductItems_InventoryTransferRecordId",
                table: "ProductItems",
                column: "InventoryTransferRecordId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductItems_InventoryTransferRecords_InventoryTransferReco~",
                table: "ProductItems",
                column: "InventoryTransferRecordId",
                principalTable: "InventoryTransferRecords",
                principalColumn: "Id");
        }
    }
}
