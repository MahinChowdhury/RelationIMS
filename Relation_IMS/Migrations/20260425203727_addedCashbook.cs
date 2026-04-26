using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Relation_IMS.Migrations
{
    /// <inheritdoc />
    public partial class addedCashbook : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CashTransfers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FromShopNo = table.Column<int>(type: "integer", nullable: false),
                    ToShopNo = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    TransferDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<int>(type: "integer", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CashTransfers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CashTransfers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CashBookEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ShopNo = table.Column<int>(type: "integer", nullable: false),
                    ReferenceNo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    EntryType = table.Column<string>(type: "text", nullable: false),
                    TransactionType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CashIn = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    CashOut = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    RunningBalance = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    OrderPaymentId = table.Column<int>(type: "integer", nullable: true),
                    OrderId = table.Column<int>(type: "integer", nullable: true),
                    CashTransferId = table.Column<int>(type: "integer", nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    TransactionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<int>(type: "integer", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedBy = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CashBookEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CashBookEntries_CashTransfers_CashTransferId",
                        column: x => x.CashTransferId,
                        principalTable: "CashTransfers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CashBookEntries_OrderPayments_OrderPaymentId",
                        column: x => x.OrderPaymentId,
                        principalTable: "OrderPayments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_CashBookEntries_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$TQ0bA62lLsYE9tXx.k4dDOmR3kin3U5g6aFvxU9z3me866e5iVR.e");

            migrationBuilder.CreateIndex(
                name: "IX_CashBookEntries_CashTransferId",
                table: "CashBookEntries",
                column: "CashTransferId");

            migrationBuilder.CreateIndex(
                name: "IX_CashBookEntries_CreatedAt",
                table: "CashBookEntries",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CashBookEntries_EntryType",
                table: "CashBookEntries",
                column: "EntryType");

            migrationBuilder.CreateIndex(
                name: "IX_CashBookEntries_OrderPaymentId",
                table: "CashBookEntries",
                column: "OrderPaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_CashBookEntries_ReferenceNo",
                table: "CashBookEntries",
                column: "ReferenceNo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CashBookEntries_ShopNo",
                table: "CashBookEntries",
                column: "ShopNo");

            migrationBuilder.CreateIndex(
                name: "IX_CashBookEntries_TransactionDate",
                table: "CashBookEntries",
                column: "TransactionDate");

            migrationBuilder.CreateIndex(
                name: "IX_CashBookEntries_UserId",
                table: "CashBookEntries",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CashTransfers_CreatedAt",
                table: "CashTransfers",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CashTransfers_FromShopNo",
                table: "CashTransfers",
                column: "FromShopNo");

            migrationBuilder.CreateIndex(
                name: "IX_CashTransfers_ToShopNo",
                table: "CashTransfers",
                column: "ToShopNo");

            migrationBuilder.CreateIndex(
                name: "IX_CashTransfers_TransferDate",
                table: "CashTransfers",
                column: "TransferDate");

            migrationBuilder.CreateIndex(
                name: "IX_CashTransfers_UserId",
                table: "CashTransfers",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CashBookEntries");

            migrationBuilder.DropTable(
                name: "CashTransfers");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$PyhM70nHYFYPMYf0RHs1SeKP/S3sfIkV3izbUI.u7Tj7x6Pmz15y2");
        }
    }
}
