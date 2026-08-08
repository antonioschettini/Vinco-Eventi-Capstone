package antonioschettini.backend;

import antonioschettini.backend.entities.User;
import antonioschettini.backend.enums.Role;
import antonioschettini.backend.exceptions.UnauthorizedException;
import antonioschettini.backend.security.JWTTools;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class JWTToolsTest {

    private JWTTools jwtTools;
    private static final String TEST_SECRET = "vinco_eventi_super_secret_jwt_key_for_testing_purposes_123456789";

    @BeforeEach
    void setUp() {
        jwtTools = new JWTTools();
        ReflectionTestUtils.setField(jwtTools, "secret", TEST_SECRET);
    }

    @Test
    void testCreateTokenAndExtractClaims() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("admin@vincoeventi.com")
                .password("hashed_password_sample")
                .role(Role.ROLE_ADMIN)
                .build();

        String token = jwtTools.createToken(user);
        assertNotNull(token);
        assertFalse(token.isBlank());

        String email = jwtTools.extractSubjectFromToken(token);
        assertEquals("admin@vincoeventi.com", email);

        Claims claims = jwtTools.extractClaimsFromToken(token);
        assertEquals("ROLE_ADMIN", claims.get("role"));
        assertEquals(user.getId().toString(), claims.get("id"));
    }

    @Test
    void testVerifyValidTokenDoesNotThrow() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("test@vincoeventi.com")
                .password("hashed_password_sample")
                .role(Role.ROLE_ADMIN)
                .build();

        String token = jwtTools.createToken(user);
        assertDoesNotThrow(() -> jwtTools.verifyToken(token));
    }

    @Test
    void testVerifyCorruptedTokenThrowsUnauthorizedException() {
        String corruptedToken = "eyJhbGciOiJIUzI1NiJ9.invalidpayload.invalidsignature";
        assertThrows(UnauthorizedException.class, () -> jwtTools.verifyToken(corruptedToken));
    }

    @Test
    void testExtractSubjectFromInvalidTokenThrowsUnauthorizedException() {
        assertThrows(UnauthorizedException.class, () -> jwtTools.extractSubjectFromToken("invalid.token.here"));
    }
}
