# Atlas Carbone — Plateforme SaaS Souveraine de Comptabilité Carbone & Conformité MACF Maroc

**Atlas Carbone** est une plateforme SaaS B2B souveraine conçue spécifiquement pour les entreprises marocaines (PME, ETI, grands groupes industriels, multisites et exportateurs vers l'Union Européenne). Elle permet de mesurer rigoureusement les émissions de gaz à effet de serre (Scopes 1, 2, 3), de piloter des plans de réduction concrets, d'éditer des rapports conformes aux standards **ISO 14064-1:2018** et **GHG Protocol**, et de préparer les déclarations d'émissions intrinsèques pour le **Mécanisme d'Ajustement Carbone aux Frontières (MACF / CBAM)** européen.

---

## 1. Caractéristiques Clés & Innovations

- **Essai sans compte instantané & souverain :** Tout visiteur peut renseigner son entreprise, sélectionner son secteur, enregistrer des activités réelles et télécharger un rapport préliminaire déterministe. Session isolée (TTL 7 jours) transférable en 1 clic vers un compte permanent sans aucune ressaisie.
- **Moteur de calcul déterministe 100% serveur :** Aucune boîte noire d'IA dans les opérations arithmétiques. Conversions physiques rigoureuses (kWh, MWh, litres, tonnes, tonne-km, passager-km), gestion des incertitudes Gaussiennes, séparation stricte *Location-based* et *Market-based* pour le réseau électrique national ONEE.
- **Catalogue de facteurs de référence marocain audité :** Source unique autorisée : classeur partenarial officiel (Fondation Mohammed VI pour l'Environnement, AMEE, ADEME, IPCC AR6). Empreinte SHA-256 vérifiée : `477f3cf008303144606baf80dba9b125d791a20eccdbc009cf9853e5007ded6c`.
- **Sanctuarisation & Confidentialité du Catalogue :** La table brute des facteurs est strictement réservée au `super_admin` (`GET /api/factors` renvoie 403 aux entreprises). Les entreprises accèdent uniquement à un catalogue d'options aseptisé (`GET /api/activities/catalog-options`) ne contenant ni coefficients ni formules.
- **Règle de rigueur méthodologique :** Une activité sans facteur compatible reste explicitement tracée comme *« Poste identifié, non quantifié : facteur disponible insuffisant »*. Aucun zéro factice n'est jamais injecté.
- **8 Parcours sectoriels adaptés au Maroc :** Questions formulées en langage courant guidant l'utilisateur vers ses pièces justificatives réelles (factures ONEE, cartes carburant Afriquia/Total/Shell, citernes vrac de propane, registres de maintenance de climatiseurs, fiches de paie).
- **Pédagogie intégrée & Académie Bilan Carbone :** 10 micro-modules d'auto-formation courts avec cas pratiques et glossaire bilingue. Distinction légale formelle : contrôle logiciel vs audit tierce-partie accrédité ISO 14065.
- **Génération de rapport PDF officiel côté serveur :** Rapports complets générés par PDFKit avec scopes, graphiques vectoriels, tableau de bord, annexe méthodologique contrôlée et zones de signature pour revue interne.
- **Bilinguisme intégral Français / Anglais :** Interface, formulaires, aides contextuelles, actualités et rapports PDF bilingues avec préservation arithmétique stricte des totaux d'émissions.
- **Newsletter Double Opt-In :** Inscription bilingue avec confirmation par jeton unique, table de suppression anti-réabonnement involontaire et journalisation du consentement.
- **Assistant IA facultatif avec repli autonome :** Intégration Gemini sandboxée pour l'assistance contextuelle, avec repli déterministe automatique si aucune clé API n'est fournie. Zéro appel d'IA dans les calculs mathématiques.
- **Sauvegarde & Restauration physique SQLite WAL :** Checkpoints WAL forcés, vérification SHA-256, copies de sécurité pré-restauration et contrôle d'intégrité `PRAGMA integrity_check`.

---

## 2. Architecture Technique

- **Backend :** Node.js 22, Express 5, TypeScript, module natif `node:sqlite` (SQLite 3 en mode WAL avec contraintes de clés étrangères et indexation optimisée).
- **Frontend :** React 18, TypeScript, Vite, TailwindCSS, Lucide Icons, dictionnaire de traduction unifié (`client/src/i18n.ts`).
- **Génération Documentaire :** PDFKit côté serveur avec vectorisation directe des métriques et tableaux de synthèse.
- **Sécurité :** Authentification JWT, hachage bcrypt (cost 10), isolation multi-tenant vérifiée côté serveur sur chaque route, protection contre l'injection de formules CSV (`=`, `+`, `-`, `@`).

```text
atlas-carbone/
├── client/                     # Frontend SPA React 18 + Vite + TailwindCSS
│   ├── src/
│   │   ├── views/             # LandingView, TrialFlowView, AcademyView, PublicContentView, etc.
│   │   ├── i18n.ts            # Dictionnaire bilingue unifié (FR / EN)
│   │   ├── api.ts             # Client API typé
│   │   └── types.ts           # Types TypeScript du domaine
│   └── dist/                  # Bundle de production compilé servi par Express
├── server/                     # Backend modulaire Express 5 / Node.js 22 / TypeScript
│   ├── src/
│   │   ├── core/              # Moteur de calcul (units.ts, calculations.ts, pdfReport.ts)
│   │   ├── db/                # Base SQLite WAL (database.ts, seed.ts, seedContent.ts)
│   │   ├── modules/           # Modules métier (trial.ts, sectors.ts, content.ts, assistant.ts)
│   │   └── server.ts          # API REST & Contrôleurs sécurisés
│   ├── tests/
│   │   └── acceptance_e2e_tests.ts # Suite complète d'acceptation (16 scénarios E2E)
│   └── data/                  # Base persistante (atlas_carbone.db) et sauvegardes
├── scripts/
│   ├── backup_db.ts           # Script de sauvegarde physique WAL avec empreinte SHA-256
│   └── restore_db.ts          # Script de restauration sécurisée avec contrôle d'intégrité
├── tests/
│   ├── mandatory_numerical_tests.ts   # 13 tests numériques obligatoires
│   └── security_isolation_tests.ts    # 5 tests d'étanchéité multi-tenant et RBAC
├── Dockerfile                 # Conteneur multi-stage
├── docker-compose.yml         # Déploiement conteneurisé
├── DECISIONS.md               # Registre d'architecture (AD-001 à AD-013)
├── PROJECT_STATUS.md          # Suivi d'avancement exhaustif et preuves de validation
└── README.md
```

---

## 3. Démarrage Rapide

### Prérequis
- Node.js >= 20 (développé et validé sous Node.js v22.23.3)
- npm >= 10

### Lancement Local Immédiat
```bash
# 1. Se positionner dans le dossier server
cd atlas-carbone/server

# 2. Lancer le serveur (initialise automatiquement la base WAL et sert le frontend compilé)
./node_modules/.bin/tsx src/server.ts
```
L'application complète (Backend API + Frontend SPA) est immédiatement accessible sur :  
👉 **http://localhost:5000**

---

## 4. Suites de Tests Automatisés (34 / 34 RÉUSSIS)

### A. Suite d'Acceptation E2E (16 Scénarios d'Acceptation)
Vérifie l'intégralité des parcours fonctionnels, de l'essai invité au rapport PDF et à la restauration de base :
```bash
cd atlas-carbone/server
npm test
# ou : ./node_modules/.bin/tsx tests/acceptance_e2e_tests.ts
```
*Résultat : 16 / 16 tests validés avec succès (0 échec).*

### B. Tests Numériques Obligatoires (13 Tests Arithmétiques)
```bash
cd atlas-carbone/server
./node_modules/.bin/tsx ../tests/mandatory_numerical_tests.ts
```
*Résultat : 13 / 13 tests validés avec succès.*

### C. Tests de Sécurité et d'Isolation Multi-Tenant (5 Tests)
```bash
cd atlas-carbone/server
./node_modules/.bin/tsx ../tests/security_isolation_tests.ts
```
*Résultat : 5 / 5 tests validés avec succès.*

---

## 5. Procédures de Sauvegarde & Restauration

### Sauvegarde à chaud (WAL Checkpoint + SHA-256)
```bash
cd atlas-carbone/server
npm run backup
```
*Génère une archive horodatée dans `data/backups/` avec métadonnées JSON et empreinte SHA-256.*

### Restauration avec contrôle d'intégrité
```bash
cd atlas-carbone/server
npm run restore data/backups/atlas_carbone_backup_FICHIER.db
```
*Vérifie l'empreinte SHA-256, crée un instantané de sécurité `.bak` de la base actuelle, restaure le fichier et exécute `PRAGMA integrity_check`.*

---

## 6. Coordonnées de Contact & Mention Légale

- **Responsable Produit & Technique :** Abdelaziz Motiaa  
- **Email direct :** [abdelaziz.motiaa@gmail.com](mailto:abdelaziz.motiaa@gmail.com)  
- **Téléphone direct :** [+212671581167](tel:+212671581167)  
- **Localisation :** Maroc  

*Note sur la propriété intellectuelle et les données sources :* Les facteurs d'émission marocains intégrés proviennent du classeur partenarial de référence élaboré avec les contributions de la Fondation Mohammed VI pour la Protection de l'Environnement, de l'AMEE, de l'ADEME et de l'ABC. Atlas Carbone ne revendique aucune propriété exclusive sur ces données publiques de référence et assure la citation transparente des sources officielles dans chaque rapport émis.
