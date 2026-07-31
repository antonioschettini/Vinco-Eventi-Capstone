package antonioschettini.backend.services;

import antonioschettini.backend.entities.User;
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

    public LoginResponseDTO authenticateUser(LoginDTO body) {
        User user = userRepository.findByEmail(body.email())
                .orElseThrow(() -> new UnauthorizedException("Credenziali non valide! Email o password errati."));

        if (!passwordEncoder.matches(body.password(), user.getPassword())) {
            throw new UnauthorizedException("Credenziali non valide! Email o password errati.");
        }

        String token = jwtTools.createToken(user);
        return new LoginResponseDTO(token, user.getEmail(), user.getRole().name());
    }
}
