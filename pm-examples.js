/* PM Toolkit — Shared example scenarios
   4 coherent products. Each scenario carries consistent data for all 6 tools so a
   tester gets one connected story across the toolkit without typing anything.
   The chosen scenario is persisted (pmExampleIdx): clicking "Exemple" on a tool keeps
   the same scenario as the other tools; re-clicking on the same tool advances to the next. */
(function(G) {
  'use strict';

  var KEY = 'pmExampleIdx';

  var SCENARIOS = [
    /* ── 1. Plantaime — application mobile B2C, soin des plantes ── */
    {
      key: 'plantaime',
      discovery: {
        problem: "Les nouveaux propriétaires de plantes d'intérieur les laissent dépérir faute de savoir quand et comment les arroser et les exposer.",
        target: "Jeunes urbains 25-35 ans, débutants en plantes",
        context: "App mobile B2C de soin des plantes, marché français, phase d'acquisition"
      },
      interview: {
        context: "App mobile de soin des plantes, phase de fidélisation, 12k utilisateurs",
        notes: "Léa, 28 ans, vit en appartement, possède 6 plantes depuis un an.\n\n- A déjà perdu 3 plantes faute de savoir si elle arrosait trop ou pas assez.\n- Utilise des rappels génériques dans son téléphone mais ne les adapte jamais à la saison.\n- A téléchargé l'app pour le diagnostic photo mais ne revient pas chaque semaine.\n- Aimerait des conseils personnalisés selon la luminosité de son salon.\n- Citation : \"Je veux juste qu'on me dise quoi faire aujourd'hui, sans devenir botaniste\".",
        interviews: [
          { label: "Entretien 1 : Léa, débutante urbaine", text: "Léa, 28 ans, 6 plantes en appartement, utilisatrice depuis 2 mois.\n\n- A perdu 3 plantes faute de savoir doser l'arrosage.\n- Trouve le diagnostic photo bluffant mais oublie de revenir dans l'app.\n- Citation : \"Je veux qu'on me dise quoi faire aujourd'hui, pas un cours de botanique\"." },
          { label: "Entretien 2 : Karim, collectionneur", text: "Karim, 34 ans, 40 plantes, passionné, utilisateur quotidien.\n\n- Veut un calendrier d'entretien par plante, pas des rappels génériques.\n- Frustré de ne pas pouvoir noter ses propres observations.\n- Citation : \"L'app me traite comme un débutant alors que j'ai 40 plantes à suivre\"." }
        ]
      },
      okr: {
        name: "Plantaime", type: "Application mobile",
        ambitions: "Augmenter la rétention au premier mois qui est trop faible et transformer le diagnostic photo en habitude hebdomadaire. Préparer une offre premium sans casser l'expérience gratuite.",
        metrics: "Rétention M1 19%, 12k utilisateurs actifs, 2,3 sessions/semaine, conversion premium 4%"
      },
      backlog: {
        context: "App mobile soin des plantes, 12k utilisateurs, priorité rétention M1",
        stories: [
          "Créer des rappels d'arrosage personnalisés par plante et par saison",
          "Ajouter un calendrier d'entretien hebdomadaire sur l'écran d'accueil",
          "Permettre d'ajouter des notes et photos de suivi sur chaque plante",
          "Envoyer une notification de diagnostic photo une fois par semaine",
          "Lancer une offre premium avec conseils personnalisés selon la luminosité"
        ]
      },
      epic: {
        title: "Calendrier d'entretien personnalisé",
        desc: "Les utilisateurs ne reviennent pas chaque semaine car les rappels sont génériques. Construire un calendrier d'entretien par plante qui s'adapte à l'espèce, à la saison et à la luminosité déclarée, avec une vue 'à faire aujourd'hui' sur l'accueil.",
        persona: "Débutant urbain qui veut des consignes simples",
        tech: "App mobile React Native, notifications push, backend Node"
      },
      roadmap: {
        product: "Plantaime",
        vision: "Devenir l'assistant qui garde vivantes les plantes de tous les débutants urbains.",
        features: [
          { text: "Rappels d'arrosage personnalisés par plante", period: "now" },
          { text: "Vue 'à faire aujourd'hui' sur l'accueil", period: "now" },
          { text: "Notes et photos de suivi par plante", period: "next" },
          { text: "Offre premium conseils personnalisés", period: "next" },
          { text: "Diagnostic maladies par photo", period: "later" },
          { text: "Communauté et échange de boutures", period: "later" }
        ]
      }
    },

    /* ── 2. Facturio — fintech B2B, facturation et relances pour freelances ── */
    {
      key: 'facturio',
      discovery: {
        problem: "Les freelances perdent du temps et du chiffre d'affaires à relancer manuellement leurs clients pour les factures impayées.",
        target: "Freelances tech et créatifs, 25-45 ans",
        context: "App de facturation et de relance de paiement, marché français, B2B indépendants"
      },
      interview: {
        context: "App de facturation pour freelances, phase d'activation",
        notes: "Thomas, 36 ans, développeur freelance, 15 à 20 factures par mois.\n\n- Relance ses clients à la main par email, souvent en retard ou pas du tout.\n- A déjà perdu 2000€ sur une facture jamais relancée dans le rush.\n- Tient son suivi dans un tableur qu'il oublie de mettre à jour.\n- Voudrait des relances automatiques mais garder un ton personnalisable.\n- Citation : \"Relancer, c'est gênant et chronophage. Si c'était automatique, je dormirais mieux\".",
        interviews: [
          { label: "Entretien 1 : Thomas, dev freelance", text: "Thomas, 36 ans, 15 à 20 factures par mois, utilisateur depuis 1 mois.\n\n- Relance à la main, souvent en retard, a perdu 2000€ sur une facture oubliée.\n- Suivi dans un tableur jamais à jour.\n- Citation : \"Si les relances étaient automatiques, je dormirais mieux\"." },
          { label: "Entretien 2 : Inès, graphiste", text: "Inès, 29 ans, graphiste freelance, gros clients qui paient à 60 jours.\n\n- Déteste relancer ses clients par peur de paraître insistante.\n- Veut voir d'un coup d'œil ce qui est payé, en attente, en retard.\n- Citation : \"Je veux un tableau de bord qui me dit où va mon argent\"." }
        ]
      },
      okr: {
        name: "Facturio", type: "Fintech",
        ambitions: "Faire des relances automatiques l'habitude par défaut et réduire le délai de paiement moyen. Convertir les utilisateurs gratuits qui facturent régulièrement vers l'offre payante.",
        metrics: "Délai de paiement moyen 47 jours, 8k freelances actifs, 22% activent les relances auto, conversion payante 6%"
      },
      backlog: {
        context: "App de facturation freelances, 8k utilisateurs, priorité activation des relances",
        stories: [
          "Activer des relances de paiement automatiques avec modèles personnalisables",
          "Afficher un tableau de bord payé / en attente / en retard",
          "Importer ses factures existantes depuis un tableur ou un PDF",
          "Envoyer un rappel au freelance quand une facture dépasse l'échéance",
          "Proposer le paiement en ligne par lien dans la facture"
        ]
      },
      epic: {
        title: "Relances de paiement automatiques",
        desc: "Les freelances relancent mal et tard, ce qui allonge les délais de paiement. Mettre en place des séquences de relance automatiques, déclenchées à l'échéance, avec des modèles de message personnalisables et un suivi de l'état de chaque facture.",
        persona: "Freelance qui déteste relancer ses clients",
        tech: "SaaS web, backend Python, intégration emailing et paiement"
      },
      roadmap: {
        product: "Facturio",
        vision: "Permettre à chaque freelance d'être payé à temps sans jamais avoir à relancer soi-même.",
        features: [
          { text: "Relances automatiques à l'échéance", period: "now" },
          { text: "Tableau de bord payé / en attente / en retard", period: "now" },
          { text: "Import des factures existantes", period: "next" },
          { text: "Paiement en ligne par lien", period: "next" },
          { text: "Prévision de trésorerie", period: "later" },
          { text: "Relance par SMS et courrier", period: "later" }
        ]
      }
    },

    /* ── 3. Cohortia — EdTech, complétion des parcours et offre entreprise ── */
    {
      key: 'cohortia',
      discovery: {
        problem: "Les apprenants en ligne abandonnent leurs parcours avant la fin, ce qui plombe la valeur perçue et le bouche-à-oreille.",
        target: "Actifs 25-40 ans en reconversion ou montée en compétences",
        context: "Plateforme EdTech de cours en ligne, B2C avec une offre entreprise naissante"
      },
      interview: {
        context: "Plateforme de cours en ligne, phase de rétention et lancement de l'offre entreprise",
        notes: "Sarah, 31 ans, en reconversion data, a acheté 3 parcours, en a fini un seul.\n\n- Démarre motivée puis décroche au bout de deux semaines sans relance.\n- Se sent seule, sans repère sur sa progression réelle.\n- Aimerait des sessions en cohorte avec d'autres apprenants pour tenir.\n- Citation : \"Toute seule, je lâche. Avec un groupe et des échéances, je tiens\".",
        interviews: [
          { label: "Entretien 1 : Sarah, en reconversion", text: "Sarah, 31 ans, reconversion data, 3 parcours achetés, 1 terminé.\n\n- Décroche au bout de 2 semaines sans relance ni repère de progression.\n- Citation : \"Toute seule je lâche, avec un groupe et des échéances je tiens\"." },
          { label: "Entretien 2 : David, responsable formation", text: "David, 45 ans, responsable formation dans une ETI, évalue l'offre entreprise.\n\n- Veut suivre la progression de ses équipes et prouver le ROI à sa direction.\n- Bloqué par l'absence de tableau de bord administrateur.\n- Citation : \"Sans reporting d'équipe, je ne peux pas justifier le budget\"." }
        ]
      },
      okr: {
        name: "Cohortia", type: "EdTech",
        ambitions: "Relever le taux de complétion des parcours qui est trop bas et lancer une offre entreprise crédible avec reporting d'équipe. Réduire le coût d'acquisition qui a grimpé.",
        metrics: "Taux de complétion 24%, CAC 38€, 16k apprenants actifs, 4 entreprises pilotes"
      },
      backlog: {
        context: "Plateforme EdTech, 16k apprenants, priorité complétion et offre entreprise",
        stories: [
          "Lancer des parcours en cohorte avec dates de début et échéances",
          "Afficher une barre de progression et des relances de reprise",
          "Créer un tableau de bord administrateur pour les entreprises",
          "Ajouter des certifications et badges partageables sur LinkedIn",
          "Permettre l'inscription groupée des collaborateurs par une entreprise"
        ]
      },
      epic: {
        title: "Parcours en cohorte",
        desc: "Les apprenants seuls décrochent vite. Introduire des parcours en cohorte avec une date de démarrage commune, des échéances rythmées, des points d'étape entre pairs et des relances de reprise, pour augmenter la complétion.",
        persona: "Apprenant en reconversion qui a besoin de cadre",
        tech: "Plateforme web, backend Node, emailing, vidéo"
      },
      roadmap: {
        product: "Cohortia",
        vision: "Faire de l'apprentissage en ligne une expérience collective qu'on termine vraiment.",
        features: [
          { text: "Parcours en cohorte avec échéances", period: "now" },
          { text: "Progression et relances de reprise", period: "now" },
          { text: "Tableau de bord administrateur entreprise", period: "next" },
          { text: "Certifications et badges LinkedIn", period: "next" },
          { text: "Recommandation de parcours personnalisée", period: "later" },
          { text: "Marketplace de formateurs", period: "later" }
        ]
      }
    },

    /* ── 4. Troquet — marketplace B2C, achat-vente d'occasion entre particuliers ── */
    {
      key: 'troquet',
      discovery: {
        problem: "Les particuliers qui veulent vendre des objets d'occasion près de chez eux trouvent le processus lent et peu sûr, et abandonnent leurs annonces.",
        target: "Particuliers 25-45 ans en ville, vendeurs et acheteurs occasionnels",
        context: "Marketplace mobile d'achat-vente d'occasion entre particuliers locaux"
      },
      interview: {
        context: "Marketplace d'occasion locale, phase de liquidité de l'offre",
        notes: "Manon, 30 ans, vend et achète d'occasion, surtout du mobilier et des vêtements.\n\n- Poste une annonce puis croule sous les messages \"c'est toujours dispo ?\".\n- A renoncé à deux ventes par peur du paiement et de la remise en main propre.\n- Trouve la mise en ligne trop longue, surtout pour fixer le prix.\n- Citation : \"Je veux vendre vite et sans stress, pas négocier pendant trois jours\".",
        interviews: [
          { label: "Entretien 1 : Manon, vendeuse occasionnelle", text: "Manon, 30 ans, vend mobilier et vêtements d'occasion.\n\n- Croule sous les messages \"toujours dispo ?\", renonce par peur du paiement.\n- Trouve la mise en ligne trop longue, surtout pour fixer le prix.\n- Citation : \"Je veux vendre vite et sans stress\"." },
          { label: "Entretien 2 : Yanis, acheteur", text: "Yanis, 27 ans, achète d'occasion pour le prix et l'écologie.\n\n- Méfiant sur l'état réel des objets et sur les arnaques au paiement.\n- Veut pouvoir réserver et payer en sécurité dans l'app.\n- Citation : \"Si le paiement est protégé, j'achète sans hésiter\"." }
        ]
      },
      okr: {
        name: "Troquet", type: "Marketplace",
        ambitions: "Fluidifier la mise en ligne et sécuriser les transactions pour augmenter le nombre de ventes abouties. Renforcer la liquidité locale pour que chaque annonce trouve preneur vite.",
        metrics: "35% des annonces vendues sous 14 jours, 25k utilisateurs actifs, délai moyen de vente 11 jours, 3,1 messages avant vente"
      },
      backlog: {
        context: "Marketplace d'occasion locale, 25k utilisateurs, priorité ventes abouties",
        stories: [
          "Préremplir le prix conseillé à partir d'une photo et d'une catégorie",
          "Intégrer un paiement sécurisé avec mise sous séquestre",
          "Ajouter des réponses rapides automatiques aux questions fréquentes",
          "Proposer des points de retrait et la livraison en option",
          "Mettre en avant les annonces proches de l'acheteur"
        ]
      },
      epic: {
        title: "Paiement sécurisé intégré",
        desc: "Les ventes échouent par peur des arnaques et de la remise en main propre. Intégrer un paiement sécurisé avec séquestre, libéré à la réception, plus une option de livraison et des points de retrait, pour mettre acheteurs et vendeurs en confiance.",
        persona: "Vendeur occasionnel qui veut vendre vite et en sécurité",
        tech: "App mobile, paiement séquestre, intégration transporteurs"
      },
      roadmap: {
        product: "Troquet",
        vision: "Rendre l'achat-vente d'occasion entre voisins aussi simple et sûr qu'un achat neuf.",
        features: [
          { text: "Prix conseillé automatique à la mise en ligne", period: "now" },
          { text: "Paiement sécurisé avec séquestre", period: "now" },
          { text: "Réponses rapides automatiques", period: "next" },
          { text: "Livraison et points de retrait", period: "next" },
          { text: "Mise en avant des annonces proches", period: "later" },
          { text: "Authentification des objets de valeur", period: "later" }
        ]
      }
    }
  ];

  /* ── Baked demo session (Plantaime) ──
     A fully generated session — not just form inputs — so the guided demo can land
     straight on a complete Product Brief without any live AI call. Shapes match what
     each tool saves under its slot (see pm-session.js EXTRACTORS). */
  var DEMO_SESSION = {
    discovery: {
      problem: "Les nouveaux propriétaires de plantes les laissent dépérir faute de savoir quand et comment les arroser.",
      target: "Jeunes urbains 25-35 ans, débutants en plantes",
      context: "App mobile B2C de soin des plantes, marché français",
      result: {
        hypotheses: [
          { belief: "Nous croyons que les débutants abandonnent car les rappels génériques ne correspondent pas à leurs plantes réelles.", signal: "Nous le saurons si moins de 30% personnalisent leurs rappels la première semaine." },
          { belief: "Nous croyons que le diagnostic photo crée le 'aha' mais ne devient pas une habitude.", signal: "Nous le saurons si le diagnostic est utilisé moins de 1 fois par semaine après J7." },
          { belief: "Nous croyons que la peur de mal faire freine plus que le manque d'envie.", signal: "Nous le saurons si 'peur de tuer la plante' ressort dans plus de la moitié des entretiens." }
        ]
      }
    },
    interview: {
      context: "App mobile soin des plantes, 12k utilisateurs",
      result: {
        persona: { name: "Léa, débutante urbaine", emoji: "🌱", description: "28 ans, 6 plantes en appartement, veut des consignes simples sans devenir botaniste.", tags: ["débutante", "pressée", "veut du concret"] },
        pain_groups: [
          { group: "Dosage de l'arrosage incertain", count: 5, items: ["A perdu 3 plantes faute de savoir doser", "Ne sait pas adapter à la saison"] },
          { group: "Rappels non adaptés", count: 3, items: ["Rappels génériques jamais ajustés", "Pas de vue 'aujourd'hui'"] }
        ],
        opportunities: [
          { title: "Vue 'à faire aujourd'hui' sur l'accueil", description: "Une seule action claire par jour", impact: "fort" },
          { title: "Rappels personnalisés par plante et saison", description: "Adaptés à l'espèce et la luminosité", impact: "fort" },
          { title: "Notes et photos de suivi", description: "Pour les utilisateurs plus engagés", impact: "moyen" }
        ],
        quotes: [
          { text: "Je veux qu'on me dise quoi faire aujourd'hui, pas un cours de botanique.", profile: "Léa, débutante" },
          { text: "L'app me traite comme un débutant alors que j'ai 40 plantes à suivre.", profile: "Karim, collectionneur" }
        ]
      }
    },
    okr: {
      productName: "Plantaime", productType: "Application mobile",
      ambitions: "Transformer le diagnostic photo en habitude hebdomadaire et relever la rétention au premier mois.",
      metrics: "Rétention M1 19%, 2,3 sessions/semaine, conversion premium 4%",
      result: {
        okrs: [
          { objective: "Faire de Plantaime le réflexe quotidien des débutants", key_results: [
            { text: "Porter la rétention M1 de 19% à 35%", baseline: "19%", type: "metric" },
            { text: "Atteindre 4 sessions par semaine et par utilisateur actif", baseline: "2,3", type: "metric" },
            { text: "80% des nouveaux comptes personnalisent au moins une plante en J7", baseline: "—", type: "milestone" }
          ] }
        ]
      }
    },
    backlog: {
      context: "App mobile soin des plantes, priorité rétention M1",
      result: {
        method: "rice",
        items: [
          { story: "Vue 'à faire aujourd'hui' sur l'écran d'accueil", score: 9.0, rank: 1, justification: "Reach maximal, effort modéré, adresse le pain n°1 et l'opportunité forte." },
          { story: "Rappels d'arrosage personnalisés par plante et saison", score: 7.5, rank: 2, justification: "Fort impact rétention, effort moyen côté logique saisonnière." },
          { story: "Notes et photos de suivi par plante", score: 5.2, rank: 3, justification: "Engage les utilisateurs avancés mais reach plus limité." }
        ]
      }
    },
    epic: {
      epicTitle: "Calendrier d'entretien personnalisé", persona: "Débutant urbain qui veut des consignes simples",
      epicDesc: "Construire une vue 'à faire aujourd'hui' qui s'adapte à l'espèce, la saison et la luminosité déclarée.",
      result: {
        epic_summary: "Calendrier d'entretien par plante avec vue quotidienne sur l'accueil.",
        stories: [
          { id: "US-1", title: "Voir mes tâches du jour sur l'accueil", story: "En tant que débutant, je veux voir quoi faire aujourd'hui afin d'agir sans réfléchir.", priority: "Must", effort: "M", type: "feature", acceptance_criteria: ["Liste des plantes à arroser aujourd'hui", "1 tap pour marquer comme fait", "État vide encourageant"] },
          { id: "US-2", title: "Personnaliser le rythme par plante", story: "En tant qu'utilisateur, je veux régler la fréquence par plante afin que les rappels soient justes.", priority: "Should", effort: "M", type: "feature", acceptance_criteria: ["Fréquence ajustable par plante", "Suggestion par défaut selon l'espèce"] }
        ]
      }
    },
    roadmap: {
      productName: "Plantaime", vision: "Devenir l'assistant qui garde vivantes les plantes de tous les débutants urbains.",
      result: {
        narrative: "Plantaime veut passer du gadget de diagnostic au réflexe quotidien. Plutôt que des rappels génériques, l'utilisateur ouvre l'app et voit une seule chose : ce qu'il doit faire aujourd'hui pour ses plantes. La personnalisation par espèce et saison rend chaque conseil juste, et transforme la peur de mal faire en petites victoires régulières.",
        periods: [
          { key: "now", label: "Maintenant", theme: "Habitude quotidienne", features: [
            { title: "Vue 'à faire aujourd'hui'", why: "Supprime l'hésitation : une action claire par jour." },
            { title: "Rappels personnalisés par plante", why: "Des conseils justes, adaptés à l'espèce et la saison." }
          ] },
          { key: "next", label: "Ensuite", theme: "Engagement", features: [
            { title: "Notes et photos de suivi", why: "Donne de la profondeur aux utilisateurs qui s'attachent." }
          ] },
          { key: "later", label: "Plus tard", theme: "Premium", features: [
            { title: "Conseils selon la luminosité", why: "Base d'une offre premium à forte valeur perçue." }
          ] }
        ],
        talking_points: [
          "Notre North Star : la rétention au premier mois, pas le nombre de téléchargements.",
          "Chaque conseil juste transforme une peur en petite victoire.",
          "Le premium se construit sur la personnalisation, pas sur des murs payants."
        ]
      }
    }
  };

  function idx() {
    var n = SCENARIOS.length;
    try { var v = parseInt(localStorage.getItem(KEY) || '0', 10); if (isNaN(v)) v = 0; return ((v % n) + n) % n; }
    catch(e) { return 0; }
  }
  function setIdx(i) {
    var n = SCENARIOS.length;
    try { localStorage.setItem(KEY, String(((i % n) + n) % n)); } catch(e) {}
  }

  // Per-page state: first click loads the current shared scenario (coherent with the
  // other tools); a re-click on the same page advances to the next scenario (variety).
  var _shown = false;
  function step() {
    if (_shown) setIdx(idx() + 1);
    _shown = true;
    return SCENARIOS[idx()];
  }
  function current() { return SCENARIOS[idx()]; }

  // Lookup a scenario by its key (used by the guided journey, deterministic).
  function find(key) {
    for (var i = 0; i < SCENARIOS.length; i++) { if (SCENARIOS[i].key === key) return SCENARIOS[i]; }
    return null;
  }
  // Lightweight list for the hub scenario picker.
  function list() {
    return SCENARIOS.map(function(s) {
      return {
        key: s.key,
        name: (s.okr && s.okr.name) || s.key,
        type: (s.okr && s.okr.type) || '',
        tagline: (s.discovery && s.discovery.context) || ''
      };
    });
  }

  G.PMExamples = { SCENARIOS: SCENARIOS, DEMO_SESSION: DEMO_SESSION, idx: idx, setIdx: setIdx, step: step, current: current, find: find, list: list };

})(window);
