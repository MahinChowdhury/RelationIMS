using AutoMapper;
using Relation_IMS.Dtos;
using Relation_IMS.Dtos.CategoryDtos;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Models;
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
            CreateMap<CreateBrandDTO, Brand>();
        }
    }
}
