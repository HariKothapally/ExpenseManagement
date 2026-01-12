// Services/GeminiBillExtractor.cs
using System.IO;
using System.Text;
using Newtonsoft.Json;


public class GeminiBillExtractor : IGeminiBillExtractor
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _geminiApiKey;
    private readonly string _geminiEndpoint;
    private readonly ILogger<GeminiBillExtractor> _logger;

    public GeminiBillExtractor(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<GeminiBillExtractor> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;

        // Consider using IOptions<GeminiSettings> for better configuration management
        _geminiApiKey = configuration["GeminiApi:ApiKey"];
        _geminiEndpoint = configuration["GeminiApi:Endpoint"];

        if (string.IsNullOrEmpty(_geminiApiKey) || string.IsNullOrEmpty(_geminiEndpoint))
        {
            _logger.LogError("Gemini API Key or Endpoint is not configured correctly in appsettings.");
            throw new InvalidOperationException("Gemini API configuration is missing or incomplete.");
        }
    }

    public async Task<ScannedBill?> ExtractBillDataFromImageAsync(Stream imageStream, string mimeType)
    {
        ArgumentNullException.ThrowIfNull(imageStream);
        if (string.IsNullOrEmpty(mimeType))
        {
            throw new ArgumentException("MIME type cannot be null or empty.", nameof(mimeType));
        }

        try
        {
            // Get HttpClient from the factory
            var client = _httpClientFactory.CreateClient("GeminiClient"); // Use a named client if configured

            // Construct the full URL with the API key
            string endpoint = $"{_geminiEndpoint}?key={_geminiApiKey}";

            // Read stream to byte array and encode as Base64
            byte[] imageBytes;
            using (var memoryStream = new MemoryStream())
            {
                await imageStream.CopyToAsync(memoryStream);
                imageBytes = memoryStream.ToArray();
            }
            string base64Image = Convert.ToBase64String(imageBytes);

            // Prompt (same as before)
            string prompt = @"
    Extract the following fields from this bill image and return them in JSON format. The structure should match this example:
    {
    ""vendor"": ""string"",
    ""date"": ""yyyy-MM-ddTHH:mm:ssZ"", // ISO 8601 UTC format is best
    ""totalAmount"": number,
    ""paymentMethod"": ""string or null"",
    ""lineItems"": [
        {
        ""itemName"": ""string"",
        ""quantity"": number,
        ""unitPrice"": number,
        ""totalPrice"": number
        }
    ]
    }
    Fields to extract:
    - vendor: The name of the vendor or store.
    - date: The date on the bill. Convert it to ISO 8601 UTC format (yyyy-MM-ddTHH:mm:ssZ). If time is missing, use 00:00:00. If timezone is missing assume UTC.
    - totalAmount: The final total amount due (numeric, e.g., 500.00).
    - paymentMethod: The payment method used (e.g., Credit Card, Cash). If not found, use null.
    - lineItems: An array of items, each with itemName, quantity, unitPrice, and totalPrice. If line items are not clearly separable or present, return an empty array [].
    If a top-level field (vendor, date, totalAmount) cannot be reliably extracted, return null for that field's value (except for lineItems which should be []).
    Return *only* the JSON object, without any surrounding text, comments, or markdown formatting like ```json ... ```.
    ";

            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new object[] // Explicitly object[]
                        {
                            new { text = prompt },
                            new
                            {
                                inlineData = new
                                {
                                    mimeType = mimeType, // Use passed mimeType
                                    data = base64Image
                                }
                            }
                        }
                    }
                }
                // Optional: Add generationConfig if needed
                // generationConfig = new { responseMimeType = "application/json" }
            };

            var jsonPayload = JsonConvert.SerializeObject(payload);
            using var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            _logger.LogInformation("Sending request to Gemini endpoint: {Endpoint}", _geminiEndpoint);
            HttpResponseMessage response = await client.PostAsync(endpoint, content);

            if (!response.IsSuccessStatusCode)
            {
                string errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Gemini API request failed with status code {StatusCode}. Response: {ErrorContent}", response.StatusCode, errorContent);
                response.EnsureSuccessStatusCode(); // Re-throw HttpRequestException
            }

            string geminiResponse = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Received successful response from Gemini.");
            _logger.LogDebug("Gemini Raw Response: {ResponseBody}", geminiResponse);

            return DeserializeBillFromJson(geminiResponse);
        }
        catch (HttpRequestException httpEx)
        {
            _logger.LogError(httpEx, "Error calling Gemini API.");
            return null; // Indicate failure
        }
        catch (JsonException jsonEx)
        {
            _logger.LogError(jsonEx, "Error deserializing Gemini response or payload.");
            return null; // Indicate failure
        }
        catch (Exception ex) // Catch unexpected errors
        {
            _logger.LogError(ex, "An unexpected error occurred during bill extraction.");
            return null; // Indicate failure
        }
    }

    // Made internal or private, only used within this service
    private ScannedBill? DeserializeBillFromJson(string geminiResponse)
    {
        try
        {
            var responseJson = JsonConvert.DeserializeObject<dynamic>(geminiResponse);
            // Use nullable string
            string? extractedJson = responseJson?.candidates?[0]?.content?.parts?[0]?.text?.ToString();

            if (string.IsNullOrWhiteSpace(extractedJson))
            {
                _logger.LogWarning("Could not extract JSON text from Gemini response structure. Raw response: {GeminiResponse}", geminiResponse);
                return null;
            }

            _logger.LogDebug("Raw Extracted JSON: {ExtractedJson}", extractedJson);

            // Clean up potential markdown fences
            extractedJson = extractedJson.Trim();
            if (extractedJson.StartsWith("```json"))
            {
                extractedJson = extractedJson.Substring(7).Trim(); // Skip ```json\n
                if (extractedJson.EndsWith("```"))
                {
                    extractedJson = extractedJson.Substring(0, extractedJson.Length - 3).Trim();
                }
            }
            else if (extractedJson.StartsWith("```")) // Handle case where only ``` is present
            {
                 extractedJson = extractedJson.Substring(3).Trim();
                 if (extractedJson.EndsWith("```"))
                 {
                     extractedJson = extractedJson.Substring(0, extractedJson.Length - 3).Trim();
                 }
            }


            _logger.LogDebug("Cleaned JSON for Deserialization: {CleanedJson}", extractedJson);

            // Deserialize - can return null
            var scannedBill = JsonConvert.DeserializeObject<ScannedBill>(extractedJson);

            if (scannedBill == null)
            {
                 _logger.LogWarning("Deserialization of extracted JSON resulted in null. Cleaned JSON: {CleanedJson}", extractedJson);
            }

            return scannedBill; // Return potentially null object
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "JSON deserialization error. Raw Gemini response: {GeminiResponse}", geminiResponse);
            return null; // Indicate failure
        }
        catch (Exception ex) // Catch unexpected errors during processing
        {
             _logger.LogError(ex, "Unexpected error during deserialization. Raw Gemini response: {GeminiResponse}", geminiResponse);
             return null; // Indicate failure
        }
    }
}
