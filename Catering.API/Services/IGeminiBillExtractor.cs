// Services/IGeminiBillExtractor.cs
using System.IO;

public interface IGeminiBillExtractor
{
    /// <summary>
    /// Extracts structured bill data from an image stream using the Gemini API.
    /// </summary>
    /// <param name="imageStream">The stream containing the image data.</param>
    /// <param name="mimeType">The MIME type of the image (e.g., "image/jpeg", "image/png").</param>
    /// <returns>A ScannedBill object populated with extracted data, or null if extraction fails.</returns>
    Task<ScannedBill?> ExtractBillDataFromImageAsync(Stream imageStream, string mimeType);
}
