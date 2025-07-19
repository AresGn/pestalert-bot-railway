/**
 * Configuration des langues et messages pour l'Afrique de l'Ouest
 */

export type SupportedLanguage = 'fr' | 'bambara' | 'moore' | 'ewe' | 'dioula' | 'fon';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  countries: string[];
  speakers: number; // en millions
  priority: 'critical' | 'high' | 'medium' | 'low';
  audioSupport: boolean;
}

export interface MessageTemplates {
  [key: string]: {
    [language in SupportedLanguage]: string;
  };
}

/**
 * Configuration des langues supportées
 */
export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'fr',
    name: 'French (Simplified)',
    nativeName: 'Français simplifié',
    countries: ['CI', 'ML', 'TG', 'BJ', 'NE', 'GH'],
    speakers: 280,
    priority: 'critical',
    audioSupport: true
  },
  {
    code: 'bambara',
    name: 'Bambara',
    nativeName: 'Bamanankan',
    countries: ['ML'],
    speakers: 14,
    priority: 'high',
    audioSupport: true
  },
  {
    code: 'moore',
    name: 'Mooré',
    nativeName: 'Mòoré',
    countries: ['BF'],
    speakers: 7,
    priority: 'high',
    audioSupport: true
  },
  {
    code: 'ewe',
    name: 'Ewe',
    nativeName: 'Eʋegbe',
    countries: ['TG', 'GH'],
    speakers: 6,
    priority: 'medium',
    audioSupport: false // À implémenter plus tard
  },
  {
    code: 'dioula',
    name: 'Dioula',
    nativeName: 'Jula',
    countries: ['CI'],
    speakers: 5,
    priority: 'medium',
    audioSupport: false // À implémenter plus tard
  },
  {
    code: 'fon',
    name: 'Fon',
    nativeName: 'Fɔngbe',
    countries: ['BJ'],
    speakers: 4,
    priority: 'medium',
    audioSupport: false // À implémenter plus tard
  }
];

/**
 * Mots-clés pour la détection automatique des langues
 */
export const LANGUAGE_DETECTION_KEYWORDS = {
  bambara: [
    'ni ce', 'i ni ce', 'sɛnɛkɛ', 'sɛnɛkɛla', 'ka nyɛ', 'an ka', 'i bɛ', 
    'ka kɛ', 'bamanankan', 'mali', 'bamako', 'sɛbɛn', 'kalan'
  ],
  moore: [
    'yaa soaba', 'yaa', 'tɩ', 'sɛba', 'tõnd', 'sɛn', 'kõm', 'mòoré',
    'burkina', 'ouagadougou', 'sɛnkɛ', 'kõsem', 'sõalem'
  ],
  ewe: [
    'woezɔ', 'agble', 'nuku', 'míawo', 'ɖe', 'wò', 'agbledɔwɔla',
    'eʋegbe', 'togo', 'ghana', 'lomé', 'accra', 'gbè'
  ],
  dioula: [
    'an sɔrɔ', 'sɛnɛ', 'ka kɛ', 'ka di', 'jula', 'côte', 'ivoire',
    'abidjan', 'bouaké', 'sɛnɛkɛ', 'ka nyɛ'
  ],
  fon: [
    'kú àbó', 'gbè', 'àzɔ̃', 'mì', 'wè', 'gbèdoto', 'àgblɛ',
    'fɔngbe', 'bénin', 'cotonou', 'porto-novo', 'àgblɛmɛ'
  ]
};

/**
 * Templates de messages dans toutes les langues
 */
export const MESSAGE_TEMPLATES: MessageTemplates = {
  // Messages de bienvenue
  welcome: {
    fr: "👋 Salut ami agriculteur! Je suis PestAlert, ton assistant pour les cultures. 🌾",
    bambara: "👋 I ni ce, sɛnɛkɛla! N ye PestAlert ye, i ka sɛnɛkɛ dɛmɛbaga ye. 🌾",
    moore: "👋 Yaa soaba, sɛnkɛdba! Mam ye PestAlert ye, a sɛnkɛ sõalem-tũma ye. 🌾",
    ewe: "👋 Woezɔ, agbledɔwɔla! Nyee PestAlert, wò agble kpekpeɖeŋu ye. 🌾",
    dioula: "👋 An sɔrɔ, sɛnɛkɛla! N ye PestAlert ye, i ka sɛnɛkɛ dɛmɛbaga ye. 🌾",
    fon: "👋 Kú àbó, àgblɛmɛ! Un jí PestAlert, mì àgblɛ alɔdlɛntɔ ye. 🌾"
  },

  // Menu principal
  menu: {
    fr: "Choisis une option:\n1️⃣ 📷 Photo de ton plant\n2️⃣ 🚨 Problème urgent\n3️⃣ ❓ Aide\n\nTape: 1, 2 ou 3",
    bambara: "Fɛn dɔ sugandi:\n1️⃣ 📷 I ka sɛnɛkɛ ja\n2️⃣ 🚨 Gɛlɛya teliya\n3️⃣ ❓ Dɛmɛ\n\nSɛbɛn: 1, 2 walima 3",
    moore: "Tɩ-kãnga yõkre:\n1️⃣ 📷 A sɛnkɛ foto\n2️⃣ 🚨 Kõsem-tũuma\n3️⃣ ❓ Sõalem\n\nSɛbga: 1, 2 kamba 3",
    ewe: "Tia nane ɖeka:\n1️⃣ 📷 Wò agble ƒe foto\n2️⃣ 🚨 Kuxiame vevie\n3️⃣ ❓ Kpekpeɖeŋu\n\nŋlɔ: 1, 2 alo 3",
    dioula: "Fɛn kelen sugandi:\n1️⃣ 📷 I ka sɛnɛkɛ ja\n2️⃣ 🚨 Gɛlɛya teliya\n3️⃣ ❓ Dɛmɛ\n\nSɛbɛn: 1, 2 walima 3",
    fon: "Hɛn ɖokpo jiɖo:\n1️⃣ 📷 Mì àgblɛ ɖaxɔ\n2️⃣ 🚨 Nukún gbɛtɔ\n3️⃣ ❓ Alɔdlɛn\n\nNyɔn: 1, 2 kpó 3"
  },

  // Plant en bonne santé
  healthy: {
    fr: "✅ Excellente nouvelle! Ton plant va très bien. Continue comme ça! 👍🌱",
    bambara: "✅ Kuma nyuman kosɛbɛ! I ka sɛnɛkɛ ka nyɛ kosɛbɛ. O cogo kelen na kɛ! 👍🌱",
    moore: "✅ Yãmb-kãnga! A sɛnkɛ sɔm ka nyɛ. Tõnd-kãngã kɛ! 👍🌱",
    ewe: "✅ Nyanyui geɖe! Wò agble le nyuie ŋutɔ. Yi edzi abe ale ene! 👍🌱",
    dioula: "✅ Kuma nyuman kosɛbɛ! I ka sɛnɛkɛ ka nyɛ kosɛbɛ. O cogo kelen na kɛ! 👍🌱",
    fon: "✅ Nyɔnú nyɔn! Mì àgblɛ ɖo nyɔn ŋutɔ. Yi edzi ɖo ɖo! 👍🌱"
  },

  // Plant malade
  diseased: {
    fr: "⚠️ Attention! Petites bêtes détectées sur ton plant. Traite rapidement! 🐛💊",
    bambara: "⚠️ Kɔlɔsi! Kɔnɔbagaw ye sɔrɔ i ka sɛnɛkɛ kan. Ka furakɛ kɛ joona! 🐛💊",
    moore: "⚠️ Kõ-yãmde! Yɩɩbsa ye sɔr a sɛnkɛ pʋgɛ. Ka yɩɩb-kõsem kɛ! 🐛💊",
    ewe: "⚠️ Kpɔɖeŋu! Nudzodzoe aɖewo le wò agble dzi. Kpɔ wo dzi enumake! 🐛💊",
    dioula: "⚠️ Kɔlɔsi! Kɔnɔbagaw ye sɔrɔ i ka sɛnɛkɛ kan. Ka furakɛ kɛ joona! 🐛💊",
    fon: "⚠️ Kpɔɖeŋu! Lɛkɛ susu ɖewo ɖo mì àgblɛ ji. Kpɔ wo ɖo kaba! 🐛💊"
  },

  // Alerte critique
  critical: {
    fr: "🚨 URGENT! Ton plant est très malade! Appelle un expert maintenant! 📞🆘",
    bambara: "🚨 TELIYA! I ka sɛnɛkɛ banaw kosɛbɛ! Ka dɔnkili wele sisan! 📞🆘",
    moore: "🚨 KÕSEM! A sɛnkɛ sɔm ban-tɩ! Ka dɔnkɛ-kãngre wɛl sãamba! 📞🆘",
    ewe: "🚨 KABA! Wò agble dze dɔ vevie! Yɔ nunyala aɖe fifia! 📞🆘",
    dioula: "🚨 TELIYA! I ka sɛnɛkɛ banaw kosɛbɛ! Ka dɔnkili wele sisan! 📞🆘",
    fon: "🚨 KABA! Mì àgblɛ ɖo azan gbɛtɔ! Yɔ àmɔ̀tɔ ɖeka fifia! 📞🆘"
  },

  // Photo pas claire
  unclear: {
    fr: "📷 Photo pas assez claire. Reprends avec plus de lumière s'il te plaît. ☀️",
    bambara: "📷 Ja man jɛ ka nyɛ. Ka segin ni yeelen caman ye, i ni barika. ☀️",
    moore: "📷 Foto kõ yɛlɛ ka nyɛ. Ka segin ni yɛlɛm-kãnga ye, tõnd-biig. ☀️",
    ewe: "📷 Foto la mekɔ nyuie o. Gaɖe kple kekeli geɖe, meɖe kuku. ☀️",
    dioula: "📷 Ja man jɛ ka nyɛ. Ka segin ni yeelen caman ye, i ni barika. ☀️",
    fon: "📷 Ɖaxɔ lɔ mɔ nyɔn o. Gaɖe kpó kɛkɛli geɖe, meɖe kuku. ☀️"
  },

  // Analyse en cours
  analyzing: {
    fr: "🔍 Analyse de ton plant en cours... Patiente un moment. ⏳",
    bambara: "🔍 I ka sɛnɛkɛ lajɛ bɛ ka kɛ... Makɔnɔ dɔɔni. ⏳",
    moore: "🔍 A sɛnkɛ lajɛ be kɛ-rẽ... Wẽnd dɔɔni. ⏳",
    ewe: "🔍 Wò agble ƒe dzodzome le edzi yim... Lala vie sue. ⏳",
    dioula: "🔍 I ka sɛnɛkɛ lajɛ bɛ ka kɛ... Makɔnɔ dɔɔni. ⏳",
    fon: "🔍 Mì àgblɛ ɖiɖi ɖo wá... Lɛ ɖɔɖɔɖɔ. ⏳"
  },

  // Aide
  help: {
    fr: "❓ Aide PestAlert:\n• Envoie photo de ton plant\n• Je te dis s'il va bien\n• Je t'aide si problème\n\nTape 'menu' pour revenir",
    bambara: "❓ PestAlert dɛmɛ:\n• I ka sɛnɛkɛ ja ci\n• N b'a fɔ i ye a ka hali\n• N b'i dɛmɛ ni gɛlɛya bɛ yen\n\nSɛbɛn 'menu' ka segin",
    moore: "❓ PestAlert sõalem:\n• A sɛnkɛ foto tõn\n• Mam tɩ a hali\n• Mam sõal-b a ni kõsem be\n\nSɛbga 'menu' ka yaa",
    ewe: "❓ PestAlert kpekpeɖeŋu:\n• Ɖo wò agble ƒe foto\n• Magblɔ ale si wòle na wò\n• Makpe ɖe ŋuwò ne kuxia le afi aɖe\n\nŋlɔ 'menu' nàtrɔ va",
    dioula: "❓ PestAlert dɛmɛ:\n• I ka sɛnɛkɛ ja ci\n• N b'a fɔ i ye a ka hali\n• N b'i dɛmɛ ni gɛlɛya bɛ yen\n\nSɛbɛn 'menu' ka segin",
    fon: "❓ PestAlert alɔdlɛn:\n• Mì àgblɛ ɖaxɔ ɖo\n• Un na ɖɔ mì àgblɛ ɖoɖo\n• Un na kpe ɖe ŋu wò ni nukún ɖe ɖo\n\nNyɔn 'menu' nà trɔ̀ wá"
  }
};

/**
 * Configuration des fichiers audio par langue
 */
export const AUDIO_FILE_MAPPING = {
  fr: {
    welcome: 'welcome.mp3',
    healthy: 'healthy.mp3',
    diseased: 'diseased.mp3',
    critical: 'critical.mp3',
    unclear: 'unclear.mp3',
    analyzing: 'analyzing.mp3'
  },
  bambara: {
    welcome: 'welcome_bambara.mp3',
    healthy: 'healthy_bambara.mp3',
    diseased: 'diseased_bambara.mp3',
    critical: 'critical_bambara.mp3',
    unclear: 'unclear_bambara.mp3',
    analyzing: 'analyzing_bambara.mp3'
  },
  moore: {
    welcome: 'welcome_moore.mp3',
    healthy: 'healthy_moore.mp3',
    diseased: 'diseased_moore.mp3',
    critical: 'critical_moore.mp3',
    unclear: 'unclear_moore.mp3',
    analyzing: 'analyzing_moore.mp3'
  },
  ewe: {
    welcome: 'welcome_ewe.mp3',
    healthy: 'healthy_ewe.mp3',
    diseased: 'diseased_ewe.mp3',
    critical: 'critical_ewe.mp3',
    unclear: 'unclear_ewe.mp3',
    analyzing: 'analyzing_ewe.mp3'
  },
  dioula: {
    welcome: 'welcome_dioula.mp3',
    healthy: 'healthy_dioula.mp3',
    diseased: 'diseased_dioula.mp3',
    critical: 'critical_dioula.mp3',
    unclear: 'unclear_dioula.mp3',
    analyzing: 'analyzing_dioula.mp3'
  },
  fon: {
    welcome: 'welcome_fon.mp3',
    healthy: 'healthy_fon.mp3',
    diseased: 'diseased_fon.mp3',
    critical: 'critical_fon.mp3',
    unclear: 'unclear_fon.mp3',
    analyzing: 'analyzing_fon.mp3'
  }
};

/**
 * Obtenir la configuration d'une langue
 */
export function getLanguageConfig(code: SupportedLanguage): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Obtenir les langues par priorité
 */
export function getLanguagesByPriority(): LanguageConfig[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return SUPPORTED_LANGUAGES.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Vérifier si une langue supporte l'audio
 */
export function hasAudioSupport(language: SupportedLanguage): boolean {
  const config = getLanguageConfig(language);
  return config?.audioSupport || false;
}
