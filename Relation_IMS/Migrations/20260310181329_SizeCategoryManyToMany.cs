using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Relation_IMS.Migrations
{
    /// <inheritdoc />
    public partial class SizeCategoryManyToMany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "ProductSizes");

            migrationBuilder.CreateTable(
                name: "CategoryProductSize",
                columns: table => new
                {
                    CategoriesId = table.Column<int>(type: "integer", nullable: false),
                    SizesId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoryProductSize", x => new { x.CategoriesId, x.SizesId });
                    table.ForeignKey(
                        name: "FK_CategoryProductSize_Categories_CategoriesId",
                        column: x => x.CategoriesId,
                        principalTable: "Categories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CategoryProductSize_ProductSizes_SizesId",
                        column: x => x.SizesId,
                        principalTable: "ProductSizes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CategoryProductSize_SizesId",
                table: "CategoryProductSize",
                column: "SizesId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CategoryProductSize");

            migrationBuilder.AddColumn<int>(
                name: "CategoryId",
                table: "ProductSizes",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
