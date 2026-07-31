package antonioschettini.backend.configuration;

import antonioschettini.backend.entities.ServiceEntity;
import antonioschettini.backend.entities.User;
import antonioschettini.backend.enums.Role;
import antonioschettini.backend.repositories.ServiceRepository;
import antonioschettini.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedAdminUser();
        seedDefaultServices();
    }

    private void seedAdminUser() {
        String adminEmail = "vincoeventi@gmail.com";
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User admin = User.builder()
                    .email(adminEmail)
                    .password(passwordEncoder.encode("RipBigVincoEventi!"))
                    .role(Role.ROLE_ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println(">>> Seed Admin eseguito con successo per: " + adminEmail);
        }
    }

    private void seedDefaultServices() {
        if (serviceRepository.count() == 0) {
            ServiceEntity basic = ServiceEntity.builder()
                    .titleIta("BASIC")
                    .titleEng("BASIC")
                    .subtitleIta("Pacchetto essenziale per intrattenimento e service audio/luci professionale")
                    .subtitleEng("Essential package for entertainment and professional audio/lighting service")
                    .category("PACKAGE")
                    .badge("BASIC")
                    .imageUrlIta("/src/assets/serviziOfferti/basicIta.png")
                    .imageUrlEng("/src/assets/serviziOfferti/basicEng.png")
                    .featuresIta("Service audio e luci;DJ (a scelta dal team VINCO EVENTI)")
                    .featuresEng("Audio and lighting service;DJ (selected from VINCO EVENTI team)")
                    .displayOrder(1)
                    .build();

            ServiceEntity plus = ServiceEntity.builder()
                    .titleIta("PLUS")
                    .titleEng("PLUS")
                    .subtitleIta("Soluzione completa con sottofondo musicale e strumenti solisti dal vivo")
                    .subtitleEng("Complete solution with background music and live solo instruments")
                    .category("PACKAGE")
                    .badge("PLUS")
                    .imageUrlIta("/src/assets/serviziOfferti/plusIta.png")
                    .imageUrlEng("/src/assets/serviziOfferti/plusEng.png")
                    .featuresIta("Service audio e luci;DJ (a scelta dal team VINCO EVENTI);Musica di sottofondo (Cerimonia, Aperitivo);Musicista a scelta di accompagnamento al djset (violino, sax, percussioni ecc.)")
                    .featuresEng("Audio and lighting service;DJ (selected from VINCO EVENTI team);Background music (Ceremony, Cocktail Hour);Musician of choice to accompany DJ set (violin, sax, percussion, etc.)")
                    .displayOrder(2)
                    .build();

            ServiceEntity full = ServiceEntity.builder()
                    .titleIta("FULL")
                    .titleEng("FULL")
                    .subtitleIta("L'esperienza totale di intrattenimento con band dal vivo, attrazioni speciali e scenografie luminose")
                    .subtitleEng("The total entertainment experience with live band, special attractions and scenic lighting")
                    .category("PACKAGE")
                    .badge("FULL")
                    .imageUrlIta("/src/assets/serviziOfferti/fullIta.png")
                    .imageUrlEng("/src/assets/serviziOfferti/fullEng.png")
                    .featuresIta("Service audio e luci;DJ (a scelta dal team VINCO EVENTI);Musica di sottofondo (Cerimonia, Aperitivo);Live Band [BROCHURE];Musicisti a scelta di accompagnamento al djset (violino, sax, percussioni ecc.);Photobooth, Videobooth 360°, Telefono degli Ospiti [BROCHURE];Illuminazioni, Fontane luminose sparkular, Fuochi d’artificio e Fumogeni Colorati [BROCHURE]")
                    .featuresEng("Audio and lighting service;DJ (selected from VINCO EVENTI team);Background music (Ceremony, Cocktail Hour);Live Band [BROCHURE];Musicians of choice to accompany DJ set (violin, sax, percussion, etc.);Photobooth, 360° Videobooth, Guest Audio Guestbook [BROCHURE];Lighting, Sparkular fountains, Fireworks & Colored smoke [BROCHURE]")
                    .brochureUrlIta("https://drive.google.com/file/d/1oXiV9ACF0xkTOiNtkyxHYVK0dVMDCvdw/view")
                    .brochureUrlEng("https://drive.google.com/file/d/1arWt9Ex8Wd7gDGAdKPkuKDNRMXiqBhIn/view")
                    .displayOrder(3)
                    .build();

            serviceRepository.saveAll(List.of(basic, plus, full));
            System.out.println(">>> Seed Servizi eseguito con successo (BASIC, PLUS, FULL).");
        }
    }
}
