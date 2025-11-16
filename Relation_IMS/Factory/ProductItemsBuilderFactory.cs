using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Factory
{
    public class ProductItemsBuilderFactory
    {
        public List<ProductItem> BuildItems(int productVariantId, int quantity, int defaultInventoryId)
        {
            var items = new List<ProductItem>();

            for (int i = 0; i < quantity; i++)
            {
                items.Add(new ProductItem
                {
                    ProductVariantId = productVariantId,
                    Code = GenerateUniqueCode(productVariantId, i),
                    IsDefected = false,
                    IsSold = false,
                    InventoryId = defaultInventoryId
                });
            }

            return items;
        }

        private string GenerateUniqueCode(int variantId, int index)
        {
            return $"PV-{variantId}-{Guid.NewGuid().ToString().Substring(0, 8)}";
        }
    }
}
