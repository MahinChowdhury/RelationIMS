using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Models
{
    public class Brand
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;

        public List<Product>? Products { get; set; }
    }
}