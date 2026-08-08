package antonioschettini.backend.services;

import antonioschettini.backend.entities.User;
import antonioschettini.backend.exceptions.BadRequestException;
import antonioschettini.backend.exceptions.TooManyRequestsException;
import antonioschettini.backend.exceptions.UnauthorizedException;
import antonioschettini.backend.recordsDTO.LoginDTO;
import antonioschettini.backend.recordsDTO.LoginResponseDTO;
import antonioschettini.backend.repositories.UserRepository;
import antonioschettini.backend.security.JWTTools;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JWTTools jwtTools;

    @Autowired
    private LoginAttemptService loginAttemptService;

    public LoginResponseDTO authenticateUser(LoginDTO body, String clientIp) {
        if (body == null) {
            throw new BadRequestException("I dati di autenticazione non possono essere nulli!");
        }

        String userEmail = body.email() != null ? body.email().trim().toLowerCase() : "";
        if (userEmail.isBlank() || body.password() == null || body.password().isBlank()) {
            throw new BadRequestException("Email e password sono obbligatorie!");
        }

        String key = (clientIp != null ? clientIp : "") + "_" + userEmail;

        if (loginAttemptService.isBlocked(key)) {
            throw new TooManyRequestsException("Troppi tentativi di login falliti. L'accesso è temporaneamente bloccato per 15 minuti.");
        }

        User user = userRepository.findByEmail(userEmail).orElse(null);

        if (user == null || !passwordEncoder.matches(body.password(), user.getPassword())) {
            loginAttemptService.loginFailed(key);
            throw new UnauthorizedException("Credenziali non valide! Email o password errati.");
        }

        loginAttemptService.loginSucceeded(key);
        String token = jwtTools.createToken(user);
        return new LoginResponseDTO(token, user.getEmail(), user.getRole().name());
    }
}
