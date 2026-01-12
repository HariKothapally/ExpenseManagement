using System.ComponentModel.DataAnnotations;

public class User
{
    public string Id { get; set; }

    [Required]
    [MinLength(3)]
    public string Username { get; set; }

    [Required]
    public string PasswordHash { get; set; }

    [Required]
    public string Role { get; set; }
}