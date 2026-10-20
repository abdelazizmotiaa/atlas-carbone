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
