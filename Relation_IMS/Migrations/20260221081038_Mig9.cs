using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Relation_IMS.Migrations
{
    /// <inheritdoc />
    public partial class Mig9 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Products_Quarters_QuarterId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_QuarterId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "QuarterId",
                table: "Products");

            migrationBuilder.CreateTable(
                name: "ProductQuarter",
                columns: table => new
                {
                    ProductsId = table.Column<int>(type: "integer", nullable: false),
                    QuartersId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductQuarter", x => new { x.ProductsId, x.QuartersId });
                    table.ForeignKey(
                        name: "FK_ProductQuarter_Products_ProductsId",
                        column: x => x.ProductsId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductQuarter_Quarters_QuartersId",
                        column: x => x.QuartersId,
                        principalTable: "Quarters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProductQuarter_QuartersId",
                table: "ProductQuarter",
                column: "QuartersId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProductQuarter");

            migrationBuilder.AddColumn<int>(
                name: "QuarterId",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Products_QuarterId",
                table: "Products",
                column: "QuarterId");

            migrationBuilder.AddForeignKey(
                name: "FK_Products_Quarters_QuarterId",
                table: "Products",
                column: "QuarterId",
                principalTable: "Quarters",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
