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
    private PasswordEncoder passwordEncoder;

    @Value("${admin.password:RipBigVincoEventi!}")
    private String adminPassword;

    @Override
    public void run(String... args) throws Exception {
        seedAdminUser();
        seedDefaultServices();
        seedDefaultGalleryItems();
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
            System.out.println(">>> Seed Admin eseguito con successo per: " + adminEmail);
        }
    }

    private void seedDefaultServices() {
        boolean hasLocalPaths = serviceRepository.findAll().stream()
                .anyMatch(s -> (s.getImageUrlIta() != null && s.getImageUrlIta().startsWith("/src/assets")));

        if (serviceRepository.count() == 0 || hasLocalPaths) {
            serviceRepository.deleteAll();
            ServiceEntity basic = ServiceEntity.builder()
                    .titleIta("BASIC")
                    .titleEng("BASIC")
                    .subtitleIta("Pacchetto essenziale per intrattenimento e service audio/luci professionale")
                    .subtitleEng("Essential package for entertainment and professional audio/lighting service")
                    .category("PACKAGE")
                    .badge("BASIC")
                    .imageUrlIta("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_servizi/basicIta.png")
                    .imageUrlEng("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_servizi/basicEng.png")
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
                    .imageUrlIta("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_servizi/plusIta.png")
                    .imageUrlEng("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_servizi/plusEng.png")
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
                    .imageUrlIta("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_servizi/fullIta.png")
                    .imageUrlEng("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_servizi/fullEng.png")
                    .featuresIta("Service audio e luci;DJ (a scelta dal team VINCO EVENTI);Musica di sottofondo (Cerimonia, Aperitivo);Live Band [BROCHURE];Musicisti a scelta di accompagnamento al djset (violino, sax, percussioni ecc.);Photobooth, Videobooth 360°, Telefono degli Ospiti [BROCHURE];Illuminazioni, Fontane luminose sparkular, Fuochi d’artificio e Fumogeni Colorati [BROCHURE]")
                    .featuresEng("Audio and lighting service;DJ (selected from VINCO EVENTI team);Background music (Ceremony, Cocktail Hour);Live Band [BROCHURE];Musicians of choice to accompany DJ set (violin, sax, percussion, etc.);Photobooth, 360° Videobooth, Guest Audio Guestbook [BROCHURE];Lighting, Sparkular fountains, Fireworks & Colored smoke [BROCHURE]")
                    .brochureUrlIta("https://drive.google.com/file/d/1oXiV9ACF0xkTOiNtkyxHYVK0dVMDCvdw/view")
                    .brochureUrlEng("https://drive.google.com/file/d/1arWt9Ex8Wd7gDGAdKPkuKDNRMXiqBhIn/view")
                    .displayOrder(3)
                    .build();

            serviceRepository.saveAll(List.of(basic, plus, full));
            System.out.println(">>> Seed Servizi eseguito con successo con URL Cloudinary (BASIC, PLUS, FULL).");
        }
    }

    private void seedDefaultGalleryItems() {
        boolean hasLocalPaths = galleryRepository.findAll().stream()
                .anyMatch(g -> (g.getSrc() != null && g.getSrc().startsWith("/src/assets")));

        if (galleryRepository.count() < 31 || hasLocalPaths) {
            galleryRepository.deleteAll();
            List<GalleryItem> items = List.of(
                    // 1
                    GalleryItem.builder()
                            .titleIta("Set ELETTRICO - Promo on Fire!")
                            .titleEng("ELECTRICAL Set - Promo on Fire!")
                            .subtitleIta("La carica travolgente del nostro set elettrico live (minuto 1:00)")
                            .subtitleEng("The overwhelming energy of our live electric set (start minute 1:00)")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571180/vinco_eventi_galleria/vaz9o4beyovfhcr5triw.mov")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/bkimedchkfe02pqhm5xi.jpg")
                            .category("djset")
                            .featured(true)
                            .startTime(60.0)
                            .displayOrder(1)
                            .build(),
                    // 2
                    GalleryItem.builder()
                            .titleIta("Crossroads Live Performance")
                            .titleEng("Crossroads Live Performance")
                            .subtitleIta("Spettacolo musicale d'impatto e ritmo coinvolgente")
                            .subtitleEng("High impact musical performance with engaging rhythm")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571802/vinco_eventi_galleria/vbybme8q65ywkaisvhfo.mov")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/lemqus6xy5uc4z1uqstr.jpg")
                            .category("band")
                            .featured(true)
                            .displayOrder(2)
                            .build(),
                    // 3
                    GalleryItem.builder()
                            .titleIta("DJ Set Exclusive Live")
                            .titleEng("DJ Set Exclusive Live")
                            .subtitleIta("Carica ed energia per eventi unici")
                            .subtitleEng("Energy and passion for unique events")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571184/vinco_eventi_galleria/kz0w0hx5a8lhts8czb6l.mp4")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/bkimedchkfe02pqhm5xi.jpg")
                            .category("djset")
                            .featured(true)
                            .displayOrder(3)
                            .build(),
                    // 4
                    GalleryItem.builder()
                            .titleIta("Console DJ Set")
                            .titleEng("Console DJ Set")
                            .subtitleIta("Musica e regia per la serata")
                            .subtitleEng("Music and direction for your evening")
                            .type("image")
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/bkimedchkfe02pqhm5xi.jpg")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/bkimedchkfe02pqhm5xi.jpg")
                            .category("djset")
                            .featured(true)
                            .displayOrder(4)
                            .build(),
                    // 5
                    GalleryItem.builder()
                            .titleIta("Exclusive Night Party")
                            .titleEng("Exclusive Night Party")
                            .subtitleIta("Pista piena e grande energia per una serata indimenticabile")
                            .subtitleEng("Packed dancefloor and intense energy for an unforgettable night")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571817/vinco_eventi_galleria/gdj0cjbkmoakcpipxhmq.mov")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/bkimedchkfe02pqhm5xi.jpg")
                            .category("djset")
                            .featured(true)
                            .displayOrder(5)
                            .build(),
                    // 6
                    GalleryItem.builder()
                            .titleIta("Live Band Night Performance")
                            .titleEng("Live Band Night Performance")
                            .subtitleIta("Spettacolo e musica dal vivo")
                            .subtitleEng("Live show and music performance")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571191/vinco_eventi_galleria/un507woyugpftspgjajb.mp4")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/cywyjakbmcqh73tamzhg.webp")
                            .category("band")
                            .featured(true)
                            .displayOrder(6)
                            .build(),
                    // 7
                    GalleryItem.builder()
                            .titleIta("Esibizione Vocalist & Cantante")
                            .titleEng("Vocalist & Singer Performance")
                            .subtitleIta("Emozione pura durante il party")
                            .subtitleEng("Pure emotion during the party")
                            .type("image")
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/cywyjakbmcqh73tamzhg.webp")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/cywyjakbmcqh73tamzhg.webp")
                            .category("band")
                            .featured(true)
                            .displayOrder(7)
                            .build(),
                    // 8
                    GalleryItem.builder()
                            .titleIta("Luci LED & Console Show")
                            .titleEng("LED Lights & Console Show")
                            .subtitleIta("Scenografie luminose e sound system")
                            .subtitleEng("Lighting design and sound system")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571198/vinco_eventi_galleria/mulpxihugmquppcreyp5.mp4")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/e3chehntj5aesbx8gvpz.jpg")
                            .category("lightshow")
                            .featured(false)
                            .displayOrder(8)
                            .build(),
                    // 9
                    GalleryItem.builder()
                            .titleIta("Live Energy & Dj Set")
                            .titleEng("Live Energy & Dj Set")
                            .subtitleIta("Intrattenimento e regia musicale sul palco")
                            .subtitleEng("Entertainment and musical direction on stage")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571204/vinco_eventi_galleria/tyz1zx989veguuhhfvdq.mov")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/bkimedchkfe02pqhm5xi.jpg")
                            .category("live")
                            .featured(false)
                            .displayOrder(9)
                            .build(),
                    // 10
                    GalleryItem.builder()
                            .titleIta("Illuminazione Cielo Stellato")
                            .titleEng("Starry Sky Lighting")
                            .subtitleIta("Atmosfera magica per la cena all'aperto")
                            .subtitleEng("Magical atmosphere for outdoor dinner")
                            .type("image")
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/e3chehntj5aesbx8gvpz.jpg")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/e3chehntj5aesbx8gvpz.jpg")
                            .category("decor")
                            .featured(false)
                            .displayOrder(10)
                            .build(),
                    // 11
                    GalleryItem.builder()
                            .titleIta("Wedding Party Highlights")
                            .titleEng("Wedding Party Highlights")
                            .subtitleIta("I momenti più belli ed emozionanti del party")
                            .subtitleEng("The best and most exciting moments of the party")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571212/vinco_eventi_galleria/wnqshvydnagmut5a4bw1.mov")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/vxjn1vwb9lvq4cljidu3.jpg")
                            .category("wedding")
                            .featured(false)
                            .displayOrder(11)
                            .build(),
                    // 12
                    GalleryItem.builder()
                            .titleIta("Party & Clubbing Vibe")
                            .titleEng("Party & Clubbing Vibe")
                            .subtitleIta("Pista piena e divertimento assicurato")
                            .subtitleEng("Full dancefloor and guaranteed fun")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571218/vinco_eventi_galleria/qfqfjc1lalwtrgnuwj0r.mp4")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/bkimedchkfe02pqhm5xi.jpg")
                            .category("djset")
                            .featured(false)
                            .displayOrder(12)
                            .build(),
                    // 13
                    GalleryItem.builder()
                            .titleIta("Il Primo Bacio degli Sposi")
                            .titleEng("The Bride & Groom First Kiss")
                            .subtitleIta("Momento romantico accompagnato dalla musica")
                            .subtitleEng("Romantic moment accompanied by music")
                            .type("image")
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/vxjn1vwb9lvq4cljidu3.jpg")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/vxjn1vwb9lvq4cljidu3.jpg")
                            .category("wedding")
                            .featured(false)
                            .displayOrder(13)
                            .build(),
                    // 14
                    GalleryItem.builder()
                            .titleIta("Live Vibes & Social Reel")
                            .titleEng("Live Vibes & Social Reel")
                            .subtitleIta("La magia dell'evento vista da vicino")
                            .subtitleEng("The magic of the event up close")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571223/vinco_eventi_galleria/h6lvl6whetifsprevnn0.mov")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/cywyjakbmcqh73tamzhg.webp")
                            .category("live")
                            .featured(true)
                            .displayOrder(14)
                            .build(),
                    // 15
                    GalleryItem.builder()
                            .titleIta("Live Acoustics Aperitivo")
                            .titleEng("Live Acoustics Cocktail Hour")
                            .subtitleIta("Musica dal vivo elegante durante il cocktail")
                            .subtitleEng("Elegant live music during cocktail hour")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571226/vinco_eventi_galleria/e5cd0uz0698qnnwnmgqs.mp4")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/lemqus6xy5uc4z1uqstr.jpg")
                            .category("band")
                            .featured(false)
                            .displayOrder(15)
                            .build(),
                    // 16
                    GalleryItem.builder()
                            .titleIta("Atmosphere & Lights")
                            .titleEng("Atmosphere & Lights")
                            .subtitleIta("Service luci ed effetti per un'atmosfera elegante")
                            .subtitleEng("Lighting and effects service for an elegant atmosphere")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571229/vinco_eventi_galleria/hlxlk2jz64hd7pbq4u5k.mov")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/e3chehntj5aesbx8gvpz.jpg")
                            .category("lightshow")
                            .featured(true)
                            .displayOrder(16)
                            .build(),
                    // 17
                    GalleryItem.builder()
                            .titleIta("Brindisi & Taglio Torta")
                            .titleEng("Toast & Cake Cutting")
                            .subtitleIta("Il culmine dei festeggiamenti")
                            .subtitleEng("The climax of the celebrations")
                            .type("image")
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/uye6veyu60euff4oyynj.jpg")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/uye6veyu60euff4oyynj.jpg")
                            .category("wedding")
                            .featured(false)
                            .displayOrder(17)
                            .build(),
                    // 18
                    GalleryItem.builder()
                            .titleIta("Fumogeni & Effetti Scenografici")
                            .titleEng("Smoke Effects & Special Effects")
                            .subtitleIta("Effetti speciali per ingressi e momenti clou")
                            .subtitleEng("Special effects for grand entrances and key moments")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571234/vinco_eventi_galleria/vunxsnh0lc2jkqdxuop9.mp4")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/nzf2avveppyfgavf5dlb.jpg")
                            .category("effects")
                            .featured(true)
                            .displayOrder(18)
                            .build(),
                    // 19
                    GalleryItem.builder()
                            .titleIta("Festeggiamenti in Musica")
                            .titleEng("Music Celebrations")
                            .subtitleIta("Ritmo e divertimento scatenato per gli invitati")
                            .subtitleEng("Rhythm and wild fun for the guests")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571237/vinco_eventi_galleria/m86cnpmuhvavvo6u4ccd.mov")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/uye6veyu60euff4oyynj.jpg")
                            .category("djset")
                            .featured(false)
                            .displayOrder(19)
                            .build(),
                    // 20
                    GalleryItem.builder()
                            .titleIta("Fumogeni Colorati Sposi")
                            .titleEng("Colored Smoke Effects")
                            .subtitleIta("Esplosione di colori per un ricordo indimenticabile")
                            .subtitleEng("Burst of colors for an unforgettable memory")
                            .type("image")
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/nzf2avveppyfgavf5dlb.jpg")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/nzf2avveppyfgavf5dlb.jpg")
                            .category("effects")
                            .featured(false)
                            .displayOrder(20)
                            .build(),
                    // 21
                    GalleryItem.builder()
                            .titleIta("DJ Set & Live Mix")
                            .titleEng("DJ Set & Live Mix")
                            .subtitleIta("Selezione musicale personalizzata")
                            .subtitleEng("Customized music selection")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571242/vinco_eventi_galleria/yuhpya4xt3ipx3znwyl0.mp4")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/bkimedchkfe02pqhm5xi.jpg")
                            .category("djset")
                            .featured(false)
                            .displayOrder(21)
                            .build(),
                    // 22
                    GalleryItem.builder()
                            .titleIta("Live Show Console")
                            .titleEng("Live Show Console")
                            .subtitleIta("Performance ed energia con la regia di VINCO EVENTI")
                            .subtitleEng("Performance and energy directed by VINCO EVENTI")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571246/vinco_eventi_galleria/y2e73pox3aetvywkyfre.mov")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/bkimedchkfe02pqhm5xi.jpg")
                            .category("djset")
                            .featured(false)
                            .displayOrder(22)
                            .build(),
                    // 23
                    GalleryItem.builder()
                            .titleIta("Band Live Aperitivo")
                            .titleEng("Live Band Cocktail Hour")
                            .subtitleIta("Ritmi lounge e pop acustico")
                            .subtitleEng("Lounge rhythms and acoustic pop")
                            .type("image")
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/lemqus6xy5uc4z1uqstr.jpg")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/lemqus6xy5uc4z1uqstr.jpg")
                            .category("band")
                            .featured(false)
                            .displayOrder(23)
                            .build(),
                    // 24
                    GalleryItem.builder()
                            .titleIta("DJ Set Moment")
                            .titleEng("DJ Set Moment")
                            .subtitleIta("Sound system e selezione musicale d'eccellenza")
                            .subtitleEng("Sound system and music selection of excellence")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571250/vinco_eventi_galleria/deljvnzddlc8arskk15z.mov")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/bkimedchkfe02pqhm5xi.jpg")
                            .category("djset")
                            .featured(false)
                            .displayOrder(24)
                            .build(),
                    // 25
                    GalleryItem.builder()
                            .titleIta("Live Show Finale")
                            .titleEng("Live Show Finale")
                            .subtitleIta("Gran finale con la band al completo")
                            .subtitleEng("Grand finale with full band")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571253/vinco_eventi_galleria/tacxrqeuinco1mfvsemr.mp4")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/cywyjakbmcqh73tamzhg.webp")
                            .category("band")
                            .featured(false)
                            .displayOrder(25)
                            .build(),
                    // 26
                    GalleryItem.builder()
                            .titleIta("Show dal Vivo")
                            .titleEng("Live Performance Show")
                            .subtitleIta("Coinvolgimento e spettacolo per tutti gli ospiti")
                            .subtitleEng("Engagement and show for all guests")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571256/vinco_eventi_galleria/lf8rkdrcvgu2fjl2glo3.mov")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/cywyjakbmcqh73tamzhg.webp")
                            .category("live")
                            .featured(false)
                            .displayOrder(26)
                            .build(),
                    // 27
                    GalleryItem.builder()
                            .titleIta("Cocktail & Sax Vibe")
                            .titleEng("Cocktail & Sax Vibe")
                            .subtitleIta("Eleganza e sonorità moderne")
                            .subtitleEng("Elegance and modern sounds")
                            .type("image")
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/mufw0vb5wyjfm72yzpop.jpg")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/mufw0vb5wyjfm72yzpop.jpg")
                            .category("band")
                            .featured(false)
                            .displayOrder(27)
                            .build(),
                    // 28
                    GalleryItem.builder()
                            .titleIta("Live Session Highlight")
                            .titleEng("Live Session Highlight")
                            .subtitleIta("Un assaggio del nostro intrattenimento dal vivo")
                            .subtitleEng("A taste of our live entertainment")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571260/vinco_eventi_galleria/o0n56p2rf3rfe0kexuvi.mov")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/lemqus6xy5uc4z1uqstr.jpg")
                            .category("band")
                            .featured(false)
                            .displayOrder(28)
                            .build(),
                    // 29
                    GalleryItem.builder()
                            .titleIta("I Nostri Musicisti")
                            .titleEng("Our Musicians")
                            .subtitleIta("Professionisti al servizio del tuo evento")
                            .subtitleEng("Professionals at the service of your event")
                            .type("image")
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/r8jfbr4d6lydp2d9eug2.png")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/r8jfbr4d6lydp2d9eug2.png")
                            .category("band")
                            .featured(false)
                            .displayOrder(29)
                            .build(),
                    // 30
                    GalleryItem.builder()
                            .titleIta("Live Sound Experience")
                            .titleEng("Live Sound Experience")
                            .subtitleIta("Musica e passione al servizio del tuo evento")
                            .subtitleEng("Music and passion at the service of your event")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785571265/vinco_eventi_galleria/si66dzezw5mvdellz50x.mov")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/r8jfbr4d6lydp2d9eug2.png")
                            .category("band")
                            .featured(false)
                            .displayOrder(30)
                            .build(),
                    // 31
                    GalleryItem.builder()
                            .titleIta("Accoglienza Ospiti in Musica")
                            .titleEng("Guest Welcome in Music")
                            .subtitleIta("L'atmosfera ideale fin dai primi minuti")
                            .subtitleEng("The ideal atmosphere from the very first minutes")
                            .type("image")
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/jpztopltw1bmxyoovmyt.webp")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785571180/vinco_eventi_galleria/jpztopltw1bmxyoovmyt.webp")
                            .category("band")
                            .featured(false)
                            .displayOrder(31)
                            .build()
            );

            galleryRepository.saveAll(items);
            System.out.println(">>> Seed Galleria eseguito con successo per tutti i 31 media con URL Cloudinary.");
        }
    }
}
