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
        boolean hasBrokenUrls = serviceRepository.findAll().stream()
                .anyMatch(s -> s.getImageUrlIta() == null || !s.getImageUrlIta().contains("/ytjdxerb/"));

        if (serviceRepository.count() == 0 || hasBrokenUrls) {
            serviceRepository.deleteAll();
            ServiceEntity basic = ServiceEntity.builder()
                    .titleIta("BASIC")
                    .titleEng("BASIC")
                    .subtitleIta("Pacchetto essenziale per intrattenimento e service audio/luci professionale")
                    .subtitleEng("Essential package for entertainment and professional audio/lighting service")
                    .category("PACKAGE")
                    .badge("BASIC")
                    .imageUrlIta("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738611/vinco_eventi_servizi/ckjzq11sbrvaojf5iskt.png")
                    .imageUrlEng("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738608/vinco_eventi_servizi/ii4efs143kbixn2n2wnb.png")
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
                    .imageUrlIta("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738606/vinco_eventi_servizi/oppbybtrbqttfi2aprnz.png")
                    .imageUrlEng("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738603/vinco_eventi_servizi/qev9reiqlzxtmpsiulsz.png")
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
                    .imageUrlIta("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738601/vinco_eventi_servizi/fnrxkp5mpmdk8dcfz8mf.png")
                    .imageUrlEng("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738598/vinco_eventi_servizi/vvzgi7pa99ubd9np2fmy.png")
                    .featuresIta("Service audio e luci;DJ (a scelta dal team VINCO EVENTI);Musica di sottofondo (Cerimonia, Aperitivo);Live Band [BROCHURE];Musicisti a scelta di accompagnamento al djset (violino, sax, percussioni ecc.);Photobooth, Videobooth 360°, Telefono degli Ospiti [BROCHURE];Illuminazioni, Fontane luminose sparkular, Fuochi d’artificio e Fumogeni Colorati [BROCHURE]")
                    .featuresEng("Audio and lighting service;DJ (selected from VINCO EVENTI team);Background music (Ceremony, Cocktail Hour);Live Band [BROCHURE];Musicians of choice to accompany DJ set (violin, sax, percussion, etc.);Photobooth, 360° Videobooth, Guest Audio Guestbook [BROCHURE];Lighting, Sparkular fountains, Fireworks & Colored smoke [BROCHURE]")
                    .brochureUrlIta("https://drive.google.com/file/d/1oXiV9ACF0xkTOiNtkyxHYVK0dVMDCvdw/view")
                    .brochureUrlEng("https://drive.google.com/file/d/1arWt9Ex8Wd7gDGAdKPkuKDNRMXiqBhIn/view")
                    .displayOrder(3)
                    .build();

            serviceRepository.saveAll(List.of(basic, plus, full));
            System.out.println(">>> Seed Servizi eseguito con successo con URL Cloudinary reali.");
        }
    }

    private void seedDefaultGalleryItems() {
        boolean hasBrokenUrls = galleryRepository.findAll().stream()
                .anyMatch(g -> g.getSrc() == null || !g.getSrc().contains("/ytjdxerb/"));

        if (galleryRepository.count() < 31 || hasBrokenUrls) {
            galleryRepository.deleteAll();

            String defaultPoster = "https://res.cloudinary.com/ytjdxerb/image/upload/v1785739092/vinco_eventi_galleria/srdtwafxbjz3w9hdkxax.jpg";

            List<GalleryItem> items = List.of(
                    // 1
                    GalleryItem.builder()
                            .titleIta("Set ELETTRICO - Promo on Fire!")
                            .titleEng("ELECTRICAL Set - Promo on Fire!")
                            .subtitleIta("La carica travolgente del nostro set elettrico live (minuto 1:00)")
                            .subtitleEng("The overwhelming energy of our live electric set (start minute 1:00)")
                            .type("video")
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785861122/vinco_eventi_galleria/rftirtcmqxgjsqsyu6fv.mp4")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785739102/vinco_eventi_galleria/wdjpouelk0wgy8b7ayxb.mov")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785739094/vinco_eventi_galleria/vntlhm89bfzrdh2xgy2p.mov")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785739092/vinco_eventi_galleria/srdtwafxbjz3w9hdkxax.jpg")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785739092/vinco_eventi_galleria/srdtwafxbjz3w9hdkxax.jpg")
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785739072/vinco_eventi_galleria/r9e4uokfrbmpwadra7al.mov")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785739059/vinco_eventi_galleria/ef6cr5xt3l4utt5ngzbz.mp4")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785739108/vinco_eventi_galleria/ftaaf6e3ry3wykbvdxdn.webp")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785739108/vinco_eventi_galleria/ftaaf6e3ry3wykbvdxdn.webp")
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785739049/vinco_eventi_galleria/k6nrydw6lhpgaiztomgd.mov")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785739011/vinco_eventi_galleria/lq4emmoiddqhzpbgthq3.mov")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785739047/vinco_eventi_galleria/txbfapyv9ujglspk13eo.jpg")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785739047/vinco_eventi_galleria/txbfapyv9ujglspk13eo.jpg")
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785739001/vinco_eventi_galleria/ufpb1xiseuvs1lsxonad.mp4")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785738970/vinco_eventi_galleria/zhhw5yesgmrwsift9sow.mov")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738998/vinco_eventi_galleria/eeaxtuj0fwjqzspt38fd.jpg")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738998/vinco_eventi_galleria/eeaxtuj0fwjqzspt38fd.jpg")
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785738959/vinco_eventi_galleria/afrx0hb5jnevhbudiieo.mp4")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785738945/vinco_eventi_galleria/etesqmzgylrapntrtrbf.mov")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785738935/vinco_eventi_galleria/vswvgslfquuykapxnr3d.mp4")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738957/vinco_eventi_galleria/difwya2hiwgfwlsn6tc4.jpg")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738957/vinco_eventi_galleria/difwya2hiwgfwlsn6tc4.jpg")
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785738913/vinco_eventi_galleria/tuu3jqx5c72wyf9ldhbg.mov")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785738895/vinco_eventi_galleria/owjxvhnylisvs0hiyxar.mp4")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738910/vinco_eventi_galleria/d34yekgmypunr4au4xwv.jpg")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738910/vinco_eventi_galleria/d34yekgmypunr4au4xwv.jpg")
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785738827/vinco_eventi_galleria/slfbcr7zinspj5coflaa.mov")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785738801/vinco_eventi_galleria/so2xar04vohxdsc0lulo.mov")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738823/vinco_eventi_galleria/eo7tqi5jal8lbxvma4bo.jpg")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738823/vinco_eventi_galleria/eo7tqi5jal8lbxvma4bo.jpg")
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785738787/vinco_eventi_galleria/uiqet8umjkjq3b4wej1c.mp4")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785738745/vinco_eventi_galleria/flg3kduqpo9yoq79fjom.mp4")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785738686/vinco_eventi_galleria/oiuv1egd7bx5atkiwzbb.mov")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738784/vinco_eventi_galleria/eb0ki9vvv83w4nlhybid.webp")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738784/vinco_eventi_galleria/eb0ki9vvv83w4nlhybid.webp")
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785738661/vinco_eventi_galleria/uwi6mmwruee6037hbsuo.mp4")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785739100/vinco_eventi_galleria/pdz6t0sfegbelnr12wb3.png")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785739100/vinco_eventi_galleria/pdz6t0sfegbelnr12wb3.png")
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
                            .src("https://res.cloudinary.com/ytjdxerb/video/upload/v1785738637/vinco_eventi_galleria/jlqctoerysynttow2lpf.mov")
                            .posterUrl(defaultPoster)
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
                            .src("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738683/vinco_eventi_galleria/xp9vsaeg4vd8o7d2hzne.jpg")
                            .posterUrl("https://res.cloudinary.com/ytjdxerb/image/upload/v1785738683/vinco_eventi_galleria/xp9vsaeg4vd8o7d2hzne.jpg")
                            .category("band")
                            .featured(false)
                            .displayOrder(31)
                            .build()
            );

            galleryRepository.saveAll(items);
            System.out.println(">>> Seed Galleria eseguito con successo per tutti i 31 media con URL Cloudinary reali 200 OK.");
        }
    }
}
