using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.IO; // Keep for Path
using Microsoft.Extensions.Logging; // Add for logging

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class BillsController : ControllerBase
{
    private readonly IBillRepository _repository;
    private readonly IGeminiBillExtractor _geminiExtractor; // Inject the new service
    private readonly ILogger<BillsController> _logger; // Inject logger

    // Updated constructor
    public BillsController(
        IBillRepository repository,
        IGeminiBillExtractor geminiExtractor, // Inject service
        ILogger<BillsController> logger) // Inject logger
    {
        _repository = repository;
        _geminiExtractor = geminiExtractor; // Store service instance
        _logger = logger; // Store logger instance
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ScannedBill>>> GetBills()
    {
        _logger.LogInformation("Getting all bills");
        return Ok(await _repository.GetAllBillsAsync());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ScannedBill>> GetBillById(string id)
    {
        _logger.LogInformation("Getting bill by ID: {BillId}", id);
        var bill = await _repository.GetBillByIdAsync(id);
        if (bill == null)
        {
            _logger.LogWarning("Bill with ID {BillId} not found.", id);
            return NotFound();
        }
        return Ok(bill);
    }

    [HttpPost]
    public async Task<ActionResult<ScannedBill>> CreateBill([FromBody] ScannedBill bill)
    {
        // Generate an Id if not provided
        if (string.IsNullOrEmpty(bill.Id))
        {
            bill.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
            _logger.LogInformation("Generated new ID {BillId} for created bill.", bill.Id);
        }

        await _repository.CreateBillAsync(bill);
        _logger.LogInformation("Created bill with ID: {BillId}", bill.Id);
        return CreatedAtAction(nameof(GetBillById), new { id = bill.Id }, bill);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBill(string id, [FromBody] ScannedBill billIn)
    {
        _logger.LogInformation("Updating bill with ID: {BillId}", id);
        var existingBill = await _repository.GetBillByIdAsync(id);
        if (existingBill == null)
        {
            _logger.LogWarning("Update failed: Bill with ID {BillId} not found.", id);
            return NotFound();
        }

        billIn.Id = id; // Ensure the Id matches the route parameter
        await _repository.UpdateBillAsync(id, billIn);
        _logger.LogInformation("Successfully updated bill with ID: {BillId}", id);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteBill(string id)
    {
        _logger.LogInformation("Attempting to delete bill with ID: {BillId}", id);
        var bill = await _repository.GetBillByIdAsync(id);
        if (bill == null)
        {
            _logger.LogWarning("Delete failed: Bill with ID {BillId} not found.", id);
            return NotFound();
        }

        await _repository.DeleteBillAsync(id);
        _logger.LogInformation("Successfully deleted bill with ID: {BillId}", id);
        return NoContent();
    }

    [HttpPost("upload")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UploadBillImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            _logger.LogWarning("Upload attempt failed: No file provided.");
            return BadRequest("No file uploaded.");
        }

        // Validate file type and size
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
        var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant(); // Use null-conditional and ToLowerInvariant
        if (string.IsNullOrEmpty(extension) || !allowedExtensions.Contains(extension))
        {
            _logger.LogWarning("Upload failed: Invalid file type '{Extension}'. Allowed: {AllowedExtensions}", extension, string.Join(", ", allowedExtensions));
            return BadRequest($"Invalid file type. Only {string.Join(", ", allowedExtensions)} are allowed.");
        }

        // Determine MIME type dynamically
        string mimeType = extension switch
        {
            ".png" => "image/png",
            ".jpg" => "image/jpeg",
            ".jpeg" => "image/jpeg",
            _ => "application/octet-stream" // Fallback, should ideally not happen due to extension check
        };
        if (mimeType == "application/octet-stream")
        {
             _logger.LogError("Upload failed: Could not determine valid image MIME type for extension '{Extension}'.", extension);
             return BadRequest($"Could not determine valid image MIME type for extension '{extension}'.");
        }


        long maxFileSize = 5 * 1024 * 1024; // 5MB limit
        if (file.Length > maxFileSize)
        {
            _logger.LogWarning("Upload failed: File size {FileSize} exceeds limit {MaxFileSize}.", file.Length, maxFileSize);
            return BadRequest($"File size exceeds {maxFileSize / 1024 / 1024}MB limit.");
        }

        try
        {
            _logger.LogInformation("Processing uploaded file '{FileName}' ({FileSize} bytes, Type: {MimeType}).", file.FileName, file.Length, mimeType);

            // Use the stream directly, no need for temporary file
            await using var imageStream = file.OpenReadStream();

            // Call the extraction service
            ScannedBill? scannedBill = await _geminiExtractor.ExtractBillDataFromImageAsync(imageStream, mimeType);

            // Check if extraction was successful
            if (scannedBill == null)
            {
                _logger.LogWarning("Extraction service failed to return bill data for file '{FileName}'.", file.FileName);
                // Return 500 as it's likely a server-side/API issue, not bad client input
                return StatusCode(StatusCodes.Status500InternalServerError, "Failed to extract data from the bill image. Check server logs for details.");
            }

            // Validate required fields after extraction
            // Adjust validation as needed (e.g., check Date, LineItems?)
            if (string.IsNullOrEmpty(scannedBill.Vendor) || scannedBill.TotalAmount <= 0) // Example: Ensure positive amount
            {
                _logger.LogWarning("Validation failed after extraction for file '{FileName}': Vendor='{Vendor}', TotalAmount={TotalAmount}", file.FileName, scannedBill.Vendor, scannedBill.TotalAmount);
                // Return 400 as the extracted data is insufficient
                return BadRequest("Failed to extract required fields (Vendor and positive TotalAmount) from the bill image.");
            }

            // Generate an Id if not provided by Gemini (or overwrite if needed)
            if (string.IsNullOrEmpty(scannedBill.Id))
            {
                scannedBill.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                _logger.LogInformation("Generated new ID {BillId} for scanned bill from file '{FileName}'.", scannedBill.Id, file.FileName);
            }

            // Save to MongoDB using the repository
            await _repository.CreateBillAsync(scannedBill);
            _logger.LogInformation("Successfully created bill {BillId} from uploaded image '{FileName}'.", scannedBill.Id, file.FileName);

            // Return 201 Created
            return CreatedAtAction(nameof(GetBillById), new { id = scannedBill.Id }, scannedBill);
        }
        // Catch specific exceptions if the service re-throws them, otherwise catch general Exception
        catch (Exception ex)
        {
            // Log the full exception details server-side
            _logger.LogError(ex, "An unexpected error occurred processing the uploaded bill image '{FileName}'.", file.FileName);
            // Return a generic 500 error to the client
            return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred while processing the bill image.");
        }
        // No finally block needed for temp file deletion anymore
    }

    // Remove private methods ExtractJsonFromImageAsync and DeserializeBillFromJson
    // They are now encapsulated within GeminiBillExtractor service
}
