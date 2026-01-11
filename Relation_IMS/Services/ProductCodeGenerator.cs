using System.Text.RegularExpressions;

namespace Relation_IMS.Services
{
    public class ProductCodeGenerator
    {
        private const string Base36Chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        /// <summary>
        /// Converts an integer to base36 string with specified length (padded with zeros)
        /// </summary>
        private string ToBase36(int value, int length)
        {
            if (value < 0)
                throw new ArgumentException("Value must be non-negative", nameof(value));

            if (value == 0)
                return new string('0', length);

            var result = "";
            while (value > 0)
            {
                result = Base36Chars[value % 36] + result;
                value /= 36;
            }

            return result.PadLeft(length, '0');
        }

        /// <summary>
        /// Converts a base36 string to integer
        /// </summary>
        private int FromBase36(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Value cannot be empty", nameof(value));

            value = value.ToUpper();
            int result = 0;
            
            foreach (char c in value)
            {
                int digit = Base36Chars.IndexOf(c);
                if (digit < 0)
                    throw new ArgumentException($"Invalid base36 character: {c}", nameof(value));
                
                result = result * 36 + digit;
            }

            return result;
        }

        /// <summary>
        /// Generates a category code from the category name (first letter, uppercase)
        /// </summary>
        public string GenerateCategoryCode(string categoryName)
        {
            if (string.IsNullOrWhiteSpace(categoryName))
                throw new ArgumentException("Category name cannot be empty", nameof(categoryName));

            return categoryName.Trim()[0].ToString().ToUpper();
        }

        /// <summary>
        /// Generates a product code: {CategoryFirstLetter}{ProductId:Base36(3)}
        /// Example: E016 (Category E, Product 42)
        /// </summary>
        public string GenerateProductCode(string categoryFirstLetter, int productId)
        {
            if (string.IsNullOrWhiteSpace(categoryFirstLetter))
                throw new ArgumentException("Category first letter cannot be empty", nameof(categoryFirstLetter));

            if (productId <= 0)
                throw new ArgumentException("Product ID must be greater than 0", nameof(productId));

            return $"{categoryFirstLetter.ToUpper()}{ToBase36(productId, 3)}";
        }

        /// <summary>
        /// Generates a lot code: {LotId:Base36(3)}
        /// Example: 001 (Lot 1)
        /// </summary>
        public string GenerateLotCode(int lotId)
        {
            if (lotId <= 0)
                throw new ArgumentException("Lot ID must be greater than 0", nameof(lotId));

            return ToBase36(lotId, 3);
        }

        /// <summary>
        /// Generates a product item code: {ProductCode}{LotCode}{VariantId:Base36(2)}{SequentialNumber:Base36(3)}
        /// Example: E0016001053F (12 chars)
        /// Use "000" as lotCode for items not in a lot
        /// </summary>
        public string GenerateProductItemCode(string productCode, string lotCode, int variantId, int sequentialNumber)
        {
            if (string.IsNullOrWhiteSpace(productCode))
                throw new ArgumentException("Product code cannot be empty", nameof(productCode));

            if (string.IsNullOrWhiteSpace(lotCode))
                throw new ArgumentException("Lot code cannot be empty", nameof(lotCode));

            if (variantId <= 0)
                throw new ArgumentException("Variant ID must be greater than 0", nameof(variantId));

            if (sequentialNumber < 0)
                throw new ArgumentException("Sequential number cannot be negative", nameof(sequentialNumber));

            return $"{productCode}{lotCode}{ToBase36(variantId, 2)}{ToBase36(sequentialNumber, 3)}";
        }

        /// <summary>
        /// Parses a product item code to extract hierarchy information
        /// Format: {C}{PPP}{LLL}{VV}{III} = 12 characters
        /// Example: E0016001053F
        /// </summary>
        public ProductCodeInfo ParseProductItemCode(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
                throw new ArgumentException("Code cannot be empty", nameof(code));

            code = code.ToUpper().Trim();

            // Pattern: {C}{PPP}{LLL}{VV}{III}
            // C = 1 letter, PPP = 3 base36, LLL = 3 base36, VV = 2 base36, III = 3 base36
            var pattern = @"^([A-Z])([0-9A-Z]{3})([0-9A-Z]{3})([0-9A-Z]{2})([0-9A-Z]{3})$";
            var match = Regex.Match(code, pattern);

            if (!match.Success)
                throw new ArgumentException($"Invalid product item code format: {code}. Expected format: {{C}}{{PPP}}{{LLL}}{{VV}}{{III}} (12 chars)", nameof(code));

            return new ProductCodeInfo
            {
                CategoryLetter = match.Groups[1].Value,
                ProductId = FromBase36(match.Groups[2].Value),
                LotId = FromBase36(match.Groups[3].Value), // Will be 0 for items without lot
                VariantId = FromBase36(match.Groups[4].Value),
                SequentialNumber = FromBase36(match.Groups[5].Value)
            };
        }

        /// <summary>
        /// Checks if a product item code indicates the item is not in a lot
        /// </summary>
        public bool IsLotlessItem(string code)
        {
            var info = ParseProductItemCode(code);
            return info.LotId == 0;
        }
    }

    /// <summary>
    /// Holds parsed product code information
    /// </summary>
    public class ProductCodeInfo
    {
        public string CategoryLetter { get; set; } = null!;
        public int ProductId { get; set; }
        public int LotId { get; set; } // 0 indicates no lot
        public int VariantId { get; set; }
        public int SequentialNumber { get; set; }

        public bool HasLot => LotId > 0;

        public override string ToString()
        {
            return $"Category: {CategoryLetter}, Product: {ProductId}, Lot: {(HasLot ? LotId.ToString() : "None")}, Variant: {VariantId}, Seq: {SequentialNumber}";
        }
    }
}
