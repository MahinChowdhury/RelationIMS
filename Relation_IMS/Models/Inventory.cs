using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Models
{
    public class Inventory
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public List<ProductItem>? ProductItems { get; set; }
    }
}
