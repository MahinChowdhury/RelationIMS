using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Relation_IMS.Migrations
{
    /// <inheritdoc />
    public partial class ThumbnailOnProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ThumbnailUrl",
                table: "Products",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ThumbnailUrl",
                table: "Products");
        }
    }
}
