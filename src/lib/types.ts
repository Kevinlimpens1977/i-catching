// Firestore Data Types for I-Catching CMS

export interface SiteContent {
    // Hero Section
    heroImage: string;
    heroImageVersions?: ImageVersion[];
    heroHeadline: string;
    heroSubheadline: string;

    // Intro Section
    introText: string;

    // Atelier Section
    atelierText: string;
    atelierImage: string;
    atelierImageVersions?: ImageVersion[];
    atelierHighlights: string[];

    // Werkwijze Section
    werkwijzeSteps: WerkwijzeStep[];

    // Ontmoet Iris Section
    irisBio: string;
    irisPortrait: string;
    irisPortraitVersions?: ImageVersion[];
    irisContactInfo: ContactInfo;

    // Metadata
    updatedAt: Date;
    updatedBy: string;
}

export interface WerkwijzeStep {
    id: string;
    title: string;
    description: string;
    order: number;
}

export interface ContactInfo {
    email: string;
    phone?: string;
    instagram?: string;
    location?: string;
}

export interface ImageVersion {
    id: string;
    url: string;
    isActive: boolean;
    isOriginal: boolean;
    prompt?: string;
    createdAt: Date;
}

export interface Category {
    id: string;
    title: string;
    slug: string;
    intro: string;
    coverImage?: string;
    coverImageVersions?: ImageVersion[];
    order: number;
    isLatexCouture: boolean; // Special flag for circular carousel
    createdAt?: Date;
    updatedAt?: Date;
}

export interface GalleryItem {
    id: string;
    categoryId?: string;
    title?: string;
    imageUrl: string;
    imageVersions?: ImageVersion[];
    activeVersionId?: string;
    activeVersionUrl?: string;
    caption?: string;
    order: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    coverImage?: string;
    coverImageVersions?: ImageVersion[];
    activeCoverVersionId?: string;
    body: string; // HTML from TipTap
    status: 'draft' | 'published';
    publishedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    authorId?: string;
}

export interface Inquiry {
    id: string;
    name: string;
    email: string;
    message: string;
    handled: boolean;
    handledAt?: Date;
    handledBy?: string;
    createdAt: Date;
}

export interface User {
    uid: string;
    email: string;
    role: 'admin' | 'viewer';
    createdAt: Date;
    lastLoginAt?: Date;
}

// ============================================
// DEFAULT CONTENT - Used when Firestore is empty
// ============================================

export const defaultSiteContent: Omit<SiteContent, 'updatedAt' | 'updatedBy'> = {
    heroImage: '',
    heroHeadline: 'Verlangen in vorm gebracht.',
    heroSubheadline: 'Erotisch interieur en handgemaakte latex couture, ontstaan uit aandacht en vakmanschap.',

    introText: `Welkom in de wereld van I-Catching, waar verleiding een tastbare vorm krijgt. Elk stuk dat mijn atelier verlaat is een samenspel van licht, vorm en sensualiteit – ontworpen om te boeien, te prikkelen en te verwonderen.

Of het nu gaat om een sculpturale mannequin lamp die uw interieur transformeert, een op maat gemaakte latex creatie die uw unieke stijl belichaamt, of een schilderij dat de grenzen van het conventionele uitdaagt – bij I-Catching draait alles om het buitengewone.`,

    atelierText: `In mijn atelier komen ambacht en verbeelding samen. Hier ontstaan stukken die niet alleen mooi zijn, maar ook een verhaal vertellen. Elk project begint met een gesprek, een uitwisseling van ideeën en dromen.

Met jarenlange ervaring in het werken met latex, licht en vorm, creëer ik werken die de grenzen verleggen van wat mogelijk is. Van de eerste schets tot de laatste finishing touch – elk detail krijgt de aandacht die het verdient.

Mijn atelier is meer dan een werkplaats; het is een plek waar het ongewone tot leven komt.`,
    atelierImage: '',
    atelierHighlights: [
        'Volledig maatwerk',
        'Zorgvuldige materiaalkeuze',
        'Persoonlijke afstemming'
    ],

    werkwijzeSteps: [
        { id: '1', title: 'Contact', description: 'Neem vrijblijvend contact op via het formulier of e-mail', order: 1 },
        { id: '2', title: 'Wensen bespreken', description: 'We bespreken uw ideeën, voorkeuren en mogelijkheden', order: 2 },
        { id: '3', title: 'Ontwerp', description: 'Ik maak een eerste conceptschets op basis van ons gesprek', order: 3 },
        { id: '4', title: 'Feedback', description: 'U geeft feedback op het ontwerp, we bespreken aanpassingen', order: 4 },
        { id: '5', title: 'Bijstellen', description: 'Het ontwerp wordt geperfectioneerd tot het precies goed is', order: 5 },
        { id: '6', title: 'Materiaal & kleur', description: 'Samen selecteren we de juiste materialen en kleuren', order: 6 },
        { id: '7', title: 'Levering', description: 'Uw unieke creatie wordt met zorg afgeleverd', order: 7 }
    ],

    irisBio: `Als kunstenaar en vakvrouw zoek ik constant naar de grens tussen kunst, ambacht en verlangen. Mijn fascinatie voor het menselijk lichaam, licht en texturen vormt de basis van al mijn werk.

Na jaren van experimenteren met verschillende materialen en technieken ontdekte ik mijn passie voor het creëren van stukken die zowel functioneel als sensueel zijn. Mannequin lampen die licht en schaduw dansen, latex creaties die het lichaam omarmen, schilderijen die de verbeelding prikkelen.

Bij I-Catching draait alles om authenticiteit en vakmanschap. Elk stuk is een uitnodiging om de wereld door andere ogen te zien – ogen die schoonheid vinden in het onconventionele.`,
    irisPortrait: '',
    irisContactInfo: {
        email: 'info@i-catching.nl',
        phone: '06 – 00000000',
        instagram: '@i_catching',
        location: 'Nederland'
    }
};

// Default Categories
export const defaultCategories: Category[] = [
    {
        id: 'mannequin-lampen',
        title: 'Mannequin Lampen',
        slug: 'mannequin-lampen',
        intro: 'Sculpturen van licht en verlangen. Elke mannequin lamp is een uniek kunstwerk dat licht, vorm en sensualiteit combineert tot een betoverend geheel. Handgemaakt met oog voor elk detail.',
        order: 1,
        isLatexCouture: false
    },
    {
        id: 'latex-couture',
        title: 'Latex Couture',
        slug: 'latex-couture',
        intro: 'Op maat gemaakte latex creaties die het lichaam omarmen. Van elegante avondkleding tot gedurfde statement pieces – elke creatie wordt met precisie en passie vervaardigd, perfect afgestemd op uw lichaam en stijl.',
        order: 2,
        isLatexCouture: true
    },
    {
        id: 'schilderijen',
        title: 'Schilderijen',
        slug: 'schilderijen',
        intro: "Expressieve kunstwerken die de grenzen van het conventionele uitdagen. Mijn schilderijen verkennen thema's van sensualiteit, licht en schaduw, en nodigen uit tot reflectie en verwondering.",
        order: 3,
        isLatexCouture: false
    }
];

// Default Gallery Items per Category
export const defaultGalleryItems: Record<string, GalleryItem[]> = {
    'mannequin-lampen': [
        { id: 'ml1', title: 'Silhouette', caption: 'Een elegante torso in warm licht, gefilterd door transparant materiaal. De schaduwspelen creëren een intieme sfeer.', imageUrl: '', order: 1 },
        { id: 'ml2', title: 'Embrace', caption: 'Twee vormen verstrengeld in een choreografie van licht en schaduw. Een statement piece voor de durvers.', imageUrl: '', order: 2 },
        { id: 'ml3', title: 'Whisper', caption: 'Subtiel en verleidelijk – een lamp die fluistert in plaats van schreeuwt. Perfect voor de slaapkamer of lounge.', imageUrl: '', order: 3 },
        { id: 'ml4', title: 'Noir', caption: 'Donkere elegantie ontmoet functioneel design. De perfecte balans tussen kunst en verlichting.', imageUrl: '', order: 4 },
        { id: 'ml5', title: 'Venus', caption: 'Geïnspireerd op klassieke schoonheid, hertaald in moderne materialen. Een tijdloos stuk.', imageUrl: '', order: 5 },
        { id: 'ml6', title: 'Tension', caption: 'Spanning en ontspanning in één beeld gevangen. De dynamiek van het menselijk lichaam vertaald naar licht.', imageUrl: '', order: 6 }
    ],
    'latex-couture': [
        { id: 'lc1', title: 'Midnight Dress', caption: 'Vloeiende lijnen in diep donkerblauw latex. Elegant en gedurfd tegelijk.', imageUrl: '', order: 1 },
        { id: 'lc2', title: 'Classic Corset', caption: 'Traditioneel vakmanschap in modern materiaal. Een corset dat het lichaam omarmt en vormt.', imageUrl: '', order: 2 },
        { id: 'lc3', title: 'Statement Skirt', caption: 'Hoogglans zwart met subtiele textuurdetails. Gemaakt voor wie gezien wil worden.', imageUrl: '', order: 3 },
        { id: 'lc4', title: 'Evening Gloves', caption: 'Perfecte afwerking voor elke outfit. Handgemaakt voor een naadloze pasvorm.', imageUrl: '', order: 4 },
        { id: 'lc5', title: 'Crimson Set', caption: 'Vurig rood in een tweedelige creatie. Voor speciale avonden die onvergetelijk moeten zijn.', imageUrl: '', order: 5 },
        { id: 'lc6', title: 'Second Skin', caption: 'Ultradun latex dat aanvoelt als een tweede huid. De ultieme combinatie van comfort en sensualiteit.', imageUrl: '', order: 6 },
        { id: 'lc7', title: 'Harness Top', caption: 'Architectonische lijnen die het bovenlichaam accentueren. Statement fashion voor de avant-garde.', imageUrl: '', order: 7 },
        { id: 'lc8', title: 'Tailored Pants', caption: 'Op maat gemaakte latex broek met perfecte pasvorm. Elegant genoeg voor een avond uit.', imageUrl: '', order: 8 }
    ],
    'schilderijen': [
        { id: 'sc1', title: 'Lichtval', caption: 'Olieverf op doek. De manier waarop licht over huid speelt, gevangen in verf.', imageUrl: '', order: 1 },
        { id: 'sc2', title: 'Contour', caption: 'Mixed media. De abstractie van het menselijk silhouet.', imageUrl: '', order: 2 },
        { id: 'sc3', title: 'Velvet Night', caption: 'Acryl op groot formaat. Een nachtelijk tafereel in diepe tonen.', imageUrl: '', order: 3 },
        { id: 'sc4', title: 'Reflections', caption: 'Olieverf. Spiegeling en zelfbeeld verkend in meerdere lagen.', imageUrl: '', order: 4 },
        { id: 'sc5', title: 'Tension II', caption: 'Het vervolg op een eerder werk. Meer contrast, meer diepte.', imageUrl: '', order: 5 },
        { id: 'sc6', title: 'Dawn', caption: 'Warme tinten die de eerste ochtendzon suggereren op een rustend lichaam.', imageUrl: '', order: 6 }
    ]
};

// Default Blog Posts
export const defaultBlogPosts: BlogPost[] = [
    {
        id: 'latex-aantrekken',
        title: 'Hoe trek je latex kleding aan zonder stress',
        slug: 'latex-kleding-aantrekken',
        excerpt: 'Latex aantrekken kan in het begin een uitdaging zijn. Met de juiste techniek en voorbereiding wordt het een genot. In dit artikel deel ik mijn tips voor een stressvrije ervaring.',
        body: `<h2>Voorbereiding is alles</h2>
<p>Voordat je begint met het aantrekken van latex, is goede voorbereiding essentieel. Zorg dat je huid schoon en droog is. Sommigen gebruiken talkpoeder aan de binnenkant van het kledingstuk, terwijl anderen de voorkeur geven aan dressing aid – een speciaal glijmiddel voor latex.</p>

<h2>De juiste techniek</h2>
<p>Trek latex nooit met geweld aan. Het materiaal is sterk maar kan scheuren bij te veel spanning op één punt. Rol het kledingstuk op zoals je een panty zou oprollen, en werk stukje bij beetje omhoog of omlaag.</p>

<h2>Neem je tijd</h2>
<p>De eerste keren zal het aantrekken langer duren. Dit is normaal. Naarmate je meer ervaring krijgt, wordt het proces sneller en natuurlijker. Reserveer voldoende tijd, zeker als je je voorbereidt op een speciale gelegenheid.</p>

<h2>Na het dragen</h2>
<p>Na het uitrekken is direct onderhoud belangrijk. Spoel het kledingstuk af met lauw water en laat het drogen uit direct zonlicht. Zo blijft je latex langer mooi.</p>

<h2>Mijn persoonlijke tips</h2>
<ul>
<li>Houd je nagels kort om scheurtjes te voorkomen</li>
<li>Werk in een warme ruimte – koude latex is stugger</li>
<li>Vraag hulp bij moeilijk bereikbare ritsen</li>
<li>Oefen thuis voordat je naar een evenement gaat</li>
</ul>

<p>Met deze tips wordt het aantrekken van latex een onderdeel van het ritueel, niet een obstakel. Heb je vragen over je latex kleding? Neem gerust contact op.</p>`,
        status: 'published',
        publishedAt: new Date('2024-12-01')
    },
    {
        id: 'latex-onderhoud',
        title: 'Hoe je latex outfit lang mooi blijft',
        slug: 'latex-onderhoud-tips',
        excerpt: 'Goed onderhoud is essentieel voor latex dat er jarenlang perfect uit blijft zien. Van wassen tot opbergen – hier zijn mijn tips voor de beste verzorging van je latex stukken.',
        body: `<h2>Direct na het dragen</h2>
<p>De belangrijkste regel bij latex onderhoud: was het direct na het dragen. Zweet en lichaamsoliën kunnen het materiaal aantasten. Een snelle spoeling met lauw water is voldoende voor normaal gebruik.</p>

<h2>Wassen</h2>
<p>Gebruik uitsluitend mild zeepwater of speciaal latex wasmiddel. Nooit normale wasmiddelen, bleek of chemische reinigingsmiddelen gebruiken. Deze kunnen het latex beschadigen en doen verkleuren.</p>

<h2>Drogen</h2>
<p>Hang latex nooit in direct zonlicht te drogen. UV-straling is de grootste vijand van latex en veroorzaakt verkleuring en broosheid. Droog op een geventileerde plek, uit de zon, en keer het kledingstuk binnenstebuiten om beide kanten te laten drogen.</p>

<h2>Opbergen</h2>
<p>Berg latex donker en droog op. Vermijd contact met metaal, koper in het bijzonder veroorzaakt vlekken. Gebruik geen plastic zakken – kies voor katoenen hoezen of speciaal latex-verpakkingsmateriaal.</p>

<h2>Glans behouden</h2>
<p>Voor die karakteristieke latex glans kun je speciale siliconen spray of polish gebruiken. Breng dun aan en poets met een zachte doek voor een perfecte shine.</p>

<h2>Veelgemaakte fouten</h2>
<ul>
<li>Latex opvouwen in plaats van ophangen</li>
<li>Opbergen in een warme ruimte</li>
<li>Parfum of deodorant direct op het materiaal</li>
<li>Contact met oliën die het latex aantasten</li>
</ul>

<p>Met de juiste verzorging gaat kwaliteits latex jaren mee. Al mijn creaties worden geleverd met specifieke verzorgingsinstructies. Bij vragen sta ik altijd klaar om te helpen.</p>`,
        status: 'published',
        publishedAt: new Date('2024-11-15')
    }
];
