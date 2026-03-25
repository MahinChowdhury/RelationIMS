using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Models.Analytics;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Relation_IMS.Services
{
    public class PdfReportService : IPdfReportService
    {
        private readonly ITodaySaleRepository _todaySaleRepository;
        private readonly ISalesOverviewRepository _salesOverviewRepository;
        private readonly ITopSellingProductRepository _topSellingProductRepository;
        private readonly IInventoryValueRepository _inventoryValueRepository;
        private readonly ITopCustomerRepository _topCustomerRepository;
        private readonly IStaffPerformanceRepository _staffPerformanceRepository;
        private readonly ICustomerInsightRepository _customerInsightRepository;
        private readonly IRevenueByCategoryRepository _revenueByCategoryRepository;

        public PdfReportService(
            ITodaySaleRepository todaySaleRepository,
            ISalesOverviewRepository salesOverviewRepository,
            ITopSellingProductRepository topSellingProductRepository,
            IInventoryValueRepository inventoryValueRepository,
            ITopCustomerRepository topCustomerRepository,
            IStaffPerformanceRepository staffPerformanceRepository,
            ICustomerInsightRepository customerInsightRepository,
            IRevenueByCategoryRepository revenueByCategoryRepository)
        {
            _todaySaleRepository = todaySaleRepository;
            _salesOverviewRepository = salesOverviewRepository;
            _topSellingProductRepository = topSellingProductRepository;
            _inventoryValueRepository = inventoryValueRepository;
            _topCustomerRepository = topCustomerRepository;
            _staffPerformanceRepository = staffPerformanceRepository;
            _customerInsightRepository = customerInsightRepository;
            _revenueByCategoryRepository = revenueByCategoryRepository;
        }

        public async Task<byte[]> GenerateDashboardReportAsync(DateTime date)
        {
            var todaySale = await _todaySaleRepository.GetTodaySaleAsync(date.Date);
            var yesterdaySale = await _todaySaleRepository.GetYesterdaySaleAsync(date.Date.AddDays(-1));
            var thisWeekSale = await _salesOverviewRepository.GetSalesOverviewAsync(SalesOverviewPeriodType.ThisWeek);
            var thisMonthSale = await _salesOverviewRepository.GetSalesOverviewAsync(SalesOverviewPeriodType.ThisMonth);
            var topSellingProducts = await _topSellingProductRepository.GetTopSellingProductsAsync(TopSellingPeriodType.Last30Days, 10);
            var inventoryValue = await _inventoryValueRepository.GetInventoryValueAsync();
            var topCustomers = await _topCustomerRepository.GetTopCustomersAsync(TopCustomerPeriodType.AllTime, 10);
            var staffPerformance = await _staffPerformanceRepository.GetMonthlyPerformanceAsync(date.Year, date.Month);
            var customerInsight = await _customerInsightRepository.GetAllTimeInsightAsync();
            var revenueByCategory = await _revenueByCategoryRepository.GetRevenueByCategoriesAsync(TopSellingPeriodType.Last30Days, 10);

            QuestPDF.Settings.License = LicenseType.Community;

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1.5f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(9).FontFamily(Fonts.TimesNewRoman).FontColor(Colors.Black));

                    page.Header().Element(x => ComposeHeader(x, date));
                    page.Content().Element(x => ComposeContent(x, todaySale, yesterdaySale, thisWeekSale, thisMonthSale, topSellingProducts, inventoryValue, topCustomers, staffPerformance, customerInsight, revenueByCategory));
                    page.Footer().Element(ComposeFooter);
                });
            });

            return document.GeneratePdf();
        }

        private void ComposeHeader(IContainer container, DateTime date)
        {
            container.PaddingBottom(0.5f, Unit.Centimetre).Column(column =>
            {
                column.Item().BorderBottom(1).PaddingBottom(3).Row(row =>
                {
                    row.RelativeItem().Column(col =>
                    {
                        col.Item().Text("RELATION IMS").FontSize(18).Bold().FontFamily(Fonts.TimesNewRoman);
                        col.Item().Text("EXECUTIVE DASHBOARD REPORT").FontSize(10).FontFamily(Fonts.TimesNewRoman).FontColor(Colors.Grey.Darken2);
                    });
                    
                    row.ConstantItem(150).AlignRight().Column(col =>
                    {
                        col.Item().Text($"Date: {date:dd MMM yyyy}").FontSize(8);
                        col.Item().Text($"Time: {date:HH:mm}").FontSize(8);
                        col.Item().Text("Status: OFFICIAL").FontSize(8).Bold();
                    });
                });
            });
        }

        private void ComposeContent(IContainer container, TodaySale? todaySale, TodaySale? yesterdaySale, SalesOverview? weekSale, SalesOverview? monthSale, System.Collections.Generic.List<TopSellingProduct>? topProducts, InventoryValue? inventory, System.Collections.Generic.List<TopCustomer>? topCustomers, System.Collections.Generic.List<StaffPerformanceMonthly>? staffPerformance, CustomerInsightAllTime? customerInsight, System.Collections.Generic.List<RevenueByCategory>? revenueByCategory)
        {
            container.Column(column => 
            {
                column.Spacing(8);

                // I. Sales Summary Section
                column.Item().Text("I. SALES & REVENUE SUMMARY").FontSize(10).Bold().Underline();
                
                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(1);
                        columns.RelativeColumn(3);
                    });

                    table.Header(header =>
                    {
                        header.Cell().BorderBottom(1).PaddingBottom(2).Text("Period").Bold();
                        header.Cell().BorderBottom(1).PaddingBottom(2).AlignRight().Text("Revenue (BDT)").Bold();
                        header.Cell().BorderBottom(1).PaddingBottom(2).AlignRight().Text("Orders").Bold();
                        header.Cell().BorderBottom(1).PaddingBottom(2).AlignRight().Text("Remarks").Bold();
                    });

                    table.Cell().PaddingVertical(2).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).Text("Today");
                    table.Cell().PaddingVertical(2).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).AlignRight().Text(todaySale?.TotalSales.ToString("N2") ?? "0.00");
                    table.Cell().PaddingVertical(2).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).AlignRight().Text(todaySale?.OrderCount.ToString() ?? "0");
                    
                    var todayAmount = todaySale?.TotalSales ?? 0;
                    var yesterdayAmount = yesterdaySale?.TotalSales ?? 0;
                    var change = yesterdayAmount > 0 ? ((todayAmount - yesterdayAmount) / yesterdayAmount * 100) : 0;
                    var changeText = change >= 0 ? $"+{change:F1}% vs Prev. Day" : $"{change:F1}% vs Prev. Day";
                    table.Cell().PaddingVertical(2).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).AlignRight().Text(changeText).Italic();

                    table.Cell().PaddingVertical(2).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).Text("This Week");
                    table.Cell().PaddingVertical(2).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).AlignRight().Text(weekSale?.TotalRevenue.ToString("N2") ?? "0.00");
                    table.Cell().PaddingVertical(2).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).AlignRight().Text(weekSale?.OrderCount.ToString() ?? "0");
                    table.Cell().PaddingVertical(2).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).AlignRight().Text("-").Italic();

                    table.Cell().PaddingVertical(2).BorderBottom(1).Text("This Month");
                    table.Cell().PaddingVertical(2).BorderBottom(1).AlignRight().Text(monthSale?.TotalRevenue.ToString("N2") ?? "0.00");
                    table.Cell().PaddingVertical(2).BorderBottom(1).AlignRight().Text(monthSale?.OrderCount.ToString() ?? "0");
                    table.Cell().PaddingVertical(2).BorderBottom(1).AlignRight().Text("-").Italic();
                });

                // II. Inventory Valuation
                column.Item().Text("II. INVENTORY VALUATION").FontSize(10).Bold().Underline();
                
                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Cell().PaddingVertical(1).Text("Total Items in Stock:");
                    table.Cell().PaddingVertical(1).AlignRight().Text(inventory?.TotalItems.ToString("N0") ?? "0");
                    
                    table.Cell().PaddingVertical(1).Text("Estimated Total Value (BDT):");
                    table.Cell().PaddingVertical(1).AlignRight().Text(inventory?.TotalValue.ToString("N2") ?? "0.00").Bold();
                    
                    table.Cell().PaddingVertical(1).Text("Previous Month Value (BDT):");
                    table.Cell().PaddingVertical(1).AlignRight().Text(inventory?.LastMonthValue.ToString("N2") ?? "0.00");
                });

                // III. Customer Insights
                column.Item().Text("III. CUSTOMER INSIGHTS").FontSize(10).Bold().Underline();
                
                column.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn();
                        columns.RelativeColumn();
                    });

                    table.Cell().PaddingVertical(1).Text("Total Customers:");
                    table.Cell().PaddingVertical(1).AlignRight().Text(customerInsight?.TotalCustomers.ToString("N0") ?? "0");
                    
                    table.Cell().PaddingVertical(1).Text("New Customers:");
                    table.Cell().PaddingVertical(1).AlignRight().Text($"{customerInsight?.NewCustomerCount.ToString("N0") ?? "0"} ({customerInsight?.NewCustomerPercentage.ToString("F1") ?? "0"}%)");
                    
                    table.Cell().PaddingVertical(1).Text("Returning Customers:");
                    table.Cell().PaddingVertical(1).AlignRight().Text($"{customerInsight?.ReturningCustomerCount.ToString("N0") ?? "0"} ({customerInsight?.ReturningCustomerPercentage.ToString("F1") ?? "0"}%)");
                });

                // IV. Top Performing Products
                column.Item().Text("IV. TOP PERFORMING PRODUCTS (LAST 30 DAYS)").FontSize(10).Bold().Underline();
                if (topProducts != null && topProducts.Any())
                {
                    column.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(25);
                            columns.RelativeColumn(3);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1.5f);
                        });

                        table.Header(header =>
                        {
                            header.Cell().BorderBottom(1).PaddingBottom(2).Text("No.").Bold();
                            header.Cell().BorderBottom(1).PaddingBottom(2).Text("Product Description").Bold();
                            header.Cell().BorderBottom(1).PaddingBottom(2).AlignRight().Text("Qty").Bold();
                            header.Cell().BorderBottom(1).PaddingBottom(2).AlignRight().Text("Revenue (BDT)").Bold();
                        });

                        int rank = 1;
                        foreach (var product in topProducts)
                        {
                            table.Cell().PaddingVertical(1).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).Text(rank.ToString());
                            table.Cell().PaddingVertical(1).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).Text(product.ProductName);
                            table.Cell().PaddingVertical(1).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).AlignRight().Text(product.TotalQuantitySold.ToString("N0"));
                            table.Cell().PaddingVertical(1).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).AlignRight().Text(product.TotalRevenue.ToString("N2"));
                            rank++;
                        }
                    });
                }
                else
                {
                    column.Item().Text("No product sales data available for the specified period.").Italic();
                }

                // V. Revenue By Category
                column.Item().Text("V. REVENUE BY CATEGORY (LAST 30 DAYS)").FontSize(10).Bold().Underline();
                if (revenueByCategory != null && revenueByCategory.Any())
                {
                    column.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(25);
                            columns.RelativeColumn(3);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1.5f);
                        });

                        table.Header(header =>
                        {
                            header.Cell().BorderBottom(1).PaddingBottom(2).Text("No.").Bold();
                            header.Cell().BorderBottom(1).PaddingBottom(2).Text("Category Name").Bold();
                            header.Cell().BorderBottom(1).PaddingBottom(2).AlignRight().Text("Qty").Bold();
                            header.Cell().BorderBottom(1).PaddingBottom(2).AlignRight().Text("Revenue (BDT)").Bold();
                        });

                        int rank = 1;
                        foreach (var cat in revenueByCategory)
                        {
                            table.Cell().PaddingVertical(1).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).Text(rank.ToString());
                            table.Cell().PaddingVertical(1).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).Text(cat.CategoryName);
                            table.Cell().PaddingVertical(1).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).AlignRight().Text(cat.TotalQuantitySold.ToString("N0"));
                            table.Cell().PaddingVertical(1).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).AlignRight().Text(cat.TotalRevenue.ToString("N2"));
                            rank++;
                        }
                    });
                }
                else
                {
                    column.Item().Text("No revenue by category data available.").Italic();
                }

                // VI. Top Customers
                column.Item().Text("VI. TOP CUSTOMERS (ALL TIME)").FontSize(10).Bold().Underline();
                if (topCustomers != null && topCustomers.Any())
                {
                    column.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(25);
                            columns.RelativeColumn(3);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1.5f);
                        });

                        table.Header(header =>
                        {
                            header.Cell().BorderBottom(1).PaddingBottom(2).Text("No.").Bold();
                            header.Cell().BorderBottom(1).PaddingBottom(2).Text("Customer Name").Bold();
                            header.Cell().BorderBottom(1).PaddingBottom(2).AlignRight().Text("Purchases").Bold();
                            header.Cell().BorderBottom(1).PaddingBottom(2).AlignRight().Text("Total Amount (BDT)").Bold();
                        });

                        int rank = 1;
                        foreach (var customer in topCustomers)
                        {
                            table.Cell().PaddingVertical(1).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).Text(rank.ToString());
                            table.Cell().PaddingVertical(1).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).Text(customer.CustomerName);
                            table.Cell().PaddingVertical(1).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).AlignRight().Text(customer.TotalPurchases.ToString("N0"));
                            table.Cell().PaddingVertical(1).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).AlignRight().Text(customer.TotalAmount.ToString("N2"));
                            rank++;
                        }
                    });
                }
                else
                {
                    column.Item().Text("No top customer data available.").Italic();
                }

                // VII. Staff Performance
                column.Item().Text("VII. STAFF PERFORMANCE (THIS MONTH)").FontSize(10).Bold().Underline();
                if (staffPerformance != null && staffPerformance.Any())
                {
                    column.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(30);
                            columns.RelativeColumn(3);
                            columns.RelativeColumn(1);
                            columns.RelativeColumn(1.5f);
                        });

                        table.Header(header =>
                        {
                            header.Cell().BorderBottom(1).PaddingBottom(2).Text("Rank").Bold();
                            header.Cell().BorderBottom(1).PaddingBottom(2).Text("Staff Name/ID").Bold();
                            header.Cell().BorderBottom(1).PaddingBottom(2).AlignRight().Text("Orders").Bold();
                            header.Cell().BorderBottom(1).PaddingBottom(2).AlignRight().Text("Sales (BDT)").Bold();
                        });

                        foreach (var staff in staffPerformance)
                        {
                            table.Cell().PaddingVertical(1).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).Text(staff.Rank.ToString());
                            table.Cell().PaddingVertical(1).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).Text(staff.User != null ? $"{staff.User.Firstname} {staff.User.Lastname}".Trim() : $"User {staff.UserId}");
                            table.Cell().PaddingVertical(1).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).AlignRight().Text(staff.OrderCount.ToString("N0"));
                            table.Cell().PaddingVertical(1).BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten3).AlignRight().Text(staff.TotalSales.ToString("N2"));
                        }
                    });
                }
                else
                {
                    column.Item().Text("No staff performance data available for this month.").Italic();
                }

                column.Item().PaddingTop(10).AlignCenter().Text("*** END OF REPORT ***").FontSize(8).Bold();
            });
        }

        private void ComposeFooter(IContainer container)
        {
            container.BorderTop(1).PaddingTop(3).Row(row =>
            {
                row.RelativeItem().Text("CONFIDENTIAL - Internal Use Only").FontSize(7).Italic();
                row.RelativeItem().AlignRight().Text(x =>
                {
                    x.Span("Page ");
                    x.CurrentPageNumber();
                    x.Span(" of ");
                    x.TotalPages();
                });
            });
        }
    }
}
