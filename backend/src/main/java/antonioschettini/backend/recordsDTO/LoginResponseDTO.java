package antonioschettini.backend.recordsDTO;

public record LoginResponseDTO(
        String accessToken,
        String email,
        String role
) {}
