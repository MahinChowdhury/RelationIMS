namespace Relation_IMS.Dtos.ProductDtos
{
    public class DefectRequestDTO
    {
        public string Reason { get; set; } = string.Empty;
    }

    public class DefectItemResDTO
    {
        public int Id { get; set; } // Defect ID
        public int ProductItemId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string ReportedBy { get; set; } = string.Empty;
        public DateTime DefectDate { get; set; }
        public string? ProductImageUrl { get; set; }
    }
}
