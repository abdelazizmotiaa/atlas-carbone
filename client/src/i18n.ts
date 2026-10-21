/**
 * Atlas Carbone - Système de Traduction & Localisation Bilingue (FR / EN)
 * Conforme aux exigences de la Section 13 du Prompt Maître
 */

export type Language = 'fr' | 'en';

export function formatNumber(val: number | undefined | null, decimals = 2, lang: Language = 'fr'): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const rounded = Number(val).toFixed(decimals);
  if (lang === 'fr') {
    return rounded.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  return rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatDate(dateStr: string | undefined | null, lang: Language = 'fr'): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (lang === 'fr') {
      return d.toLocaleDateString('fr-MA', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export const translations = {
  fr: {
    // Navigation générale
    brandName: 'Atlas Carbone',
    brandTagline: 'Comptabilité Carbone & Conformité MACF Maroc',
    navOverview: 'Vue d’ensemble',
    navActivities: 'Activités & Saisie',
    navSectors: 'Parcours Sectoriels',
    navAcademy: 'Académie & Pédagogie',
    navReport: 'Rapport Officiel (BEGES)',
    navReduction: 'Plan de Décarbonation',
    navCbam: 'Module Export MACF',
    navQuotes: 'Devis & Abonnements',
    navCatalogAdmin: 'Gouvernance Catalogue',
    navLogout: 'Déconnexion',
    navTryGuest: 'Essayer sans compte',
    navCreateAccount: 'Créer mon espace entreprise',
    navLogin: 'Connexion',
    switchLang: 'English',

    // En-tête tenant
    orgSelector: 'Entreprise :',
    periodSelector: 'Exercice :',
    statusDraft: 'Brouillon en cours',
    statusToComplete: 'À compléter',
    statusReadyForReview: 'Prêt pour revue',
    statusReviewedInternal: 'Revu en interne',
    statusLocked: 'Clôturé & Immuable',
    btnOnboarding: 'Assistant guidé',
    btnClosePeriod: 'Clôturer l’exercice',

    // Landing & Vitrine
    heroBadge: 'RÉFÉRENTIEL MAROC 2026 • CONFORME ISO 14064-1 & GHG PROTOCOL',
    heroTitle: 'La comptabilité carbone souveraine pour les entreprises marocaines',
    heroSubtitle: 'Mesurez vos émissions Scopes 1, 2 et 3 à partir de vos données réelles de terrain (ONEE, carburant, fluides). Obtenez un inventaire certifiable et préparez vos déclarations MACF pour l’export.',
    heroCtaTry: 'Essayer sans compte (Accès immédiat)',
    heroCtaAccount: 'Créer un espace entreprise',
    heroNotice: 'Calculs 100% déterministes basés exclusivement sur le classeur de référence marocain. Vos données restent strictement confidentielles.',

    // Parcours Essai Invité
    trialModalTitle: 'Essayer Atlas Carbone sans créer de compte',
    trialModalDesc: 'Renseignez votre entreprise et saisissez vos premières activités. Vous obtiendrez un calcul immédiat et un rapport d’essai téléchargeable, avec la possibilité de transférer votre dossier vers un compte permanent.',
    trialCompanyName: 'Nom de votre entreprise',
    trialSector: 'Votre secteur d’activité',
    trialBtnStart: 'Démarrer mon essai gratuit',
    trialStep1: '1. Informations entreprise',
    trialStep2: '2. Saisie de vos activités',
    trialStep3: '3. Résultats & Rapport d’essai',
    trialClaimBanner: 'Vous travaillez actuellement sur une session temporaire d’essai (conservation 7 jours).',
    trialBtnClaim: 'Créer mon compte et conserver mon bilan',
    trialClaimTitle: 'Conserver mon bilan dans un espace entreprise sécurisé',
    trialClaimDesc: 'Créez votre accès sécurisé pour retrouver l’intégralité des données et calculs de cet essai sans aucune ressaisie.',
    trialFullName: 'Votre nom complet',
    trialEmail: 'Adresse email professionnelle',
    trialPassword: 'Mot de passe sécurisé',
    trialCity: 'Ville du siège (ex: Casablanca, Tanger)',
    trialBtnConfirmClaim: 'Valider et transférer mon dossier',

    // Saisie & Activités
    actTitle: 'Collecte et Saisie des Activités GES',
    actSubtitle: 'Renseignez vos consommations physiques réelles. Le moteur calcule immédiatement les émissions associées selon le facteur marocain officiel.',
    actBtnAdd: 'Nouvelle saisie d’activité',
    actBtnUnquantified: 'Déclarer un poste non quantifié',
    actColScope: 'Scope',
    actColCat: 'Catégorie',
    actColLabel: 'Activité déclarée',
    actColQty: 'Quantité & Unité',
    actColEmissions: 'Émissions (tCO₂e)',
    actColTrace: 'Traçabilité & Facteur',
    actColActions: 'Actions',
    actEmpty: 'Aucune donnée d’activité enregistrée pour cet exercice.',
    actModalAddTitle: 'Enregistrer une activité physique',
    actFieldLabel: 'Désignation de l’activité (ex: Facture électricité atelier)',
    actFieldCategory: 'Catégorie de flux',
    actFieldOption: 'Activité type / Facteur officiel',
    actFieldQuantity: 'Quantité physique consommée',
    actFieldUnit: 'Unité attendue',
    actFieldSite: 'Site de rattachement',
    actBtnCalculate: 'Calculer et enregistrer',

    // Postes non quantifiés (Règle de rigueur)
    unqSectionTitle: 'Postes identifiés, non quantifiés',
    unqSectionDesc: 'Conformément à la règle méthodologique de rigueur, une activité sans facteur adapté ou en attente de données ne vaut jamais zéro.',
    unqModalTitle: 'Déclarer un poste non quantifié',
    unqReasonMissingFactor: 'Facteur d’émission disponible insuffisant dans le classeur',
    unqReasonMissingData: 'Données primaires de consommation indisponibles ou en attente',
    unqReasonPendingSupplier: 'En attente de transmission par le fournisseur ou prestataire',
    unqFieldReason: 'Motif de non-quantification',
    unqFieldNotes: 'Explications et démarche de rattrapage prévue',

    // Rapport Officiel & PDF
    repTitle: 'Rapport d’Inventaire des Émissions de Gaz à Effet de Serre (BEGES)',
    repStandard: 'Conforme aux normes ISO 14064-1:2018 et GHG Protocol Corporate Standard',
    repBtnPrint: 'Imprimer / Sauvegarder',
    repBtnDownloadPdf: 'Télécharger le rapport PDF officiel',
    repBtnMethodAnnex: 'Consulter l’annexe méthodologique',
    repSummaryTotal: 'Total des Émissions Brutes',
    repSummaryScope1: 'Scope 1 (Direct)',
    repSummaryScope2: 'Scope 2 (Électricité)',
    repSummaryScope3: 'Scope 3 (Chaîne de valeur)',
    repSummaryBiogenic: 'CO₂ biogénique (hors scopes)',
    repUncertaintyNotice: 'Intervalle d’incertitude statistique combiné à 95% :',
    repLegalNotice: 'AVERTISSEMENT : Ce rapport est issu des contrôles logiciels et calculs déterministes d’Atlas Carbone. Il ne constitue pas un certificat de conformité délivré par un auditeur indépendant accrédité ISO 14065.',

    // Académie Bilan Carbone
    acadTitle: 'Académie Atlas Carbone : Formez-vous à la comptabilité GES',
    acadSubtitle: '10 modules courts et pratiques inspirés de la démarche pédagogique FM6E / ADEME / ABC pour maîtriser le bilan carbone de votre entreprise au Maroc.',
    acadTabModules: 'Modules de formation',
    acadTabGlossary: 'Glossaire bilingue des termes clés',
    acadBtnQuiz: 'Vérifier ma compréhension',
    acadBtnAction: 'Appliquer dans l’application',

    // Contact public
    contactTitle: 'Contactez notre référent technique au Maroc',
    contactName: 'Abdelaziz Motiaa',
    contactEmail: 'abdelaziz.motiaa@gmail.com',
    contactPhone: '+212 671 581 167',
    contactNotice: 'Pour toute demande d’accompagnement, de démonstration personnalisée ou d’intégration sur mesure.'
  },
  en: {
    // General Navigation
    brandName: 'Atlas Carbone',
    brandTagline: 'Moroccan Carbon Accounting & EU CBAM Compliance',
    navOverview: 'Dashboard',
    navActivities: 'Activities & Data',
    navSectors: 'Sectoral Pathways',
    navAcademy: 'Academy & Learning',
    navReport: 'Official GHG Report',
    navReduction: 'Decarbonization Plan',
    navCbam: 'EU CBAM Module',
    navQuotes: 'Quotes & Pricing',
    navCatalogAdmin: 'Catalog Governance',
    navLogout: 'Sign Out',
    navTryGuest: 'Try without account',
    navCreateAccount: 'Create company space',
    navLogin: 'Sign In',
    switchLang: 'Français',

    // Tenant Header
    orgSelector: 'Company:',
    periodSelector: 'Period:',
    statusDraft: 'Draft in progress',
    statusToComplete: 'To be completed',
    statusReadyForReview: 'Ready for review',
    statusReviewedInternal: 'Reviewed internally',
    statusLocked: 'Locked & Immutable',
    btnOnboarding: 'Guided wizard',
    btnClosePeriod: 'Close inventory',

    // Landing & Hero
    heroBadge: 'MOROCCAN 2026 STANDARD • ISO 14064-1 & GHG PROTOCOL COMPLIANT',
    heroTitle: 'Sovereign Carbon Accounting for Moroccan Enterprises',
    heroSubtitle: 'Measure Scope 1, 2, and 3 emissions from primary operational data (ONEE electricity, fuel cards, HVAC refrigerants). Generate verifiable reports and prepare EU CBAM export dossiers.',
    heroCtaTry: 'Try without an account (Instant access)',
    heroCtaAccount: 'Create company account',
    heroNotice: '100% deterministic calculations powered exclusively by official Moroccan emission factor datasets. Your data remains strictly private.',

    // Guest Trial Flow
    trialModalTitle: 'Try Atlas Carbone Without Creating an Account',
    trialModalDesc: 'Enter your company profile and record initial physical activities. You will receive an immediate calculation and a downloadable preliminary report, with seamless account transfer.',
    trialCompanyName: 'Company Name',
    trialSector: 'Industry Sector',
    trialBtnStart: 'Start Free Trial Session',
    trialStep1: '1. Company Details',
    trialStep2: '2. Activity Data Entry',
    trialStep3: '3. Results & Trial Report',
    trialClaimBanner: 'You are currently working in a temporary guest trial session (retained for 7 days).',
    trialBtnClaim: 'Save My Data to Permanent Account',
    trialClaimTitle: 'Save Your Trial Dossier to a Permanent Account',
    trialClaimDesc: 'Create your credentials to preserve all trial entries and calculations without re-entering any data.',
    trialFullName: 'Your Full Name',
    trialEmail: 'Work Email Address',
    trialPassword: 'Secure Password',
    trialCity: 'Headquarters City (e.g. Casablanca, Tangier)',
    trialBtnConfirmClaim: 'Confirm and Transfer Dossier',

    // Data Entry & Activities
    actTitle: 'GHG Activity Data Collection',
    actSubtitle: 'Input primary physical operational metrics. The engine instantly calculates verified emissions using certified Moroccan emission factors.',
    actBtnAdd: 'Add Physical Activity',
    actBtnUnquantified: 'Report Unquantified Item',
    actColScope: 'Scope',
    actColCat: 'Category',
    actColLabel: 'Reported Activity',
    actColQty: 'Quantity & Unit',
    actColEmissions: 'Emissions (tCO₂e)',
    actColTrace: 'Traceability & Factor',
    actColActions: 'Actions',
    actEmpty: 'No activity data recorded yet for this reporting period.',
    actModalAddTitle: 'Record Operational Activity',
    actFieldLabel: 'Activity Description (e.g. Factory monthly electricity bill)',
    actFieldCategory: 'Flow Category',
    actFieldOption: 'Standard Source / Official Factor',
    actFieldQuantity: 'Consumed Physical Quantity',
    actFieldUnit: 'Expected Unit',
    actFieldSite: 'Operating Site',
    actBtnCalculate: 'Compute & Save',

    // Unquantified Items (Rigor Rule)
    unqSectionTitle: 'Identified, Unquantified Activities',
    unqSectionDesc: 'In adherence to our strict methodological rigor, an activity lacking an appropriate factor or pending primary bills is never defaulted to zero.',
    unqModalTitle: 'Report Unquantified Activity',
    unqReasonMissingFactor: 'Insufficient emission factor available in reference dataset',
    unqReasonMissingData: 'Primary consumption meter data missing or pending receipt',
    unqReasonPendingSupplier: 'Awaiting transmission by supplier or service contractor',
    unqFieldReason: 'Reason for Non-Quantification',
    unqFieldNotes: 'Remediation explanation and recovery plan',

    // Official Report & PDF
    repTitle: 'Greenhouse Gas Inventory Report (BEGES)',
    repStandard: 'Compliant with ISO 14064-1:2018 and GHG Protocol Corporate Standard',
    repBtnPrint: 'Print / Save',
    repBtnDownloadPdf: 'Download Official Server PDF Report',
    repBtnMethodAnnex: 'View Methodological Annex',
    repSummaryTotal: 'Gross Total Emissions',
    repSummaryScope1: 'Scope 1 (Direct)',
    repSummaryScope2: 'Scope 2 (Electricity)',
    repSummaryScope3: 'Scope 3 (Value Chain)',
    repSummaryBiogenic: 'Biogenic CO₂ (Out-of-scope)',
    repUncertaintyNotice: 'Combined 95% statistical confidence interval:',
    repLegalNotice: 'DISCLAIMER: This report is compiled by Atlas Carbone deterministic calculation software. It does not constitute a compliance certificate issued by an ISO 14065 accredited independent third-party inspection body.',

    // Carbon Academy
    acadTitle: 'Atlas Carbone Academy: Practical GHG Accounting',
    acadSubtitle: '10 concise modules inspired by Moroccan and international best practices (FM6E / ADEME / ABC) to master carbon footprinting.',
    acadTabModules: 'Training Modules',
    acadTabGlossary: 'Bilingual Glossary of Key Terms',
    acadBtnQuiz: 'Test Your Understanding',
    acadBtnAction: 'Apply in Application',

    // Public Contact
    contactTitle: 'Contact Our Technical Representative in Morocco',
    contactName: 'Abdelaziz Motiaa',
    contactEmail: 'abdelaziz.motiaa@gmail.com',
    contactPhone: '+212 671 581 167',
    contactNotice: 'For any technical inquiries, custom demonstrations, or enterprise deployments.'
  }
};
