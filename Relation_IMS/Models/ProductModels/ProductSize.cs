namespace Relation_IMS.Models.ProductModels
{
    public class ProductSize
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int CategoryId { get; set; }
    }
}