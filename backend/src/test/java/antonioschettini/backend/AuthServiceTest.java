package antonioschettini.backend;

import antonioschettini.backend.entities.User;
import antonioschettini.backend.enums.Role;
import antonioschettini.backend.exceptions.BadRequestException;
import antonioschettini.backend.exceptions.TooManyRequestsException;
import antonioschettini.backend.exceptions.UnauthorizedException;
import antonioschettini.backend.recordsDTO.LoginDTO;
import antonioschettini.backend.recordsDTO.LoginResponseDTO;
import antonioschettini.backend.repositories.UserRepository;
import antonioschettini.backend.security.JWTTools;
import antonioschettini.backend.services.AuthService;
import antonioschettini.backend.services.LoginAttemptService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JWTTools jwtTools;

    @Mock
    private LoginAttemptService loginAttemptService;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testAuthenticateUserSuccess() {
        LoginDTO dto = new LoginDTO("admin@vincoeventi.com", "Password123!");
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("admin@vincoeventi.com")
                .password("encoded_password")
                .role(Role.ROLE_ADMIN)
                .build();

        when(loginAttemptService.isBlocked(anyString())).thenReturn(false);
        when(userRepository.findByEmail("admin@vincoeventi.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123!", "encoded_password")).thenReturn(true);
        when(jwtTools.createToken(user)).thenReturn("mocked_jwt_token");

        LoginResponseDTO response = authService.authenticateUser(dto, "127.0.0.1");

        assertNotNull(response);
        assertEquals("mocked_jwt_token", response.accessToken());
        assertEquals("admin@vincoeventi.com", response.email());
        assertEquals("ROLE_ADMIN", response.role());

        verify(loginAttemptService).loginSucceeded(anyString());
    }

    @Test
    void testAuthenticateUserInvalidCredentialsThrowsUnauthorized() {
        LoginDTO dto = new LoginDTO("admin@vincoeventi.com", "WrongPassword");
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("admin@vincoeventi.com")
                .password("encoded_password")
                .role(Role.ROLE_ADMIN)
                .build();

        when(loginAttemptService.isBlocked(anyString())).thenReturn(false);
        when(userRepository.findByEmail("admin@vincoeventi.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword", "encoded_password")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.authenticateUser(dto, "127.0.0.1"));
        verify(loginAttemptService).loginFailed(anyString());
    }

    @Test
    void testAuthenticateUserBlockedThrowsTooManyRequests() {
        LoginDTO dto = new LoginDTO("blocked@vincoeventi.com", "Password123!");
        when(loginAttemptService.isBlocked(anyString())).thenReturn(true);

        assertThrows(TooManyRequestsException.class, () -> authService.authenticateUser(dto, "127.0.0.1"));
    }

    @Test
    void testAuthenticateUserNullBodyOrEmptyCredentialsThrowsBadRequest() {
        assertThrows(BadRequestException.class, () -> authService.authenticateUser(null, "127.0.0.1"));

        LoginDTO dtoEmptyEmail = new LoginDTO("", "Password123!");
        assertThrows(BadRequestException.class, () -> authService.authenticateUser(dtoEmptyEmail, "127.0.0.1"));

        LoginDTO dtoNullPassword = new LoginDTO("admin@vincoeventi.com", null);
        assertThrows(BadRequestException.class, () -> authService.authenticateUser(dtoNullPassword, "127.0.0.1"));
    }
}
