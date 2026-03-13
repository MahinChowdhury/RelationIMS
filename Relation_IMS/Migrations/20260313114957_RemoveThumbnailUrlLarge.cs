using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Relation_IMS.Migrations
{
    /// <inheritdoc />
    public partial class RemoveThumbnailUrlLarge : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ThumbnailUrlLarge",
                table: "Products");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ThumbnailUrlLarge",
                table: "Products",
                type: "text",
                nullable: true);
        }
    }
}
