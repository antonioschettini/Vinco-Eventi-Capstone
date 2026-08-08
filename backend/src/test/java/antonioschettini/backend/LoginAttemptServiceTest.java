package antonioschettini.backend;

import antonioschettini.backend.services.LoginAttemptService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class LoginAttemptServiceTest {

    private LoginAttemptService loginAttemptService;

    @BeforeEach
    void setUp() {
        loginAttemptService = new LoginAttemptService();
    }

    @Test
    void testInitiallyNotBlocked() {
        assertFalse(loginAttemptService.isBlocked("127.0.0.1_user@test.com"));
        assertFalse(loginAttemptService.isBlocked(null));
    }

    @Test
    void testBlocksAfterMaxFailedAttempts() {
        String key = "192.168.1.1_test@vincoeventi.com";

        for (int i = 0; i < 4; i++) {
            loginAttemptService.loginFailed(key);
            assertFalse(loginAttemptService.isBlocked(key), "Non dovrebbe essere bloccato al tentativo " + (i + 1));
        }

        // 5° tentativo fallito -> blocco
        loginAttemptService.loginFailed(key);
        assertTrue(loginAttemptService.isBlocked(key), "Dovrebbe essere bloccato al 5° tentativo fallito");
    }

    @Test
    void testLoginSuccessResetsAttempts() {
        String key = "10.0.0.1_admin@vincoeventi.com";

        for (int i = 0; i < 4; i++) {
            loginAttemptService.loginFailed(key);
        }

        loginAttemptService.loginSucceeded(key);

        assertFalse(loginAttemptService.isBlocked(key));

        // Ora servono altri 5 tentativi prima di essere ribloccato
        for (int i = 0; i < 4; i++) {
            loginAttemptService.loginFailed(key);
        }
        assertFalse(loginAttemptService.isBlocked(key));
    }
}
