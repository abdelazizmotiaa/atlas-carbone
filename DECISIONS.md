# Registre des Décisions d'Architecture et Méthodologiques (DECISIONS.md)

Ce document consigne les décisions techniques, méthodologiques et réglementaires prises pour le développement d'**Atlas Carbone**.

---

## 1. Stack Technique et Runtime (AD-001)

- **Date :** 20 octobre 2026
- **Statut :** Validé
- **Contexte :**
  - Le prompt maître recommandait préférentiellement Laravel + React + TypeScript + Inertia.js + MySQL, avec possibilité documentée d'adopter une autre stack maintenue si l'environnement l'exige.
  - L'inspection du système Linux d'accueil révèle que `node` (v22.23.3), `npm` (10.9.9) et `python3` (3.14.4) sont installés et pleinement opérationnels sans privilèges super-utilisateur.
  - PHP, Composer et le démon Docker ne sont pas installés sur le système hôte, et l'utilisateur ne dispose pas de `sudo` sans mot de passe.
- **Décision :**
  - Architecture **Monolithe Modulaire Full-Stack TypeScript / Node.js + React + Vite + TailwindCSS** :
    - **Backend :** API REST modulaire en Node.js / Express / TypeScript avec architecture en couches (Core Engine, Modules : Identity, Tenancy, RBAC, Inventory, FactorCatalog, Calculations, DataQuality, Reporting, CBAM, Billing, Notifications, Audit).
    - **Base de données :** SQLite en mode WAL (Write-Ahead Logging) avec contraintes strictes de clés étrangères et transactions ACID pour l'exécution locale immédiate zéro-dépendance ; scripts de migration et compatibilité MySQL/PostgreSQL pour déploiement conteneurisé.
    - **Frontend :** SPA moderne React 18 + TypeScript + Vite + TailwindCSS + Lucide Icons + Recharts, respectant la charte esthétique sobre (vert profond `#064E3B`, slate, touches ocre, typographie Inter).
    - **Conteneurisation :** Fichiers `Dockerfile` et `docker-compose.yml` (Node.js + MySQL/MariaDB + Nginx) prêts pour la production.

---

## 2. Unités et Règle de Précision Déterministe (AD-002)

- **Date :** 20 octobre 2026
- **Statut :** Validé
- **Décision :**
  - Toutes les données d'activité et tous les facteurs sont stockés avec leurs unités physiques normalisées (ex: `kWh`, `MWh`, `litre`, `tonne`, `kg`, `passager-km`, `tonne-km`).
  - Les calculs d'émissions brutes s'effectuent strictement côté serveur avec décimales maîtrisées (précision flottante haute précision 8 décimales) en `kgCO2e`, puis converties en `tCO2e` par division exacte par 1 000.
  - Aucun arrondi n'est appliqué aux résultats intermédiaires ; les arrondis sont réservés à la couche de restitution (affichage UI, PDF, exports).
  - Tout calcul enregistre son empreinte d'audit complète : donnée d'activité, unité originale, facteur appliqué, version du facteur, formule, PRG éventuel, incertitude associée, et horodatage UTC.

---

## 3. Gouvernance et Traitement des Facteurs du Classeur Excel (AD-003)

- **Date :** 20 octobre 2026
- **Statut :** Validé
- **Décision :**
  - Le classeur source `Bilan Carbone Maroc-compatible postes iso14064 et GHG Protocol-draft-15 octobre 2024 (3) (1).xlsx` (SHA-256 : `477f3cf008303144606baf80dba9b125d791a20eccdbc009cf9853e5007ded6c`) est conservé intact.
  - Pipeline en 4 étapes :
    1. *Extraction brute* : extraction des 23 postes avec traçabilité ligne/colonne.
    2. *Normalisation* : détection des unités et scopes.
    3. *Revue* : les facteurs mixtes « amont + combustion » (Poste 1) sont étiquetés `to_verify` pour le Scope 1 afin d'éviter le double comptage ou l'affectation erronée d'émissions Scope 3 dans le Scope 1.
    4. *Publication* : seuls les facteurs au statut `validated` autorisent la clôture définitive d'un inventaire GES.
  - Pour l'électricité (Poste 6) : le facteur historique du classeur (0,6426 kgCO2e/kWh net, 0,721 kgCO2e/kWh avec 12,2 % de pertes, mix moyen 2020) est consigné avec son année 2020 et sa source. Deux options sont implémentées : *Location-based* et *Market-based* (si contrats d'achat d'énergies renouvelables ou certificats d'origine traçables).

---

## 4. Multi-Tenancy et Rôles RBAC Stricts (AD-004)

- **Date :** 20 octobre 2026
- **Statut :** Validé
- **Décision :**
  - Isolation stricte par `organization_id` vérifiée par middleware côté serveur pour chaque route et requête API.
  - Les rôles suivants sont gérés :
    - `super_admin` : administration globale, gestion du catalogue de facteurs communs (accès aux bilans clients conditionné à un jeton de support temporaire et tracé).
    - `commercial` : prospection, devis, abonnements (aucun accès aux données d'émissions ni aux justificatifs).
    - `admin` (Entreprise) : gestion des membres, sites, exercices, abonnements et clôtures.
    - `carbon_manager` : configuration des bilans, gestion des facteurs privés, validation des données d'activité, génération des rapports.
    - `site_manager` : saisie et gestion restreinte aux seuls sites attribués.
    - `contributor` : saisie des tâches et postes délégués, sans pouvoir de validation ni de clôture.
    - `auditor` : consultation en lecture seule des bilans et des pistes d'audit pour les dossiers autorisés.

---

## 5. Module Export Europe — MACF / CBAM (AD-005)

- **Date :** 20 octobre 2026
- **Statut :** Validé
- **Décision :**
  - Le module MACF est strictement distinct de l'inventaire organisationnel (ISO 14064 / GHG Protocol).
  - Régime définitif (depuis le 1er janvier 2026) :
    - Qualification par code Nomenclature Combinée (NC/CN à 8 chiffres) dans les 6 secteurs initiaux : ciment, fer & acier, aluminium, engrais, électricité, hydrogène.
    - Suivi des installations physiques au Maroc, des procédés de production et des flux de précurseurs (amont direct/indirect).
    - Calcul des émissions intrinsèques directes ($SEE_{dir}$) et indirectes ($SEE_{indir}$) en $tCO_2e$ par tonne de produit fini.
    - Le seuil massique de minimis de 50 tonnes par an s'applique à l'importateur européen sur une année civile (non applicable à l'électricité et l'hydrogène). L'application n'applique pas faussement un seuil au niveau de l'exportateur marocain, mais affiche l'état d'éligibilité pour l'importateur.
    - Génération du dossier technique normalisé de communication à destination de l'importateur UE (recommandation modèle officiel CE).

---

## 6. Monnaies, Facturation et Devis (AD-006)

- **Date :** 20 octobre 2026
- **Statut :** Validé
- **Décision :**
  - Monnaie par défaut : Dirham marocain (MAD) avec séparateur conforme et formats français. Affichage optionnel en EUR pour les modules Export.
  - Trois offres configurables : *Essentiel*, *Entreprise*, *Export Europe*.
  - En l'absence de contrat marchand CMI ou passerelle agréée au Maroc, le système implémente un environnement sandbox clair et un flux commercial complet par génération de devis PDF/HTML et validation manuelle tracée des règlements par virement bancaire.

---

## 7. Protection et Confidentialité du Catalogue de Facteurs (AD-007)

- **Date :** 20 octobre 2026
- **Statut :** Validé
- **Décision :**
  - L'accès complet au catalogue brut (`GET /api/factors`) est strictement restreint aux utilisateurs disposant du privilège `super_admin`.
  - Pour les entreprises locataires et les visiteurs en essai, un endpoint filtré (`GET /api/activities/catalog-options`) ne renvoie que l'identifiant d'activité, les libellés FR/EN, l'unité attendue, la catégorie et des conseils de saisie, sans jamais divulguer les facteurs numériques ni les formules de pondération.
  - Les calculs d'émissions sont exclusivement réalisés côté serveur.
  - Une annexe méthodologique restreinte (`GET /api/organizations/:orgId/periods/:periodId/methodological-annex`) ne révèle que les métadonnées et sources des facteurs réellement mobilisés lors d'un exercice pour permettre la revue d'audit.
  - Reconnaissance explicite des droits d'auteur tiers (ADEME, ABC, Fondation Mohammed VI pour l'Environnement, AMEE, IMANOR) sans revendication indue de propriété exclusive.

---

## 8. Parcours d'Essai sans Compte & Transfert Sécurisé (AD-008)

- **Date :** 20 octobre 2026
- **Statut :** Validé
- **Décision :**
  - Mise à disposition immédiate d'un essai sans inscription préalable (« Essayer sans compte »).
  - Génération d'une session invitée isolée avec jeton cryptographique aléatoire de 32 octets et durée de validité (TTL) de 7 jours.
  - Exécution des calculs sur le moteur déterministe réel et génération d'un rapport préliminaire téléchargeable précisant la couverture partielle des données.
  - Fonctionnalité « Créer mon compte et conserver mon bilan » assurant le transfert atomique du dossier invité vers l'organisation permanente créée ou existante, sous vérification cryptographique de la possession du jeton d'invité.

---

## 9. Questionnaire Progressif & Profils Sectoriels Marocains (AD-009)

- **Date :** 20 octobre 2026
- **Statut :** Validé
- **Décision :**
  - Formulation des questions en langage naturel (« Électricité de vos locaux », « Carburant de votre flotte », « Fluides frigorigènes », etc.) sans présupposer la connaissance des scopes.
  - 8 profils sectoriels ciblés : Industrie exportatrice/métallurgie/ciment, Textile, Agroalimentaire, Transport, Construction/BTP, Hôtellerie, Services, Agriculture.
  - 4 options de réponse explicites : `Oui`, `Non concerné`, `Je ne sais pas encore`, `À compléter`.
  - Tout poste identifié mais dépourvu de facteur d'émission validé dans le classeur Excel est consigné comme « Poste identifié, non quantifié : facteur disponible insuffisant » et documenté dans le rapport (interdiction absolue d'affecter la valeur zéro par défaut).

---

## 10. Pédagogie Intégrée & Académie Bilan Carbone (AD-010)

- **Date :** 20 octobre 2026
- **Statut :** Validé
- **Décision :**
  - Intégration de 10 micro-modules d'apprentissage originaux inspirés de la démarche pédagogique du support de formation FM6E/ADEME/ABC (juin 2026).
  - Chaque module comprend une explication concise, un cas d'application concret, une question d'auto-évaluation et un raccourci d'action dans l'outil.
  - Glossaire bilingue FR/EN accessible en permanence.
  - Mention explicite distinguant les contrôles de cohérence internes du logiciel d'un audit de tierce partie indépendante accrédité selon la norme ISO 14065.

---

## 11. Moteur de Génération PDF Serveur Bilingue (AD-011)

- **Date :** 20 octobre 2026
- **Statut :** Validé
- **Décision :**
  - Utilisation d'un moteur de génération de documents PDF natif côté serveur en Node.js (`pdfkit`), sans dépendances système externes ni lancement de navigateur lourd en production.
  - Génération de rapports bilingues français / anglais présentant strictement les mêmes valeurs chiffrées, la ventilation par scope et par poste, l'intervalle d'incertitude 95%, le relevé des postes non quantifiés, le plan de transition et le bloc de signature.

---

## 12. Bilinguisme Intégral FR/EN & SEO Prerendering (AD-012)

- **Date :** 20 octobre 2026
- **Statut :** Validé
- **Décision :**
  - Prise en charge intégrale de la langue française (primaire) et de la langue anglaise (secondaire complète).
  - Routage public explicite avec préfixes `/fr/` et `/en/`, balises `hreflang` réciproques, balises `canonical` et `sitemap.xml`.
  - Prerendering HTML des pages publiques pour un indexage robot optimal et affichage immédiat sans latence de script.
  - Coordonnées publiques d'Abdelaziz Motiaa (`abdelaziz.motiaa@gmail.com`, `+212671581167`) insérées avec des liens fonctionnels `mailto:` et `tel:`.

---

## 13. Assistant Gemini Optionnel & Sandboxé (AD-013)

- **Date :** 20 octobre 2026
- **Statut :** Validé
- **Décision :**
  - Intégration d'un module d'assistance pédagogique Gemini facultatif.
  - Rôle strictement consultatif : explication des questions, suggestion de catégories, aide à la recherche de justificatifs et synthèse qualitative.
  - Aucune interaction avec le moteur de calcul mathématique, aucune écriture en base de données, aucun accès aux données d'autres organisations.
  - Fonctionnement autonome à 100% garanti en cas d'absence ou d'invalidité de la clé `GEMINI_API_KEY`.

