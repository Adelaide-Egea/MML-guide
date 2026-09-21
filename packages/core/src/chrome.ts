// Caregiver / guide UI chrome strings.
//
// Safety facts stay in the parent's words. Ask replies follow the selected
// language via the model. This table only covers on-screen chrome so a French
// carer is not staring at English buttons after tapping Français.
//
// System headings baked into the guide ("Who to call", "Name — allergies") and
// routine kind labels ("Snack", "Other") are chrome too — not parent prose.

import { ROUTINE_KIND_LABEL, type RoutineKind } from './household.ts';
import { matchCareLanguage } from './languages.ts';

export interface ChromeCopy {
  readonly languageHint: string;
  readonly askAboutAnything: string;
  readonly ask: string;
  readonly looking: string;
  readonly askTitle: string;
  readonly whatDoYouNeed: string;
  /** Example question in the Ask box — care-focused, never cleaning-kit jokes. */
  readonly askPlaceholder: string;
  readonly askHintCaregiver: string;
  readonly askHintParent: string;
  readonly openGuideFirst: string;
  readonly backToGuide: string;
  readonly readFirst: string;
  readonly readThisFirst: string;
  readonly iHaveReadThis: string;
  readonly safetyNotesReopen: string;
  readonly hideAgain: string;
  readonly allergiesMedicationEmergencies: string;
  readonly readShow: string;
  readonly everyone: string;
  readonly whileYouAreHere: string;
  readonly aTypicalDay: string;
  readonly nice: string;
  readonly must: string;
  readonly yourGuide: string;
  readonly guide: string;
  readonly nothingWritten: string;
  readonly sendToCaregiver: string;
  readonly includePhotos: string;
  readonly includePhotosHint: string;
  readonly sendHint: string;
  readonly preparingLink: string;
  readonly couldNotShare: string;
  readonly openingGuide: string;
  readonly youAsked: string;
  readonly notInGuide: string;
  readonly notInGuideHint: string;
  readonly assistantUnavailable: string;
  /** Contacts block heading — not the parent's relationship labels. */
  readonly whoToCall: string;
  readonly important: string;
  readonly anythingElse: string;
  /** Suffix after "Name — …" on safety fact headings. */
  readonly allergies: string;
  readonly medication: string;
  readonly inAnEmergency: string;
  /** Kind labels for routine rows when the parent did not set a custom name. */
  readonly routineKinds: Readonly<Record<RoutineKind, string>>;
  /**
   * English default entry / section titles → localized display.
   * Only exact matches remap; custom parent titles stay as written.
   */
  readonly entryTitles: Readonly<Record<string, string>>;
  readonly printOrSavePdf: string;
  readonly notSafeToShow: string;
  readonly notFound: string;
  readonly exactlyAsWritten: string;
  readonly lookingThrough: string;
  readonly onlyWhatIsInGuide: string;
  readonly nearlyThere: string;
  readonly safetyShownVerbatim: string;
  /** Print / PDF masthead and footer. */
  readonly printGuideFor: (name: string) => string;
  readonly printIntro: string;
  readonly printFooter: string;
  readonly whileYouAreHereFor: (name: string) => string;
  readonly aTypicalDayFor: (name: string) => string;
  readonly forName: (name: string) => string;
  readonly useProduct: (product: string) => string;
  readonly subjectExactlyAsWritten: (name: string) => string;
}

/** Built-in prompt / section titles seeded in English — display chrome, not parent prose. */
const FR_ENTRY_TITLES: Record<string, string> = {
  Screens: 'Écrans',
  'Screen time': 'Écrans',
  Potty: 'Pot',
  'Potty / toilet': 'Pot / toilettes',
  Food: 'Repas',
  Sleep: 'Sommeil',
  Bedtime: 'Coucher',
  Nappies: 'Couches',
  'Nappies & toilet': 'Couches et toilettes',
  'Nappies / toilet': 'Couches / toilettes',
  'Milk & bottles': 'Lait et biberons',
  'Likes & comfort': 'Goûts et réconfort',
  'If they are upset': 'S’ils sont contrariés',
  'If upset': 'Si contrarié',
  'Nursery / preschool': 'Crèche / maternelle',
  Nursery: 'Crèche',
  'Out of the house': 'Sorties',
  'Out & about': 'Dehors',
  School: 'École',
  Activities: 'Activités',
  Independence: 'Autonomie',
  Walks: 'Promenades',
  Meals: 'Repas',
  Comfort: 'Réconfort',
  Health: 'Santé',
  Cleaning: 'Ménage',
  'House rules': 'Règles de la maison',
  'Keys & access': 'Clés et accès',
  Routine: 'Routine',
  Clothing: 'Vêtements',
};

const FR_ROUTINE_KINDS: Record<RoutineKind, string> = {
  Breakfast: 'Petit-déjeuner',
  Snack: 'Goûter',
  Lunch: 'Déjeuner',
  Dinner: 'Dîner',
  Feed: 'Repas',
  Bottle: 'Biberon',
  Nappy: 'Couche',
  Nap: 'Sieste',
  Bath: 'Bain',
  Bedtime: 'Coucher',
  School: 'École',
  Walk: 'Promenade',
  Litter: 'Litière',
  Activity: 'Activité',
  Medication: 'Médicaments',
  Bins: 'Poubelles',
  Plants: 'Plantes',
  Post: 'Courrier',
  Laundry: 'Lessive',
  Sheets: 'Draps',
  Towels: 'Serviettes',
  TeaTowels: 'Torchons',
  ToiletPaper: 'Papier toilette',
  Kitchen: 'Cuisine',
  Bathroom: 'Salle de bain',
  Floors: 'Sols',
  Surfaces: 'Surfaces',
  Oven: 'Four',
  Fridge: 'Frigo',
  Shower: 'Douche',
  Dusting: 'Dépoussiérage',
  Vacuum: 'Aspirateur',
  Restock: 'Réapprovisionner',
  Other: 'Autre',
};

const EN: ChromeCopy = {
  languageHint:
    'Guide language — English or French by default, with a toggle into the languages most common among UK and French carers and cleaners (including Brazilian Portuguese and Tagalog). Safety facts stay in the parent’s words; Ask answers in this language.',
  askAboutAnything: 'Ask about anything',
  ask: 'Ask',
  looking: 'Looking…',
  askTitle: 'Ask',
  whatDoYouNeed: 'What do you need to know?',
  askPlaceholder: 'When is bedtime? / Where are the spare nappies?',
  askHintCaregiver:
    'Answered only from this guide. Ask in your language — the reply follows the toggle above.',
  askHintParent: 'Answered only from what was written in this guide. Ask in whatever language you like.',
  openGuideFirst: 'Open the guide from the link you were sent first, then Ask will work on this phone.',
  backToGuide: 'Back to guide',
  readFirst: 'Read first',
  readThisFirst: 'Read this first',
  iHaveReadThis: 'I have read this',
  safetyNotesReopen: 'Safety notes. Tap to reopen.',
  hideAgain: 'Hide again',
  allergiesMedicationEmergencies: 'Allergies, medication and emergencies',
  readShow: 'Read · show',
  everyone: 'Everyone',
  whileYouAreHere: 'While you are here',
  aTypicalDay: 'A typical day',
  nice: 'Nice',
  must: 'Must',
  yourGuide: 'Your guide',
  guide: 'Guide',
  nothingWritten: 'Nothing was written down for this visit.',
  sendToCaregiver: 'Send to caregiver',
  includePhotos: 'Include photos in this link',
  includePhotosHint:
    'Off by default. When on, pictures are added to the short link so the caregiver can see them. Anyone with the link can see them too.',
  sendHint: 'Send creates a short private link for their phone. Guide plus Ask. Expires after 14 days.',
  preparingLink: 'Preparing the link…',
  couldNotShare: 'Could not share. Try again.',
  openingGuide: 'Opening the guide…',
  youAsked: 'You asked',
  notInGuide: 'That is not in the guide.',
  notInGuideHint:
    'Rather than guess, this says nothing. If it matters, call the number under “who to call”.',
  assistantUnavailable: 'The assistant is unavailable, so here is what was written — unchanged.',
  whoToCall: 'Who to call',
  important: 'Important',
  anythingElse: 'Anything else',
  allergies: 'allergies',
  medication: 'medication',
  inAnEmergency: 'in an emergency',
  routineKinds: ROUTINE_KIND_LABEL,
  entryTitles: {},
  printOrSavePdf: 'Print or save as PDF',
  notSafeToShow: 'Not safe to show',
  notFound: 'Not found',
  exactlyAsWritten: 'Exactly as written',
  lookingThrough: 'Looking through what was written down…',
  onlyWhatIsInGuide: 'Only what is actually in the guide…',
  nearlyThere: 'Nearly there…',
  safetyShownVerbatim:
    'This is safety information, so it is shown word for word and not translated.',
  printGuideFor: (name) => `Guide for ${name}`,
  printIntro: 'Everything they need while you are away — clear, calm, and on one page.',
  printFooter: 'Domela — the household guide',
  whileYouAreHereFor: (name) => `While you are here for ${name}`,
  aTypicalDayFor: (name) => `A typical day for ${name}`,
  forName: (name) => `For ${name}`,
  useProduct: (product) => `Use ${product}`,
  subjectExactlyAsWritten: (name) => `${name} — exactly as written`,
};

const FR: ChromeCopy = {
  languageHint:
    'Langue du guide — anglais ou français par défaut, avec un bascule vers les langues les plus courantes chez les nounous et femmes de ménage au Royaume-Uni et en France (dont le portugais brésilien et le tagalog). Les faits de sécurité restent dans les mots du parent ; Ask répond dans cette langue.',
  askAboutAnything: 'Poser une question',
  ask: 'Demander',
  looking: 'Recherche…',
  askTitle: 'Demander',
  whatDoYouNeed: 'De quoi avez-vous besoin ?',
  askPlaceholder: 'À quelle heure le coucher ? / Où sont les couches ?',
  askHintCaregiver:
    'Réponse uniquement à partir de ce guide. Posez la question dans votre langue — la réponse suit le choix ci-dessus.',
  askHintParent:
    'Réponse uniquement à partir de ce qui a été écrit dans ce guide. Posez la question dans la langue de votre choix.',
  openGuideFirst:
    'Ouvrez d’abord le guide depuis le lien reçu, puis Demander fonctionnera sur ce téléphone.',
  backToGuide: 'Retour au guide',
  readFirst: 'À lire d’abord',
  readThisFirst: 'À lire d’abord',
  iHaveReadThis: 'J’ai lu ceci',
  safetyNotesReopen: 'Notes de sécurité. Touchez pour rouvrir.',
  hideAgain: 'Masquer à nouveau',
  allergiesMedicationEmergencies: 'Allergies, médicaments et urgences',
  readShow: 'Lire · afficher',
  everyone: 'Tout le monde',
  whileYouAreHere: 'Pendant que vous êtes là',
  aTypicalDay: 'Une journée type',
  nice: 'Si possible',
  must: 'Obligatoire',
  yourGuide: 'Votre guide',
  guide: 'Guide',
  nothingWritten: 'Rien n’a été noté pour cette visite.',
  sendToCaregiver: 'Envoyer au caregiver',
  includePhotos: 'Inclure les photos dans ce lien',
  includePhotosHint:
    'Désactivé par défaut. Activé, les photos sont ajoutées au lien court pour que le caregiver les voie. Quiconque a le lien peut les voir aussi.',
  sendHint:
    'Envoyer crée un lien privé court pour leur téléphone. Guide plus Demander. Expire après 14 jours.',
  preparingLink: 'Préparation du lien…',
  couldNotShare: 'Impossible de partager. Réessayez.',
  openingGuide: 'Ouverture du guide…',
  youAsked: 'Vous avez demandé',
  notInGuide: 'Ce n’est pas dans le guide.',
  notInGuideHint:
    'Plutôt que d’inventer, ceci ne dit rien. Si c’est important, appelez le numéro sous « qui appeler ».',
  assistantUnavailable: 'L’assistant est indisponible, voici donc ce qui a été écrit — inchangé.',
  whoToCall: 'Qui appeler',
  important: 'Important',
  anythingElse: 'Autre chose',
  allergies: 'allergies',
  medication: 'médicaments',
  inAnEmergency: 'en cas d’urgence',
  routineKinds: FR_ROUTINE_KINDS,
  entryTitles: FR_ENTRY_TITLES,
  printOrSavePdf: 'Imprimer ou enregistrer en PDF',
  notSafeToShow: 'Affichage non sûr',
  notFound: 'Introuvable',
  exactlyAsWritten: 'Tel quel, sans modification',
  lookingThrough: 'Je parcours ce qui a été noté…',
  onlyWhatIsInGuide: 'Uniquement ce qui est dans le guide…',
  nearlyThere: 'Presque…',
  safetyShownVerbatim:
    'Ceci est une information de sécurité : elle est affichée mot pour mot, sans traduction.',
  printGuideFor: (name) => `Guide pour ${name}`,
  printIntro: 'Tout ce qu’il faut pendant votre absence — clair, calme, sur une page.',
  printFooter: 'Domela — le guide du foyer',
  whileYouAreHereFor: (name) => `Pendant que vous êtes là pour ${name}`,
  aTypicalDayFor: (name) => `Une journée type pour ${name}`,
  forName: (name) => `Pour ${name}`,
  useProduct: (product) => `Utiliser ${product}`,
  subjectExactlyAsWritten: (name) => `${name} — tel quel, sans modification`,
};

const PT_BR: ChromeCopy = {
  ...EN,
  languageHint:
    'Idioma do guia — inglês ou francês por padrão, com opção para os idiomas mais comuns entre cuidadores e faxineiras no Reino Unido e na França (incluindo português do Brasil e tagalo). Os fatos de segurança ficam nas palavras dos pais; o Ask responde neste idioma.',
  askAboutAnything: 'Perguntar qualquer coisa',
  ask: 'Perguntar',
  looking: 'Buscando…',
  askTitle: 'Perguntar',
  askHintCaregiver:
    'Respondido só com base neste guia. Pergunte no seu idioma — a resposta segue a escolha acima.',
  askHintParent: 'Respondido só com o que foi escrito neste guia. Pergunte no idioma que quiser.',
  openGuideFirst: 'Abra primeiro o guia pelo link que você recebeu; depois Perguntar funciona neste telefone.',
  backToGuide: 'Voltar ao guia',
  readFirst: 'Leia primeiro',
  readThisFirst: 'Leia isto primeiro',
  iHaveReadThis: 'Eu li isto',
  safetyNotesReopen: 'Notas de segurança. Toque para reabrir.',
  hideAgain: 'Ocultar de novo',
  allergiesMedicationEmergencies: 'Alergias, medicamentos e emergências',
  readShow: 'Ler · mostrar',
  everyone: 'Todos',
  whileYouAreHere: 'Enquanto você está aqui',
  aTypicalDay: 'Um dia típico',
  nice: 'Se der',
  must: 'Obrigatório',
  yourGuide: 'Seu guia',
  nothingWritten: 'Nada foi anotado para esta visita.',
  sendToCaregiver: 'Enviar para o cuidador',
  includePhotos: 'Incluir fotos neste link',
  includePhotosHint:
    'Desligado por padrão. Quando ligado, as fotos entram no link curto para o cuidador ver. Quem tiver o link também vê.',
  sendHint: 'Enviar cria um link privado curto para o telefone deles. Guia mais Perguntar. Expira em 14 dias.',
  preparingLink: 'Preparando o link…',
  couldNotShare: 'Não foi possível compartilhar. Tente de novo.',
  whileYouAreHereFor: (name) => `Enquanto você está aqui para ${name}`,
  aTypicalDayFor: (name) => `Um dia típico para ${name}`,
  forName: (name) => `Para ${name}`,
  useProduct: (product) => `Usar ${product}`,
};

const PT_PT: ChromeCopy = {
  ...PT_BR,
  askAboutAnything: 'Perguntar qualquer coisa',
  askHintCaregiver:
    'Resposta apenas a partir deste guia. Pergunte no seu idioma — a resposta segue a escolha acima.',
  everyone: 'Toda a gente',
  whileYouAreHere: 'Enquanto estiver aqui',
  aTypicalDay: 'Um dia típico',
  whileYouAreHereFor: (name) => `Enquanto estiver aqui para ${name}`,
  aTypicalDayFor: (name) => `Um dia típico para ${name}`,
  sendToCaregiver: 'Enviar ao cuidador',
};

const ES: ChromeCopy = {
  ...EN,
  languageHint:
    'Idioma de la guía — inglés o francés por defecto, con opción a los idiomas más comunes entre cuidadores y personal doméstico en el Reino Unido y Francia (incluido el portugués brasileño y el tagalo). Los datos de seguridad siguen en las palabras de los padres; Ask responde en este idioma.',
  askAboutAnything: 'Preguntar cualquier cosa',
  ask: 'Preguntar',
  looking: 'Buscando…',
  askTitle: 'Preguntar',
  askHintCaregiver:
    'Respuesta solo a partir de esta guía. Pregunte en su idioma: la respuesta sigue la opción de arriba.',
  askHintParent: 'Respuesta solo a partir de lo escrito en esta guía. Pregunte en el idioma que prefiera.',
  openGuideFirst: 'Abra primero la guía desde el enlace que recibió; luego Preguntar funcionará en este teléfono.',
  backToGuide: 'Volver a la guía',
  readFirst: 'Leer primero',
  readThisFirst: 'Lea esto primero',
  iHaveReadThis: 'He leído esto',
  safetyNotesReopen: 'Notas de seguridad. Toque para volver a abrir.',
  hideAgain: 'Ocultar de nuevo',
  allergiesMedicationEmergencies: 'Alergias, medicación y emergencias',
  readShow: 'Leer · mostrar',
  everyone: 'Todos',
  whileYouAreHere: 'Mientras está aquí',
  aTypicalDay: 'Un día típico',
  nice: 'Si puede',
  must: 'Obligatorio',
  yourGuide: 'Su guía',
  nothingWritten: 'No se anotó nada para esta visita.',
  sendToCaregiver: 'Enviar al cuidador',
  includePhotos: 'Incluir fotos en este enlace',
  includePhotosHint:
    'Desactivado por defecto. Si se activa, las fotos se añaden al enlace corto para que el cuidador las vea. Quien tenga el enlace también las verá.',
  sendHint: 'Enviar crea un enlace privado corto para su teléfono. Guía más Preguntar. Caduca a los 14 días.',
  preparingLink: 'Preparando el enlace…',
  couldNotShare: 'No se pudo compartir. Inténtelo de nuevo.',
  whileYouAreHereFor: (name) => `Mientras está aquí para ${name}`,
  aTypicalDayFor: (name) => `Un día típico para ${name}`,
  forName: (name) => `Para ${name}`,
  useProduct: (product) => `Usar ${product}`,
};

const TL: ChromeCopy = {
  ...EN,
  languageHint:
    'Wika ng gabay — Ingles o Pranses bilang default, na may toggle sa mga wikang karaniwan sa mga tagapag-alaga at cleaner sa UK at France (kabilang ang Brazilian Portuguese at Tagalog). Ang mga safety fact ay nananatili sa salita ng magulang; sumasagot ang Ask sa wikang ito.',
  askAboutAnything: 'Magtanong ng kahit ano',
  ask: 'Magtanong',
  looking: 'Naghahanap…',
  askTitle: 'Magtanong',
  askHintCaregiver:
    'Sinagot lang mula sa gabay na ito. Magtanong sa inyong wika — sundin ng sagot ang toggle sa itaas.',
  askHintParent: 'Sinagot lang mula sa nakasulat sa gabay na ito. Magtanong sa anumang wika.',
  openGuideFirst: 'Buksan muna ang gabay mula sa link na ipinadala sa inyo, pagkatapos gagana ang Magtanong sa teleponong ito.',
  backToGuide: 'Bumalik sa gabay',
  readFirst: 'Basahin muna',
  readThisFirst: 'Basahin muna ito',
  iHaveReadThis: 'Nabasa ko na ito',
  safetyNotesReopen: 'Mga tala sa kaligtasan. Pindutin para buksan ulit.',
  hideAgain: 'Itago ulit',
  allergiesMedicationEmergencies: 'Allergy, gamot, at emerhensya',
  readShow: 'Basahin · ipakita',
  everyone: 'Lahat',
  whileYouAreHere: 'Habang nandito kayo',
  aTypicalDay: 'Isang karaniwang araw',
  nice: 'Kung maaari',
  must: 'Kailangan',
  yourGuide: 'Inyong gabay',
  nothingWritten: 'Walang naisulat para sa bisitang ito.',
  sendToCaregiver: 'Ipadala sa caregiver',
  includePhotos: 'Isama ang mga larawan sa link na ito',
  includePhotosHint:
    'Naka-off bilang default. Kapag naka-on, pumapasok ang mga larawan sa maikling link para makita ng caregiver. Makikita rin ng sinumang may link.',
  sendHint: 'Ang Ipadala ay gumagawa ng maikling pribadong link para sa telepono nila. Gabay plus Magtanong. Mag-e-expire pagkatapos ng 14 araw.',
  preparingLink: 'Inihahanda ang link…',
  couldNotShare: 'Hindi maipadala. Subukan ulit.',
  whileYouAreHereFor: (name) => `Habang nandito kayo para kay ${name}`,
  aTypicalDayFor: (name) => `Isang karaniwang araw para kay ${name}`,
  forName: (name) => `Para kay ${name}`,
  useProduct: (product) => `Gamitin ang ${product}`,
};

const AR: ChromeCopy = {
  ...EN,
  languageHint:
    'لغة الدليل — الإنجليزية أو الفرنسية افتراضيًا، مع خيار للغات الأكثر شيوعًا بين مقدمي الرعاية وعمال المنازل في المملكة المتحدة وفرنسا (بما في ذلك البرتغالية البرازيلية والتاغالوغ). تبقى حقائق السلامة بكلمات الوالد؛ ويجيب Ask بهذه اللغة.',
  askAboutAnything: 'اسأل عن أي شيء',
  ask: 'اسأل',
  looking: 'جاري البحث…',
  askTitle: 'اسأل',
  askHintCaregiver: 'الإجابة من هذا الدليل فقط. اسأل بلغتك — تتبع الإجابة الاختيار أعلاه.',
  askHintParent: 'الإجابة مما كُتب في هذا الدليل فقط. اسأل بأي لغة تريد.',
  openGuideFirst: 'افتح الدليل أولًا من الرابط الذي أُرسل إليك، ثم سيعمل اسأل على هذا الهاتف.',
  backToGuide: 'العودة إلى الدليل',
  readFirst: 'اقرأ أولًا',
  readThisFirst: 'اقرأ هذا أولًا',
  iHaveReadThis: 'لقد قرأت هذا',
  safetyNotesReopen: 'ملاحظات السلامة. المس لإعادة الفتح.',
  hideAgain: 'إخفاء مرة أخرى',
  allergiesMedicationEmergencies: 'الحساسية والأدوية والطوارئ',
  readShow: 'اقرأ · أظهر',
  everyone: 'الجميع',
  whileYouAreHere: 'أثناء وجودك هنا',
  aTypicalDay: 'يوم عادي',
  nice: 'إن أمكن',
  must: 'إلزامي',
  yourGuide: 'دليلك',
  nothingWritten: 'لم يُكتب شيء لهذه الزيارة.',
  sendToCaregiver: 'إرسال إلى مقدم الرعاية',
  includePhotos: 'تضمين الصور في هذا الرابط',
  includePhotosHint:
    'معطّل افتراضيًا. عند التفعيل تُضاف الصور إلى الرابط القصير ليراها مقدم الرعاية. من لديه الرابط يمكنه رؤيتها أيضًا.',
  sendHint: 'ينشئ الإرسال رابطًا خاصًا قصيرًا لهواتفهم. الدليل مع اسأل. ينتهي بعد 14 يومًا.',
  preparingLink: 'جاري تحضير الرابط…',
  couldNotShare: 'تعذّر المشاركة. حاول مرة أخرى.',
  whileYouAreHereFor: (name) => `أثناء وجودك هنا من أجل ${name}`,
  aTypicalDayFor: (name) => `يوم عادي لـ ${name}`,
  forName: (name) => `لـ ${name}`,
  useProduct: (product) => `استخدم ${product}`,
};

const PL: ChromeCopy = {
  ...EN,
  languageHint:
    'Język przewodnika — domyślnie angielski lub francuski, z przełącznikiem na języki najczęstsze wśród opiekunek i osób sprzątających w UK i Francji (w tym brazylijski portugalski i tagalski). Fakty o bezpieczeństwie zostają w słowach rodzica; Ask odpowiada w tym języku.',
  askAboutAnything: 'Zapytaj o cokolwiek',
  ask: 'Zapytaj',
  looking: 'Szukam…',
  askTitle: 'Zapytaj',
  askHintCaregiver:
    'Odpowiedź tylko na podstawie tego przewodnika. Pytaj w swoim języku — odpowiedź idzie za wyborem powyżej.',
  askHintParent: 'Odpowiedź tylko na podstawie tego, co zapisano w przewodniku. Pytaj w dowolnym języku.',
  openGuideFirst: 'Najpierw otwórz przewodnik z otrzymanego linku, wtedy Zapytaj zadziała na tym telefonie.',
  backToGuide: 'Wróć do przewodnika',
  readFirst: 'Przeczytaj najpierw',
  readThisFirst: 'Przeczytaj to najpierw',
  iHaveReadThis: 'Przeczytałam / przeczytałem',
  safetyNotesReopen: 'Uwagi o bezpieczeństwie. Dotknij, aby otworzyć ponownie.',
  hideAgain: 'Ukryj ponownie',
  allergiesMedicationEmergencies: 'Alergie, leki i nagłe wypadki',
  readShow: 'Czytaj · pokaż',
  everyone: 'Wszyscy',
  whileYouAreHere: 'Gdy tu jesteś',
  aTypicalDay: 'Typowy dzień',
  nice: 'Jeśli możesz',
  must: 'Obowiązkowe',
  yourGuide: 'Twój przewodnik',
  nothingWritten: 'Nic nie zapisano na tę wizytę.',
  sendToCaregiver: 'Wyślij opiekunce',
  includePhotos: 'Dołącz zdjęcia do tego linku',
  includePhotosHint:
    'Domyślnie wyłączone. Po włączeniu zdjęcia trafiają do krótkiego linku, żeby opiekunka je zobaczyła. Każdy ze linkiem też je zobaczy.',
  sendHint: 'Wyślij tworzy krótki prywatny link na ich telefon. Przewodnik plus Zapytaj. Wygasa po 14 dniach.',
  preparingLink: 'Przygotowuję link…',
  couldNotShare: 'Nie udało się udostępnić. Spróbuj ponownie.',
  whileYouAreHereFor: (name) => `Gdy tu jesteś dla ${name}`,
  aTypicalDayFor: (name) => `Typowy dzień dla ${name}`,
  forName: (name) => `Dla ${name}`,
  useProduct: (product) => `Użyj ${product}`,
};

const RO: ChromeCopy = {
  ...EN,
  languageHint:
    'Limba ghidului — engleză sau franceză implicit, cu comutare spre limbile cele mai comune printre îngrijitori și personal domestic în UK și Franța (inclusiv portugheza braziliană și tagalog). Faptele de siguranță rămân în cuvintele părintelui; Ask răspunde în această limbă.',
  askAboutAnything: 'Întreabă orice',
  ask: 'Întreabă',
  looking: 'Caut…',
  askTitle: 'Întreabă',
  askHintCaregiver:
    'Răspuns doar din acest ghid. Întreabă în limba ta — răspunsul urmează alegerea de mai sus.',
  askHintParent: 'Răspuns doar din ce a fost scris în acest ghid. Întreabă în limba pe care o vrei.',
  openGuideFirst: 'Deschide mai întâi ghidul din linkul primit, apoi Întreabă va funcționa pe acest telefon.',
  backToGuide: 'Înapoi la ghid',
  readFirst: 'Citește mai întâi',
  readThisFirst: 'Citește asta mai întâi',
  iHaveReadThis: 'Am citit asta',
  safetyNotesReopen: 'Note de siguranță. Atinge pentru a redeschide.',
  hideAgain: 'Ascunde din nou',
  allergiesMedicationEmergencies: 'Alergii, medicamente și urgențe',
  readShow: 'Citește · arată',
  everyone: 'Toată lumea',
  whileYouAreHere: 'Cât ești aici',
  aTypicalDay: 'O zi tipică',
  nice: 'Dacă poți',
  must: 'Obligatoriu',
  yourGuide: 'Ghidul tău',
  nothingWritten: 'Nu s-a notat nimic pentru această vizită.',
  sendToCaregiver: 'Trimite îngrijitorului',
  includePhotos: 'Include poze în acest link',
  includePhotosHint:
    'Dezactivat implicit. Când e activ, pozele intră în linkul scurt ca îngrijitorul să le vadă. Oricine are linkul le vede și el.',
  sendHint: 'Trimite creează un link privat scurt pentru telefonul lor. Ghid plus Întreabă. Expiră după 14 zile.',
  preparingLink: 'Pregătesc linkul…',
  couldNotShare: 'Nu s-a putut partaja. Încearcă din nou.',
  whileYouAreHereFor: (name) => `Cât ești aici pentru ${name}`,
  aTypicalDayFor: (name) => `O zi tipică pentru ${name}`,
  forName: (name) => `Pentru ${name}`,
  useProduct: (product) => `Folosește ${product}`,
};

const IT: ChromeCopy = {
  ...EN,
  languageHint:
    'Lingua della guida — inglese o francese di default, con un’opzione per le lingue più comuni tra babysitter e collaboratori domestici in UK e Francia (incluso il portoghese brasiliano e il tagalog). I fatti di sicurezza restano nelle parole del genitore; Ask risponde in questa lingua.',
  askAboutAnything: 'Chiedi qualsiasi cosa',
  ask: 'Chiedi',
  looking: 'Cerco…',
  askTitle: 'Chiedi',
  askHintCaregiver:
    'Risposta solo da questa guida. Chiedi nella tua lingua: la risposta segue la scelta sopra.',
  askHintParent: 'Risposta solo da ciò che è scritto in questa guida. Chiedi nella lingua che preferisci.',
  openGuideFirst: 'Apri prima la guida dal link che hai ricevuto, poi Chiedi funzionerà su questo telefono.',
  backToGuide: 'Torna alla guida',
  readFirst: 'Leggi prima',
  readThisFirst: 'Leggi questo prima',
  iHaveReadThis: 'Ho letto questo',
  safetyNotesReopen: 'Note di sicurezza. Tocca per riaprire.',
  hideAgain: 'Nascondi di nuovo',
  allergiesMedicationEmergencies: 'Allergie, farmaci ed emergenze',
  readShow: 'Leggi · mostra',
  everyone: 'Tutti',
  whileYouAreHere: 'Mentre sei qui',
  aTypicalDay: 'Una giornata tipo',
  nice: 'Se puoi',
  must: 'Obbligatorio',
  yourGuide: 'La tua guida',
  nothingWritten: 'Non è stato scritto nulla per questa visita.',
  sendToCaregiver: 'Invia al caregiver',
  includePhotos: 'Includi le foto in questo link',
  includePhotosHint:
    'Disattivato di default. Se attivo, le foto entrano nel link breve così il caregiver le vede. Chi ha il link le vede anche.',
  sendHint: 'Invia crea un link privato breve per il loro telefono. Guida più Chiedi. Scade dopo 14 giorni.',
  preparingLink: 'Preparazione del link…',
  couldNotShare: 'Impossibile condividere. Riprova.',
  whileYouAreHereFor: (name) => `Mentre sei qui per ${name}`,
  aTypicalDayFor: (name) => `Una giornata tipo per ${name}`,
  forName: (name) => `Per ${name}`,
  useProduct: (product) => `Usa ${product}`,
};

const BY_TAG: Record<string, ChromeCopy> = {
  en: EN,
  fr: FR,
  'pt-BR': PT_BR,
  'pt-PT': PT_PT,
  es: ES,
  tl: TL,
  ar: AR,
  pl: PL,
  ro: RO,
  it: IT,
};

/** Chrome copy for a care-language tag. Falls back to English. */
export function chromeFor(tag: string): ChromeCopy {
  const matched = matchCareLanguage(tag).tag;
  return BY_TAG[matched] ?? EN;
}

/** Remap known English system / prompt titles inside a guide heading.
 *
 *  Custom parent titles are left alone. Only exact segment matches against
 *  `chrome.entryTitles` (and the fixed chrome headings) are rewritten.
 */
export function localizeGuideHeading(heading: string, chrome: ChromeCopy): string {
  const fixed: Record<string, string> = {
    'Who to call': chrome.whoToCall,
    Important: chrome.important,
    'Anything else': chrome.anythingElse,
    allergies: chrome.allergies,
    medication: chrome.medication,
    'in an emergency': chrome.inAnEmergency,
    ...chrome.entryTitles,
  };
  return heading
    .split(' — ')
    .map((part) => fixed[part] ?? part)
    .join(' — ');
}
