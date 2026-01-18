using Relation_IMS.Models.ProductModels;
using Relation_IMS.Services;

namespace Relation_IMS.Factory
{
    public class ProductItemsBuilderFactory
    {
        private readonly ProductCodeGenerator _codeGenerator;

        public ProductItemsBuilderFactory(ProductCodeGenerator codeGenerator)
        {
            _codeGenerator = codeGenerator;
        }

        /// <summary>
        /// Builds product items with hierarchical codes
        /// </summary>
        /// <param name="productCode">Product code (e.g., "E0042")</param>
        /// <param name="lotCode">Legacy parameter, ignored.</param>
        /// <param name="variantId">Variant ID</param>
        /// <param name="quantity">Number of items to create</param>
        /// <param name="defaultInventoryId">Default inventory ID</param>
        /// <param name="productLotId">Optional product lot ID (null for items without lot)</param>
        /// <param name="startingSequence">Starting sequence number (default 0)</param>
        public List<ProductItem> BuildItems(
            string productCode, 
            string lotCode, 
            int variantId, 
            int quantity, 
            int defaultInventoryId,
            int? productLotId = null,
            int startingSequence = 0)
        {
            var items = new List<ProductItem>();

            for (int i = 0; i < quantity; i++)
            {
                var sequenceNumber = startingSequence + i;
                // Updated to not use lotCode
                var itemCode = _codeGenerator.GenerateProductItemCode(productCode, variantId, sequenceNumber);

                items.Add(new ProductItem
                {
                    ProductVariantId = variantId,
                    ProductLotId = productLotId,
                    Code = itemCode,
                    IsDefected = false,
                    IsSold = false,
                    InventoryId = defaultInventoryId
                });
            }

            return items;
        }

        /// <summary>
        /// Legacy method for backward compatibility - generates items without lot
        /// </summary>
        [Obsolete("Use BuildItems with productCode and lotCode parameters instead")]
        public List<ProductItem> BuildItems(int productVariantId, int quantity, int defaultInventoryId)
        {
            // This is a fallback for legacy code - generates simple codes
            var items = new List<ProductItem>();

            for (int i = 0; i < quantity; i++)
            {
                items.Add(new ProductItem
                {
                    ProductVariantId = productVariantId,
                    Code = $"LEGACY-V{productVariantId}-{Guid.NewGuid().ToString().Substring(0, 8)}",
                    IsDefected = false,
                    IsSold = false,
                    InventoryId = defaultInventoryId
                });
            }

            return items;
        }
    }
}
