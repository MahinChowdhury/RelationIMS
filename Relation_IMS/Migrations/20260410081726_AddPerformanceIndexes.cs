using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Relation_IMS.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$zlYgHoXQ2hE5kJpid3c6wO3.jk2kIcwsm9L3aQx4LszxvW4OwBoES");

            migrationBuilder.CreateIndex(
                name: "IX_Users_IsActive",
                table: "Users",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Users_ShopNo",
                table: "Users",
                column: "ShopNo");

            migrationBuilder.CreateIndex(
                name: "IX_UserProfiles_CreatedAt",
                table: "UserProfiles",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TopSellingProducts_CreatedAt",
                table: "TopSellingProducts",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TopSellingProducts_PeriodType",
                table: "TopSellingProducts",
                column: "PeriodType");

            migrationBuilder.CreateIndex(
                name: "IX_TopCustomers_CreatedAt",
                table: "TopCustomers",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TopCustomers_PeriodType",
                table: "TopCustomers",
                column: "PeriodType");

            migrationBuilder.CreateIndex(
                name: "IX_TodaySales_CreatedAt",
                table: "TodaySales",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_StaffPerformanceMonthlies_CreatedAt",
                table: "StaffPerformanceMonthlies",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ShareCatalogs_CreatedAt",
                table: "ShareCatalogs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SalesOverviews_CreatedAt",
                table: "SalesOverviews",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SalesOverviews_PeriodType",
                table: "SalesOverviews",
                column: "PeriodType");

            migrationBuilder.CreateIndex(
                name: "IX_SalaryRecords_CreatedAt",
                table: "SalaryRecords",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_RevenueByCategories_CreatedAt",
                table: "RevenueByCategories",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_RevenueByCategories_PeriodType",
                table: "RevenueByCategories",
                column: "PeriodType");

            migrationBuilder.CreateIndex(
                name: "IX_Quarters_CreatedAt",
                table: "Quarters",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ProductVariants_CreatedAt",
                table: "ProductVariants",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ProductSizes_CreatedAt",
                table: "ProductSizes",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Code",
                table: "Products",
                column: "Code");

            migrationBuilder.CreateIndex(
                name: "IX_Products_CreatedAt",
                table: "Products",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ProductLots_CreatedAt",
                table: "ProductLots",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ProductItems_Code",
                table: "ProductItems",
                column: "Code");

            migrationBuilder.CreateIndex(
                name: "IX_ProductItems_CreatedAt",
                table: "ProductItems",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ProductItems_IsDefected",
                table: "ProductItems",
                column: "IsDefected");

            migrationBuilder.CreateIndex(
                name: "IX_ProductItems_IsSold",
                table: "ProductItems",
                column: "IsSold");

            migrationBuilder.CreateIndex(
                name: "IX_ProductDefects_CreatedAt",
                table: "ProductDefects",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ProductColors_CreatedAt",
                table: "ProductColors",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CreatedAt",
                table: "Orders",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_InternalStatus",
                table: "Orders",
                column: "InternalStatus");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_NextPaymentDate",
                table: "Orders",
                column: "NextPaymentDate");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_PaymentStatus",
                table: "Orders",
                column: "PaymentStatus");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_ShopNo",
                table: "Orders",
                column: "ShopNo");

            migrationBuilder.CreateIndex(
                name: "IX_OrderPayments_CreatedAt",
                table: "OrderPayments",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_CreatedAt",
                table: "OrderItems",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryValues_CreatedAt",
                table: "InventoryValues",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransferRecords_CreatedAt",
                table: "InventoryTransferRecords",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_InventoryTransferRecordItems_CreatedAt",
                table: "InventoryTransferRecordItems",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Inventories_CreatedAt",
                table: "Inventories",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Customers_CreatedAt",
                table: "Customers",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerReturnRecords_CreatedAt",
                table: "CustomerReturnRecords",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerReturnItems_CreatedAt",
                table: "CustomerReturnItems",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerInsightsAllTime_CreatedAt",
                table: "CustomerInsightsAllTime",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerInsights_CreatedAt",
                table: "CustomerInsights",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_CreatedAt",
                table: "Categories",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Brands_CreatedAt",
                table: "Brands",
                column: "CreatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_IsActive",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_ShopNo",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_UserProfiles_CreatedAt",
                table: "UserProfiles");

            migrationBuilder.DropIndex(
                name: "IX_TopSellingProducts_CreatedAt",
                table: "TopSellingProducts");

            migrationBuilder.DropIndex(
                name: "IX_TopSellingProducts_PeriodType",
                table: "TopSellingProducts");

            migrationBuilder.DropIndex(
                name: "IX_TopCustomers_CreatedAt",
                table: "TopCustomers");

            migrationBuilder.DropIndex(
                name: "IX_TopCustomers_PeriodType",
                table: "TopCustomers");

            migrationBuilder.DropIndex(
                name: "IX_TodaySales_CreatedAt",
                table: "TodaySales");

            migrationBuilder.DropIndex(
                name: "IX_StaffPerformanceMonthlies_CreatedAt",
                table: "StaffPerformanceMonthlies");

            migrationBuilder.DropIndex(
                name: "IX_ShareCatalogs_CreatedAt",
                table: "ShareCatalogs");

            migrationBuilder.DropIndex(
                name: "IX_SalesOverviews_CreatedAt",
                table: "SalesOverviews");

            migrationBuilder.DropIndex(
                name: "IX_SalesOverviews_PeriodType",
                table: "SalesOverviews");

            migrationBuilder.DropIndex(
                name: "IX_SalaryRecords_CreatedAt",
                table: "SalaryRecords");

            migrationBuilder.DropIndex(
                name: "IX_RevenueByCategories_CreatedAt",
                table: "RevenueByCategories");

            migrationBuilder.DropIndex(
                name: "IX_RevenueByCategories_PeriodType",
                table: "RevenueByCategories");

            migrationBuilder.DropIndex(
                name: "IX_Quarters_CreatedAt",
                table: "Quarters");

            migrationBuilder.DropIndex(
                name: "IX_ProductVariants_CreatedAt",
                table: "ProductVariants");

            migrationBuilder.DropIndex(
                name: "IX_ProductSizes_CreatedAt",
                table: "ProductSizes");

            migrationBuilder.DropIndex(
                name: "IX_Products_Code",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_CreatedAt",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_ProductLots_CreatedAt",
                table: "ProductLots");

            migrationBuilder.DropIndex(
                name: "IX_ProductItems_Code",
                table: "ProductItems");

            migrationBuilder.DropIndex(
                name: "IX_ProductItems_CreatedAt",
                table: "ProductItems");

            migrationBuilder.DropIndex(
                name: "IX_ProductItems_IsDefected",
                table: "ProductItems");

            migrationBuilder.DropIndex(
                name: "IX_ProductItems_IsSold",
                table: "ProductItems");

            migrationBuilder.DropIndex(
                name: "IX_ProductDefects_CreatedAt",
                table: "ProductDefects");

            migrationBuilder.DropIndex(
                name: "IX_ProductColors_CreatedAt",
                table: "ProductColors");

            migrationBuilder.DropIndex(
                name: "IX_Orders_CreatedAt",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_InternalStatus",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_NextPaymentDate",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_PaymentStatus",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_ShopNo",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_OrderPayments_CreatedAt",
                table: "OrderPayments");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_CreatedAt",
                table: "OrderItems");

            migrationBuilder.DropIndex(
                name: "IX_InventoryValues_CreatedAt",
                table: "InventoryValues");

            migrationBuilder.DropIndex(
                name: "IX_InventoryTransferRecords_CreatedAt",
                table: "InventoryTransferRecords");

            migrationBuilder.DropIndex(
                name: "IX_InventoryTransferRecordItems_CreatedAt",
                table: "InventoryTransferRecordItems");

            migrationBuilder.DropIndex(
                name: "IX_Inventories_CreatedAt",
                table: "Inventories");

            migrationBuilder.DropIndex(
                name: "IX_Customers_CreatedAt",
                table: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_CustomerReturnRecords_CreatedAt",
                table: "CustomerReturnRecords");

            migrationBuilder.DropIndex(
                name: "IX_CustomerReturnItems_CreatedAt",
                table: "CustomerReturnItems");

            migrationBuilder.DropIndex(
                name: "IX_CustomerInsightsAllTime_CreatedAt",
                table: "CustomerInsightsAllTime");

            migrationBuilder.DropIndex(
                name: "IX_CustomerInsights_CreatedAt",
                table: "CustomerInsights");

            migrationBuilder.DropIndex(
                name: "IX_Categories_CreatedAt",
                table: "Categories");

            migrationBuilder.DropIndex(
                name: "IX_Brands_CreatedAt",
                table: "Brands");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$z9ITeHTfuaYimHQXihR6gOATSIamNBxAFNKAarBEFoMDUmd0johdC");
        }
    }
}
