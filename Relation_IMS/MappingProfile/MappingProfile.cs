using AutoMapper;
using Relation_IMS.Dtos.CategoryDtos;
using Relation_IMS.Dtos.CustomerDtos;
using Relation_IMS.Dtos.InventoryDtos;
using Relation_IMS.Dtos.OrderDtos;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Models.CustomerModels;
using Relation_IMS.Models.InventoryModels;
using Relation_IMS.Models.OrderModels;
using Relation_IMS.Models.PaymentModels;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.MappingProfile
{
    public class MappingProfile : Profile
    {
        public MappingProfile() {
            CreateMap<CreateCategoryDTO, Category>();
            CreateMap<CreateNewProductColorDTO, ProductColor>();
            CreateMap<CreateNewProductSizeDTO, ProductSize>();
            CreateMap<CreateNewProductDTO, Product>();
            CreateMap<CreateProductVariantDTO, ProductVariant>();
            CreateMap<CreateQuarterDTO, Quarter>();
            CreateMap<CreateBrandDTO, Brand>();
            CreateMap<CreateCustomerDTO, Customer>();
            CreateMap<CreateOrderDTO, Order>();
            CreateMap<CreateOrderItemDTO, OrderItem>();
            CreateMap<OrderPaymentDTO, OrderPayment>();
            CreateMap<CreateInventoryDTO, Inventory>();
        }
    }
}
