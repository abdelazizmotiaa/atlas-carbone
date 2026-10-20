# Atlas Carbone — Plateforme SaaS de Comptabilité GES & Conformité MACF Maroc

**Atlas Carbone** est une plateforme SaaS B2B souveraine conçue pour les entreprises marocaines (PME, grands groupes industriels, multisites et exportateurs vers l'Union Européenne). Elle permet de mesurer les émissions de gaz à effet de serre (Scopes 1, 2, 3), de piloter des plans de réduction, de générer des rapports certifiables selon **ISO 14064-1:2018** et le **GHG Protocol**, et de préparer les dossiers réglementaires d'émissions intrinsèques pour le **Mécanisme d'Ajustement Carbone aux Frontières (MACF / CBAM)** européen.

---

## 1. Caractéristiques Clés

- **Moteur de calcul déterministe pur :** Aucune boîte noire d'IA dans les opérations arithmétiques. Calculs stricts côté serveur avec conversions physiques SI automatisées (kWh, MWh, litres, tonnes, tonne-km, passager-km).
- **Catalogue de 670 facteurs nationaux audités :** Extraction et normalisation intégrale des facteurs du classeur de référence partenarial (Fondation Mohammed VI pour l'Environnement, AMEE, IMANOR, ADEME, IPCC AR6).
- **Gouvernance et revue des facteurs :** Détection des facteurs ambigus « amont + combustion » bloqués en Scope 1 pur sans décomposition préalable ; gestion rigoureuse du mix électrique ONEE (0,6426 kgCO2e/kWh net hors pertes) avec distinction stricte *Location-based* vs *Market-based*.
- **Module Export Europe MACF / CBAM (Régime définitif 2026) :** Couverture des 6 secteurs initiaux (Ciment, Fer & Acier, Aluminium, Engrais, Électricité, Hydrogène), codes NC 8 chiffres, affectation des procédés, intégration des précurseurs et génération du dossier de transmission importateur UE.
- **Multi-Tenant strict & RBAC fin :** Étanchéité totale des données entre entreprises clientes et 7 rôles prédéfinis (`super_admin`, `commercial`, `admin`, `carbon_manager`, `site_manager`, `contributor`, `auditor`).
- **Composant « Voir le calcul » :** Traçabilité exhaustive affichant la donnée d'activité brute, la conversion d'unité, la référence du facteur d'émission, la formule mathématique, le PRG GIEC AR6 appliqué, l'incertitude propagée et l'horodatage UTC.
- **Rapports officiels & Devis en MAD :** Génération de rapports imprimables paginés conformes et devis paramétrables avec décomposition HT, TVA 20% et TTC en Dirhams marocains.

---

## 2. Architecture Technique

- **Backend :** Node.js 22, Express, TypeScript, module natif `node:sqlite` (SQLite 3 haute performance en mode WAL avec clés étrangères strictes).
- **Frontend :** React 18, TypeScript, Vite, TailwindCSS, Lucide Icons, design system sobre (vert profond `#064E3B`, touches ocre et slate).
- **Sécurité :** Authentification JWT, hachage bcrypt (cost 10), protection contre l'injection de formules CSV, permissions vérifiées côté serveur sur chaque route.
- **Conteneurisation :** `Dockerfile` multi-stage et `docker-compose.yml` prêts pour la production.

```text
atlas-carbone/
├── client/                     # Frontend SPA React 18 + Vite + TailwindCSS
│   ├── src/
│   │   ├── views/             # LandingView, Dashboard, Activities, Factors, CBAM, Reduction, Quotes, Report
│   │   ├── api.ts             # Client API typé avec gestion des tokens
│   │   └── types.ts           # Modèles de données TypeScript
│   └── dist/                  # Bundle de production compilé
├── server/                     # Backend modulaire Node.js / Express / TypeScript
│   ├── src/
│   │   ├── core/              # Moteur de calcul pur (units.ts, calculations.ts)
│   │   ├── db/                # Base de données (database.ts, seed.ts)
│   │   └── server.ts          # API REST & Contrôleurs
│   └── data/                  # Base de données SQLite persistante (atlas_carbone.db)
├── data/
│   └── catalog_seed.json      # 670 facteurs d'émissions normalisés
├── docs/
│   ├── audit-classeur.md      # Audit exhaustif du classeur Excel marocain
│   └── marketing-templates.md # Modèles de posts LinkedIn et emails commerciaux
├── scripts/
│   ├── audit_excel.py         # Script d'audit du classeur source
│   └── extract_factors.py     # Pipeline d'extraction et normalisation des facteurs
├── tests/
│   ├── mandatory_numerical_tests.ts   # Suite des 13 tests numériques obligatoires
│   └── security_isolation_tests.ts    # Tests d'étanchéité multi-tenant et RBAC
├── Dockerfile                 # Conteneur multi-stage
├── docker-compose.yml         # Déploiement conteneurisé
├── DECISIONS.md               # Registre des décisions d'architecture
├── PROJECT_STATUS.md          # Suivi d'avancement des livrables
└── README.md
```

---

## 3. Démarrage Rapide

### Prérequis
- Node.js >= 20 (testé et validé sous Node.js v22.23.3)
- npm >= 10 (testé sous npm 10.9.9)

### Lancement Local Immédiat
```bash
# 1. Cloner ou se positionner dans le dossier
cd atlas-carbone

# 2. Installer les dépendances du serveur
cd server
npm install

# 3. Lancer le serveur (initialise et charge automatiquement la base et les 670 facteurs)
npx tsx src/server.ts
```
L'application complète (Backend API + Frontend SPA compilé) est accessible sur :  
👉 **http://localhost:5000**

### Mode Développement Frontend (Hot-Reload)
Si vous souhaitez modifier le frontend avec rechargement à chaud :
```bash
cd atlas-carbone/client
npm install
npm run dev
```
Accessible sur **http://localhost:5173** (avec proxy automatique vers l'API sur le port 5000).

### Lancement via Docker Compose
```bash
cd atlas-carbone
docker-compose up --build -d
```

---

## 4. Comptes de Démonstration Préconfigurés

Chaque profil illustre un cas d'usage réel et isolé :

| Email | Mot de passe | Rôle | Entreprise associée | Description du profil |
|---|---|---|---|---|
| `admin@agro-atlas.ma` | `AgroAtlas2026!` | Admin Entreprise | Atlas Agro-Alimentaire SARL | DG / Administrateur (2 sites, Bilan 2025 clôturé de 766 tCO2e) |
| `carbone@agro-atlas.ma` | `CarboneAtlas2026!` | Responsable Carbone | Atlas Agro-Alimentaire SARL | Pilote RSE / Collecte, accès à « Voir le calcul » |
| `site.agadir@agro-atlas.ma` | `SiteAgadir2026!` | Responsable Site | Atlas Agro-Alimentaire SARL | Confiné au site d'Agadir (entrepôt frigorifique) |
| `export@metal-oriental.ma` | `MetalExport2026!` | Exportateur MACF | Métallurgie de l'Oriental SA | Industrie de l'acier (Nador), fers à béton (CN 7214 20 00) |
| `auditeur@verifcarbone.ma` | `Auditeur2026!` | Auditeur Externe | Atlas Agro-Alimentaire SARL | Consultation en lecture seule certifiable ISO 14064 |
| `commercial@atlascarbone.ma`| `AtlasCommercial2026!`| Commercial Plateforme | Global | Gestion des devis (aucun accès aux bilans clients) |
| `superadmin@atlascarbone.ma`| `AtlasSuperAdmin2026!`| Super-Administrateur | Global | Administration technique et gouvernance du catalogue |

> **Astuce :** Sur la page d'accueil (http://localhost:5000), des boutons **« Comptes Démo 1-Clic »** permettent de vous connecter instantanément sans saisir de mot de passe.

---

## 5. Exécution des Tests Automatisés

### Suite des 13 Tests Numériques Obligatoires
Vérifie les règles d'arithmétique exacte, de conversion physique, de PRG GIEC AR6, d'anti-double comptage et d'intensité MACF :
```bash
cd atlas-carbone/server
./node_modules/.bin/tsx ../tests/mandatory_numerical_tests.ts
```
*Résultat attendu : 13 / 13 tests réussis (0 échec).*

### Suite des Tests de Sécurité et d'Isolation Multi-Tenant
Vérifie le cloisonnement strict des entreprises, les restrictions des responsables de site et l'échappement anti-injection CSV :
```bash
cd atlas-carbone/server
./node_modules/.bin/tsx ../tests/security_isolation_tests.ts
```
*Résultat attendu : 5 / 5 tests réussis (0 échec).*

---

## 6. Procédure de Sauvegarde et Restauration

### Sauvegarde
La base de données SQLite en mode WAL garantit l'intégrité transactionnelle. Pour effectuer une sauvegarde cohérente à chaud :
```bash
# Sauvegarde instantanée du fichier SQLite
cp atlas-carbone/server/data/atlas_carbone.db atlas-carbone/server/data/backup_$(date +%Y%m%d_%H%M%S).db
```

### Restauration
```bash
# Arrêter le serveur ou le conteneur
# Remplacer le fichier actif par la sauvegarde choisie
cp atlas-carbone/server/data/backup_XXXXXXXX_XXXXXX.db atlas-carbone/server/data/atlas_carbone.db
# Redémarrer le serveur
```

---

## 7. Paramètres Requis pour l'Ouverture Commerciale

Pour passer d'un pilote technique opérationnel à une exploitation commerciale en ligne avec encaissement direct :
1. **Nom de domaine & Certificat TLS :** Acquisition du domaine définitif (ex: `atlascarbone.ma`) et configuration d'un reverse-proxy Nginx avec Let's Encrypt.
2. **Contrat Marchand de Paiement :** Agrément avec un prestataire de paiement marocain (ex: CMI / PayZone / CinetPay Maroc) pour l'encaissement CB marocaine/internationale en MAD. En attendant, le flux devis + virement bancaire opérationnel est actif.
3. **Immatriculation Commerciale :** Renseignement des mentions légales définitives (RC, IF, Patente, ICE du vendeur) dans le paramétrage administrateur.
4. **Déclaration CNDP :** Finalisation de la déclaration de conformité Loi 09-08 auprès de la Commission Nationale de Contrôle de la Protection des Données à Caractère Personnel pour l'hébergement des données d'utilisateurs au Maroc.
