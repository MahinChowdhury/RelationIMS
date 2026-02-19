using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.CategoryDtos;
using Relation_IMS.Models.ProductModels;
using Relation_IMS.Services;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class CategoryController : ControllerBase
    {
        private readonly ICategoryRepository _categoryRepository;
        private readonly IConcurrencyLockService _lockService;

        public CategoryController(ICategoryRepository categoryRepository, IConcurrencyLockService lockService)
        {
            _categoryRepository = categoryRepository;
            _lockService = lockService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Lock to prevent concurrent category code generation
            using (await _lockService.AcquireLockAsync("category:create"))
            {
                var created = await _categoryRepository.CreateCategoryAsync(dto);

                if (created == null)
                    return Conflict(new { message = $"Category '{dto.Name}' already exists." });

                return CreatedAtAction(nameof(GetCategoryById), new { id = created.Id }, created);
            }
        }

        // Get All Categories
        [HttpGet]
        public async Task<ActionResult<List<Category>>> GetAllCategories()
        {
            var categories = await _categoryRepository.GetAllCategoryAsync();

            if (categories == null || categories.Count == 0)
                return NotFound(new { message = "No categories found." });

            return Ok(categories);
        }

        // Get Category by ID
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Category>> GetCategoryById([FromRoute] int id)
        {
            var category = await _categoryRepository.GetCategoryByIdAsync(id);

            if (category == null)
                return NotFound(new { message = $"Category with ID {id} not found." });

            return Ok(category);
        }

        // Update Category
        [HttpPut("{id:int}")]
        public async Task<ActionResult<Category>> UpdateCategory([FromRoute] int id, [FromBody] UpdateCategoryDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            using (await _lockService.AcquireLockAsync($"category:{id}"))
            {
                var updated = await _categoryRepository.UpdateCategoryAsync(id,dto);

                if (updated == null)
                    return NotFound(new { message = $"Category with ID {id} not found." });

                return Ok(updated);
            }
        }

        // Delete Category
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteCategory([FromRoute] int id)
        {
            using (await _lockService.AcquireLockAsync($"category:{id}"))
            {
                var deleted = await _categoryRepository.DeleteCategoryAsync(id);

                if (deleted == null)
                    return NotFound(new { message = $"Category with ID {id} not found." });

                return Ok(new { message = $"Category '{deleted.Name}' deleted successfully." });
            }
        }
    }
}
