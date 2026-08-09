package antonioschettini.backend.configuration;

import antonioschettini.backend.entities.GalleryItem;
import antonioschettini.backend.entities.ServiceEntity;
import antonioschettini.backend.entities.User;
import antonioschettini.backend.enums.Role;
import antonioschettini.backend.repositories.GalleryRepository;
import antonioschettini.backend.repositories.ServiceRepository;
import antonioschettini.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private GalleryRepository galleryRepository;

    @Autowired
    private antonioschettini.backend.repositories.QuoteRequestRepository quoteRequestRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Value("${admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) throws Exception {
        ensureAccountingTableSchema();
        seedAdminUser();
        seedDefaultServices();
        seedDefaultGalleryItems();
        seedDefaultQuoteRequests();
    }

    private void ensureAccountingTableSchema() {
        try {
            jdbcTemplate.execute("ALTER TABLE accounting_events ADD COLUMN IF NOT EXISTS has_dj_set BOOLEAN DEFAULT FALSE;");
            jdbcTemplate.execute("ALTER TABLE accounting_events ADD COLUMN IF NOT EXISTS data_fine_evento DATE;");
            jdbcTemplate.execute("UPDATE accounting_events SET data_fine_evento = data_evento WHERE data_fine_evento IS NULL;");
            jdbcTemplate.execute("UPDATE accounting_events SET has_dj_set = FALSE WHERE has_dj_set IS NULL;");
            System.out.println(">>> Schema tabella accounting_events migrato con successo (aggiunti campi has_dj_set e data_fine_evento).");
        } catch (Exception e) {
            System.err.println(">>> Avviso durante l'aggiornamento dello schema accounting_events: " + e.getMessage());
        }
    }

    private void seedAdminUser() {
        String adminEmail = "vincoeventi@gmail.com";
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User admin = User.builder()
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ROLE_ADMIN)
                    .build();

            userRepository.save(admin);
            System.out.println(">>> Utente Admin principale creato con successo: " + adminEmail);
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
                    .imageUrlIta("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738598/vinco_eventi_servizi/vvzgi7pa99ubd9np2fmy.png")
                    .imageUrlEng("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738601/vinco_eventi_servizi/fnrxkp5mpmdk8dcfz8mf.png")
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
                    .imageUrlIta("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738603/vinco_eventi_servizi/qev9reiqlzxtmpsiulsz.png")
                    .imageUrlEng("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738606/vinco_eventi_servizi/oppbybtrbqttfi2aprnz.png")
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
                    .imageUrlIta("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738608/vinco_eventi_servizi/ii4efs143kbixn2n2wnb.png")
                    .imageUrlEng("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738611/vinco_eventi_servizi/ckjzq11sbrvaojf5iskt.png")
                    .featuresIta("Service audio e luci;DJ (a scelta dal team VINCO EVENTI);Musica di sottofondo (Cerimonia, Aperitivo);Live Band;Musicisti a scelta di accompagnamento al djset (violino, sax, percussioni ecc.);Photobooth, Videobooth 360°, Telefono degli Ospiti;Illuminazioni, Fontane luminose sparkular, Fuochi d'artificio e Fumogeni Colorati")
                    .featuresEng("Audio and lighting service;DJ (selected from VINCO EVENTI team);Background music (Ceremony, Cocktail Hour);Live Band;Musicians of choice to accompany DJ set (violin, sax, percussion, etc.);Photobooth, 360° Videobooth, Guest Audio Guestbook;Lighting, Sparkular fountains, Fireworks & Colored smoke")
                    .brochureUrlIta(null)
                    .brochureUrlEng(null)
                    .displayOrder(3)
                    .build();

            serviceRepository.saveAll(List.of(basic, plus, full));
            System.out.println(">>> Seed Servizi eseguito con successo con URL Cloudinary corretti per BASIC, PLUS e FULL.");
        }
        // Se il DB è già popolato, non toccare nulla: le modifiche dell'admin sono preservate.
    }

    private String getPoster(String videoUrl) {
        if (videoUrl == null || videoUrl.isBlank()) return null;
        return videoUrl
                .replace("/video/upload/", "/video/upload/f_jpg,q_auto,w_720,so_2/")
                .replaceAll("\\.(mp4|mov|webm|avi|mkv)$", ".jpg");
    }

    private void seedDefaultGalleryItems() {
        List<GalleryItem> defaultItems = List.of(
                // 1: Video Enzo Singer - International Voice Black / Set ELETTRICO
                GalleryItem.builder()
                        .titleIta("Set ELETTRICO - International Voice Black")
                        .titleEng("ELECTRICAL Set - International Voice Black")
                        .subtitleIta("La carica travolgente del nostro set elettrico live con Vincenzo Colaluca")
                        .subtitleEng("The overwhelming energy of our live electric set with Vincenzo Colaluca")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785861122/vinco_eventi_galleria/rftirtcmqxgjsqsyu6fv.mp4")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785861122/vinco_eventi_galleria/rftirtcmqxgjsqsyu6fv.mp4"))
                        .category("djset")
                        .featured(true)
                        .displayOrder(1)
                        .build(),

                // 2: Video Live Band Stage
                GalleryItem.builder()
                        .titleIta("Crossroads Live Performance")
                        .titleEng("Crossroads Live Performance")
                        .subtitleIta("Spettacolo musicale d'impatto e ritmo coinvolgente sotto le luci")
                        .subtitleEng("High impact musical performance with engaging rhythm under the lights")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785739102/vinco_eventi_galleria/wdjpouelk0wgy8b7ayxb.mov")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785739102/vinco_eventi_galleria/wdjpouelk0wgy8b7ayxb.mov"))
                        .category("band")
                        .featured(true)
                        .displayOrder(2)
                        .build(),

                // 3: Video Violin Duo Live
                GalleryItem.builder()
                        .titleIta("Duo Violino & Performance Scenografica")
                        .titleEng("Violin Duo & Scenic Performance")
                        .subtitleIta("Eleganza e sonorità uniche per momenti indimenticabili")
                        .subtitleEng("Elegance and unique sounds for unforgettable moments")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785739094/vinco_eventi_galleria/vntlhm89bfzrdh2xgy2p.mov")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785739094/vinco_eventi_galleria/vntlhm89bfzrdh2xgy2p.mov"))
                        .category("band")
                        .featured(true)
                        .displayOrder(3)
                        .build(),

                // 4: Photo DJ Enzo at Pioneer Console (VERIFIED xp9vsaeg4vd8o7d2hzne.jpg)
                GalleryItem.builder()
                        .titleIta("Console DJ Set Enzo Colaluca")
                        .titleEng("Console DJ Set Enzo Colaluca")
                        .subtitleIta("Musica e regia professionale per la serata")
                        .subtitleEng("Professional music and direction for your evening")
                        .type("image")
                        .src("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738683/vinco_eventi_galleria/xp9vsaeg4vd8o7d2hzne.jpg")
                        .posterUrl("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738683/vinco_eventi_galleria/xp9vsaeg4vd8o7d2hzne.jpg")
                        .category("djset")
                        .featured(true)
                        .displayOrder(4)
                        .build(),

                // 5: Video DJ Pioneer Console
                GalleryItem.builder()
                        .titleIta("Exclusive Night Party Console")
                        .titleEng("Exclusive Night Party Console")
                        .subtitleIta("Regia musicale, luci e console per eventi esclusivi")
                        .subtitleEng("Music direction, lights and console for exclusive events")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785739072/vinco_eventi_galleria/r9e4uokfrbmpwadra7al.mov")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785739072/vinco_eventi_galleria/r9e4uokfrbmpwadra7al.mov"))
                        .category("djset")
                        .featured(true)
                        .displayOrder(5)
                        .build(),

                // 6: Video Live Vocalist
                GalleryItem.builder()
                        .titleIta("Esibizione Vocalist Live")
                        .titleEng("Live Vocalist Performance")
                        .subtitleIta("Emozione pura e voce dal vivo durante il party")
                        .subtitleEng("Pure emotion and live voice during the party")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785739059/vinco_eventi_galleria/ef6cr5xt3l4utt5ngzbz.mp4")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785739059/vinco_eventi_galleria/ef6cr5xt3l4utt5ngzbz.mp4"))
                        .category("band")
                        .featured(true)
                        .displayOrder(6)
                        .build(),

                // 7: Photo 5 Musicians with Double Bass in Garden (VERIFIED srdtwafxbjz3w9hdkxax.jpg)
                GalleryItem.builder()
                        .titleIta("I Nostri Musicisti dal Vivo")
                        .titleEng("Our Live Musicians")
                        .subtitleIta("Band acustica ed intrattenimento d'eccellenza in giardino")
                        .subtitleEng("Acoustic band and excellence entertainment in the garden")
                        .type("image")
                        .src("https://res.cloudinary.com/oe1bztwb/image/upload/v1785739092/vinco_eventi_galleria/srdtwafxbjz3w9hdkxax.jpg")
                        .posterUrl("https://res.cloudinary.com/oe1bztwb/image/upload/v1785739092/vinco_eventi_galleria/srdtwafxbjz3w9hdkxax.jpg")
                        .category("band")
                        .featured(true)
                        .displayOrder(7)
                        .build(),

                // 8: Video Sax Solo
                GalleryItem.builder()
                        .titleIta("Cocktail & Sax Show")
                        .titleEng("Cocktail & Sax Show")
                        .subtitleIta("Assolo di sax ed sonorità moderne illuminate")
                        .subtitleEng("Sax solo and modern illuminated sounds")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785739049/vinco_eventi_galleria/k6nrydw6lhpgaiztomgd.mov")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785739049/vinco_eventi_galleria/k6nrydw6lhpgaiztomgd.mov"))
                        .category("band")
                        .featured(false)
                        .displayOrder(8)
                        .build(),

                // 9: Video Electric Violin Solo
                GalleryItem.builder()
                        .titleIta("Live Energy & Violino")
                        .titleEng("Live Energy & Violin")
                        .subtitleIta("Performance violinistica ed energia pura sul palco")
                        .subtitleEng("Violin performance and pure energy on stage")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785739011/vinco_eventi_galleria/lq4emmoiddqhzpbgthq3.mov")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785739011/vinco_eventi_galleria/lq4emmoiddqhzpbgthq3.mov"))
                        .category("live")
                        .featured(false)
                        .displayOrder(9)
                        .build(),

                // 10: Photo Starry Sky Lights Over Garden (VERIFIED eo7tqi5jal8lbxvma4bo.jpg)
                GalleryItem.builder()
                        .titleIta("Illuminazione Cielo Stellato")
                        .titleEng("Starry Sky Lighting")
                        .subtitleIta("Atmosfera magica per la cena all'aperto")
                        .subtitleEng("Magical atmosphere for outdoor dinner")
                        .type("image")
                        .src("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738823/vinco_eventi_galleria/eo7tqi5jal8lbxvma4bo.jpg")
                        .posterUrl("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738823/vinco_eventi_galleria/eo7tqi5jal8lbxvma4bo.jpg")
                        .category("decor")
                        .featured(false)
                        .displayOrder(10)
                        .build(),

                // 11: Video Wedding Party Sax
                GalleryItem.builder()
                        .titleIta("Wedding Party & Sax Live")
                        .titleEng("Wedding Party & Live Sax")
                        .subtitleIta("I momenti più belli ed emozionanti del party tra le luci")
                        .subtitleEng("The best and most exciting moments of the party in lights")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785739001/vinco_eventi_galleria/ufpb1xiseuvs1lsxonad.mp4")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785739001/vinco_eventi_galleria/ufpb1xiseuvs1lsxonad.mp4"))
                        .category("wedding")
                        .featured(false)
                        .displayOrder(11)
                        .build(),

                // 12: Video Light Tunnel Dancefloor
                GalleryItem.builder()
                        .titleIta("Scenografia Luci & Tunnel Stellato")
                        .titleEng("Lighting Design & Starry Tunnel")
                        .subtitleIta("Pista di luci ed allestimento per una serata indimenticabile")
                        .subtitleEng("Dancefloor lighting and setup for an unforgettable night")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738970/vinco_eventi_galleria/zhhw5yesgmrwsift9sow.mov")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738970/vinco_eventi_galleria/zhhw5yesgmrwsift9sow.mov"))
                        .category("lightshow")
                        .featured(false)
                        .displayOrder(12)
                        .build(),

                // 13: Photo Giant Illuminated Rosette Arch (VERIFIED d34yekgmypunr4au4xwv.jpg)
                GalleryItem.builder()
                        .titleIta("Rosone Luminoso & Scenografia Sposi")
                        .titleEng("Illuminated Rosette & Couple Scenery")
                        .subtitleIta("Scenografia di luci d'autore e momento romantico al buio")
                        .subtitleEng("Signature light architecture and romantic moment in the dark")
                        .type("image")
                        .src("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738910/vinco_eventi_galleria/d34yekgmypunr4au4xwv.jpg")
                        .posterUrl("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738910/vinco_eventi_galleria/d34yekgmypunr4au4xwv.jpg")
                        .category("wedding")
                        .featured(false)
                        .displayOrder(13)
                        .build(),

                // 14: Video Fireworks Show Sposi
                GalleryItem.builder()
                        .titleIta("Live Vibes & Scenografia Sposi")
                        .titleEng("Live Vibes & Wedding Scenery")
                        .subtitleIta("La magia dell'evento con spettacoli pirotecnici")
                        .subtitleEng("The magic of the event with pyrotechnic displays")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738959/vinco_eventi_galleria/afrx0hb5jnevhbudiieo.mp4")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738959/vinco_eventi_galleria/afrx0hb5jnevhbudiieo.mp4"))
                        .category("live")
                        .featured(true)
                        .displayOrder(14)
                        .build(),

                // 15: Video Candlelit Dinner Live Acoustics
                GalleryItem.builder()
                        .titleIta("Live Acoustics & Violini Aperitivo")
                        .titleEng("Live Acoustics & Cocktail Violins")
                        .subtitleIta("Musica dal vivo elegante durante il cocktail in giardino")
                        .subtitleEng("Elegant live music during cocktail hour in the garden")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738945/vinco_eventi_galleria/etesqmzgylrapntrtrbf.mov")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738945/vinco_eventi_galleria/etesqmzgylrapntrtrbf.mov"))
                        .category("band")
                        .featured(false)
                        .displayOrder(15)
                        .build(),

                // 16: Video Female Singer Guitar
                GalleryItem.builder()
                        .titleIta("Atmosphere & Voice Live")
                        .titleEng("Atmosphere & Voice Live")
                        .subtitleIta("Voce ed intrattenimento per un'atmosfera elegante")
                        .subtitleEng("Voice and entertainment for an elegant atmosphere")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738935/vinco_eventi_galleria/vswvgslfquuykapxnr3d.mp4")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738935/vinco_eventi_galleria/vswvgslfquuykapxnr3d.mp4"))
                        .category("live")
                        .featured(true)
                        .displayOrder(16)
                        .build(),

                // 17: Photo Cake Cutting & Sparkular Fountains (VERIFIED difwya2hiwgfwlsn6tc4.jpg)
                GalleryItem.builder()
                        .titleIta("Taglio Torta & Fontane Sparkular")
                        .titleEng("Cake Cutting & Sparkular Fountains")
                        .subtitleIta("Il culmine dei festeggiamenti con fontane di scintille a freddo")
                        .subtitleEng("The climax of the celebrations with cold spark fountains")
                        .type("image")
                        .src("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738957/vinco_eventi_galleria/difwya2hiwgfwlsn6tc4.jpg")
                        .posterUrl("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738957/vinco_eventi_galleria/difwya2hiwgfwlsn6tc4.jpg")
                        .category("wedding")
                        .featured(false)
                        .displayOrder(17)
                        .build(),

                // 18: Video Sparkular Smoke Effects Dancefloor
                GalleryItem.builder()
                        .titleIta("Fumogeni & Party Night")
                        .titleEng("Smoke Effects & Party Night")
                        .subtitleIta("Effetti speciali e pista di ballo per gli invitati")
                        .subtitleEng("Special effects and dancefloor for guests")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738913/vinco_eventi_galleria/tuu3jqx5c72wyf9ldhbg.mov")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738913/vinco_eventi_galleria/tuu3jqx5c72wyf9ldhbg.mov"))
                        .category("effects")
                        .featured(true)
                        .displayOrder(18)
                        .build(),

                // 19: Video Full Band Live Show
                GalleryItem.builder()
                        .titleIta("Festeggiamenti & Live Show Band")
                        .titleEng("Celebrations & Live Show Band")
                        .subtitleIta("Spettacolo e divertimento per tutti gli invitati")
                        .subtitleEng("Show and fun for all guests")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738895/vinco_eventi_galleria/owjxvhnylisvs0hiyxar.mp4")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738895/vinco_eventi_galleria/owjxvhnylisvs0hiyxar.mp4"))
                        .category("band")
                        .featured(false)
                        .displayOrder(19)
                        .build(),

                // 20: Photo Colored Smoke & Bride Kiss at Beetle Car (VERIFIED eeaxtuj0fwjqzspt38fd.jpg)
                GalleryItem.builder()
                        .titleIta("Fumogeni Colorati & Primo Bacio")
                        .titleEng("Colored Smoke & First Kiss")
                        .subtitleIta("Esplosione di colori scenografica al Maggiolino d'epoca")
                        .subtitleEng("Spectacular burst of colors at the vintage Beetle car")
                        .type("image")
                        .src("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738998/vinco_eventi_galleria/eeaxtuj0fwjqzspt38fd.jpg")
                        .posterUrl("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738998/vinco_eventi_galleria/eeaxtuj0fwjqzspt38fd.jpg")
                        .category("effects")
                        .featured(false)
                        .displayOrder(20)
                        .build(),

                // 21: Video Glitter Dress Singer
                GalleryItem.builder()
                        .titleIta("Live Performance Cantante")
                        .titleEng("Live Singer Performance")
                        .subtitleIta("Voce in abito glitter sul palco live")
                        .subtitleEng("Live voice in glitter dress on stage")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738827/vinco_eventi_galleria/slfbcr7zinspj5coflaa.mov")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738827/vinco_eventi_galleria/slfbcr7zinspj5coflaa.mov"))
                        .category("live")
                        .featured(false)
                        .displayOrder(21)
                        .build(),

                // 22: Video Green Neon Sign Stage
                GalleryItem.builder()
                        .titleIta("Live Show & Coinvolgimento")
                        .titleEng("Live Show & Engagement")
                        .subtitleIta("Performance ed energia con la regia di VINCO EVENTI")
                        .subtitleEng("Performance and energy directed by VINCO EVENTI")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738801/vinco_eventi_galleria/so2xar04vohxdsc0lulo.mov")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738801/vinco_eventi_galleria/so2xar04vohxdsc0lulo.mov"))
                        .category("live")
                        .featured(false)
                        .displayOrder(22)
                        .build(),

                // 23: Photo Female Vocalist Singing Live (VERIFIED eb0ki9vvv83w4nlhybid.webp)
                GalleryItem.builder()
                        .titleIta("Voce & Performance Vocalist Live")
                        .titleEng("Voice & Vocalist Live Performance")
                        .subtitleIta("Voce ed intrattenimento sul palco live durante il party")
                        .subtitleEng("Voice and stage entertainment live during the party")
                        .type("image")
                        .src("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738784/vinco_eventi_galleria/eb0ki9vvv83w4nlhybid.webp")
                        .posterUrl("https://res.cloudinary.com/oe1bztwb/image/upload/v1785738784/vinco_eventi_galleria/eb0ki9vvv83w4nlhybid.webp")
                        .category("live")
                        .featured(false)
                        .displayOrder(23)
                        .build(),

                // 24: Video Outdoor Sunset Party
                GalleryItem.builder()
                        .titleIta("Cocktail Party & Pista Aperta")
                        .titleEng("Cocktail Party & Open Dancefloor")
                        .subtitleIta("Musica e divertimento all'aperto per gli ospiti")
                        .subtitleEng("Music and outdoor fun for guests")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738787/vinco_eventi_galleria/uiqet8umjkjq3b4wej1c.mp4")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738787/vinco_eventi_galleria/uiqet8umjkjq3b4wej1c.mp4"))
                        .category("djset")
                        .featured(false)
                        .displayOrder(24)
                        .build(),

                // 25: Video Guitar & Singer Dark Suits
                GalleryItem.builder()
                        .titleIta("Live Show Chitarra & Cantante")
                        .titleEng("Live Guitar & Singer Show")
                        .subtitleIta("Chitarrista e voce dal vivo sul palco")
                        .subtitleEng("Guitarist and live vocals on stage")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738745/vinco_eventi_galleria/flg3kduqpo9yoq79fjom.mp4")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738745/vinco_eventi_galleria/flg3kduqpo9yoq79fjom.mp4"))
                        .category("band")
                        .featured(false)
                        .displayOrder(25)
                        .build(),

                // 26: Video Singer Dancing on Dancefloor
                GalleryItem.builder()
                        .titleIta("Show dal Vivo in Pista")
                        .titleEng("Live Performance Show")
                        .subtitleIta("Coinvolgimento e spettacolo per tutti gli ospiti")
                        .subtitleEng("Engagement and show for all guests")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738686/vinco_eventi_galleria/oiuv1egd7bx5atkiwzbb.mov")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738686/vinco_eventi_galleria/oiuv1egd7bx5atkiwzbb.mov"))
                        .category("live")
                        .featured(false)
                        .displayOrder(26)
                        .build(),

                // 27: Photo 5-piece Rock Band in Historic Hall (VERIFIED pdz6t0sfegbelnr12wb3.png)
                GalleryItem.builder()
                        .titleIta("Live Band Show in Sala Storica")
                        .titleEng("Live Band Show in Historic Hall")
                        .subtitleIta("Spettacolo musicale dal vivo completo e scenografia luci")
                        .subtitleEng("Full live music show and light production")
                        .type("image")
                        .src("https://res.cloudinary.com/oe1bztwb/image/upload/v1785739100/vinco_eventi_galleria/pdz6t0sfegbelnr12wb3.png")
                        .posterUrl("https://res.cloudinary.com/oe1bztwb/image/upload/v1785739100/vinco_eventi_galleria/pdz6t0sfegbelnr12wb3.png")
                        .category("band")
                        .featured(false)
                        .displayOrder(27)
                        .build(),

                // 28: Video Clubbing Night
                GalleryItem.builder()
                        .titleIta("Party & Clubbing Night")
                        .titleEng("Party & Clubbing Night")
                        .subtitleIta("Pista piena e divertimento assicurato")
                        .subtitleEng("Full dancefloor and guaranteed fun")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738661/vinco_eventi_galleria/uwi6mmwruee6037hbsuo.mp4")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738661/vinco_eventi_galleria/uwi6mmwruee6037hbsuo.mp4"))
                        .category("djset")
                        .featured(false)
                        .displayOrder(28)
                        .build(),

                // 29: Photo 4 Acoustic Band Musicians under Palm Trees (VERIFIED txbfapyv9ujglspk13eo.jpg)
                GalleryItem.builder()
                        .titleIta("Band Acustica in Giardino")
                        .titleEng("Acoustic Band in the Garden")
                        .subtitleIta("Sonorità itineranti ed eleganza acustica tra il verde")
                        .subtitleEng("Itinerant sound and acoustic elegance among the greenery")
                        .type("image")
                        .src("https://res.cloudinary.com/oe1bztwb/image/upload/v1785739047/vinco_eventi_galleria/txbfapyv9ujglspk13eo.jpg")
                        .posterUrl("https://res.cloudinary.com/oe1bztwb/image/upload/v1785739047/vinco_eventi_galleria/txbfapyv9ujglspk13eo.jpg")
                        .category("band")
                        .featured(false)
                        .displayOrder(29)
                        .build(),

                // 30: Video Acoustic Duo Live Session
                GalleryItem.builder()
                        .titleIta("Live Session & Duo Acustico")
                        .titleEng("Live Session & Acoustic Duo")
                        .subtitleIta("Musica e passione al servizio del tuo evento")
                        .subtitleEng("Music and passion at the service of your event")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738637/vinco_eventi_galleria/jlqctoerysynttow2lpf.mov")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738637/vinco_eventi_galleria/jlqctoerysynttow2lpf.mov"))
                        .category("band")
                        .featured(false)
                        .displayOrder(30)
                        .build(),

                // 31: Photo 5-piece Street/Brass Band with Megaphone (VERIFIED ftaaf6e3ry3wykbvdxdn.webp)
                GalleryItem.builder()
                        .titleIta("Brass & Street Band Entertainment")
                        .titleEng("Brass & Street Band Entertainment")
                        .subtitleIta("Coinvolgimento itinerante travolgente con megafono e fiati")
                        .subtitleEng("Overwhelming roaming entertainment with brass and megaphone")
                        .type("image")
                        .src("https://res.cloudinary.com/oe1bztwb/image/upload/v1785739108/vinco_eventi_galleria/ftaaf6e3ry3wykbvdxdn.webp")
                        .posterUrl("https://res.cloudinary.com/oe1bztwb/image/upload/v1785739108/vinco_eventi_galleria/ftaaf6e3ry3wykbvdxdn.webp")
                        .category("band")
                        .featured(false)
                        .displayOrder(31)
                        .build(),

                // 32: Video International Voice & Live Show (#32)
                GalleryItem.builder()
                        .titleIta("International Voice & Live Show")
                        .titleEng("International Voice & Live Show")
                        .subtitleIta("Spettacolo internazionale con la regia musicale di Enzo Colaluca")
                        .subtitleEng("International show with music direction by Enzo Colaluca")
                        .type("video")
                        .src("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738600/vinco_eventi_galleria/ynbarymzdd1lu9cvycfu.mov")
                        .posterUrl(getPoster("https://res.cloudinary.com/oe1bztwb/video/upload/v1785738600/vinco_eventi_galleria/ynbarymzdd1lu9cvycfu.mov"))
                        .category("live")
                        .featured(false)
                        .displayOrder(32)
                        .build()
        );

        if (galleryRepository.count() == 0) {
            galleryRepository.saveAll(defaultItems);
            System.out.println(">>> Seed Galleria eseguito con successo con tutti i 32 elementi 100% allineati.");
        }
    }

    private void seedDefaultQuoteRequests() {
        // Nessun seeding automatico di preventivi fasulli/demo.
        // I preventivi arrivano esclusivamente dal form utente sul sito o dalla migrazione iniziale.
        // Se l'Admin cancella tutti i preventivi da DB, la tabella rimane a 0 in modo 100% scalabile.
    }
}
