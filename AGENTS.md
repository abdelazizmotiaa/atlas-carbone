# Atlas Carbone — Directives et Règles Projet Antigravity (AGENTS.md)

Ce document consigne les directives durables, contraintes réglementaires et choix d'architecture pour le développement et la maintenance de la plateforme **Atlas Carbone**.

---

## 1. Identité et Souveraineté du Projet

1. **Vocation :** Application professionnelle de comptabilité carbone (Bilan Carbone® / ISO 14064-1:2018 / GHG Protocol) et de préparation de conformité MACF/CBAM, principalement destinée aux entreprises marocaines (PME, grands comptes, industriels et exportateurs).
2. **Accessibilité pédagogique :** L'outil doit être utilisable et compréhensible par des personnes non spécialistes du climat. Aucune connaissance préalable des scopes n'est requise. Les questions sont formulées en langage courant et contextualisées avec des données de terrain (factures ONEE, carburant, fluides).
3. **Contact public officiel :**
   - **Responsable :** Abdelaziz Motiaa
   - **Email :** `abdelaziz.motiaa@gmail.com`
   - **Téléphone :** `+212671581167`
   - **Règle absolue :** Ne jamais inventer d'équipe fictive, de clients fictifs, de partenariats officiels non confirmés (ne pas présenter Atlas Carbone comme produit officiel de l'AMEE, FM6E, ABC ou ADEME sans mandat), ni réutiliser l'identité de tiers (ex: Zineb Elqodsi).

---

## 2. Règle d'Or du Classeur Excel et des Facteurs d'Émission

1. **Source unique autorisée :**
   - Classeur de référence : `Bilan Carbone Maroc-compatible postes iso14064 et GHG Protocol-draft-15 octobre 2024 (3) (1).xlsx`
   - Empreinte cryptographique SHA-256 : `477f3cf008303144606baf80dba9b125d791a20eccdbc009cf9853e5007ded6c`
   - Aucune valeur trouvée sur Internet ou générée par une IA ne peut être injectée silencieusement.
2. **Confidentialité et protection du catalogue :**
   - Le catalogue complet des facteurs (valeurs numériques, feuilles d'origine, pondérations internes) est strictement protégé côté serveur.
   - Seuls les administrateurs plateforme (`super_admin`) peuvent consulter le catalogue brut complet.
   - Les locataires (entreprises clientes et visiteurs d'essai) ne reçoivent que les options d'activités nécessaires : identifiant/code, libellé, unité attendue, conseils de saisie et statut de disponibilité.
   - Tous les calculs d'émissions sont effectués côté serveur de manière déterministe.
3. **Gestion des postes non quantifiés :**
   - Si une activité est identifiée mais ne dispose pas d'un facteur compatible et validé dans le classeur, elle est enregistrée sous le statut explicite : **« Poste identifié, non quantifié : facteur disponible insuffisant »**.
   - **Interdiction absolue d'affecter 0 par défaut** à une activité manquante ou sans facteur.
4. **Attribution des sources :**
   - Conserver les mentions et contributions d'origine (ADEME, ABC, Fondation Mohammed VI pour l'Environnement, AMEE, IMANOR). Ne pas revendiquer ces facteurs tiers comme propriété exclusive d'Atlas Carbone.

---

## 3. Moteur de Calcul Déterministe et Méthodologie

1. **Calcul :** $\text{Émissions } (kgCO_2e) = \text{Donnée d'activité} \times \text{Facteur d'émission} \times \text{Facteur de conversion d'unité}$.
2. **Unités et précision :**
   - Vérification systématique des compatibilités dimensionnelles avant multiplication.
   - Calcul haute précision flottante sans arrondi intermédiaire ; arrondi maîtrisé uniquement à l'affichage.
   - Distinction claire entre $kgCO_2e$ et $tCO_2e$ ($1\ tCO_2e = 1\ 000\ kgCO_2e$).
3. **Pas de double comptage :**
   - Les facteurs mixtes « amont et combustion » ne doivent pas être affectés 100% au Scope 1 sans décomposition.
   - Électricité réseau (Poste 6) : séparation stricte entre approche *Location-based* (mix moyen réseau national avec et sans pertes) et *Market-based* (uniquement sur justificatifs contractuels vérifiés). Ne jamais additionner les deux méthodes.
   - Séparation stricte du $CO_2$ biogénique, des émissions évitées et des compensations (crédits carbone) : ils ne sont **jamais soustraits de l'inventaire brut**.
4. **Scope 3 :** Correspondance documentée avec les 15 catégories du GHG Protocol sans forcer d'équivalence artificielle.

---

## 4. Parcours Utilisateur & Expérience Produit

1. **Double porte d'entrée sur l'accueil :**
   - « Essayer sans compte » : session invitée temporaire et isolée utilisant le vrai moteur de calcul, produisant un rapport d'essai avec réserves méthodologiques, avec option « Créer mon compte et conserver mon bilan » (transfert sécurisé sans ressaisie).
   - « Créer mon espace entreprise » : création de compte et d'espace multi-tenant permanent.
2. **8 Profils sectoriels marocains :**
   - Industrie exportatrice / Métallurgie / Ciment / Engrais
   - Textile et habillement
   - Agroalimentaire et chaîne du froid
   - Transport et logistique
   - Construction / BTP
   - Hôtellerie et restauration
   - Services, bureaux et laboratoires
   - Agriculture
3. **Saisie accessible aux débutants :**
   - Vocabulaire courant, explications du « pourquoi », indication des justificatifs (factures ONEE, etc.), exemples fictifs, options : `Oui`, `Non concerné`, `Je ne sais pas encore`, `À compléter`.
   - Champ vide $\neq 0$.
   - Saisie annuelle ou mensuelle sans doublon.
4. **Rapports PDF professionnels :**
   - Générés côté serveur, bilingues FR/EN, immuables après clôture.
   - Ne jamais afficher « 100% complet » si des postes restent non quantifiés.

---

## 5. Bilinguisme Intégral (FR / EN)

1. **Couverture :** Interface utilisateur, messages API, formulaires, aides, graphiques, rapports PDF, emails et pages publiques.
2. **Routage public :** Préfixes `/fr/` et `/en/`, balises `hreflang` réciproques et balises `canonical`.
3. **Persistance :** Le basculement linguistique conserve la session, la page courante et les données d'activité sans altérer les valeurs ni les identifiants techniques.
4. **Formatage numérique :** Espaces et virgules en français (`1 250,50 tCO₂e`), virgules et points en anglais (`1,250.50 tCO₂e`).

---

## 6. Sécurité Multi-Tenant & RBAC

1. **Contrôle d'accès strict :** Chaque requête API vérifie côté serveur l'identité, l'appartenance active à l'organisation (`organization_id`) et les permissions du rôle.
2. **Matrice des rôles :**
   - `super_admin` : administration globale et gouvernance du catalogue.
   - `admin` (Entreprise) : gestion globale de l'entreprise, des sites et des membres.
   - `carbon_manager` : configuration et validation des bilans, génération des rapports.
   - `site_manager` : confiné à son périmètre géographique.
   - `contributor` : saisie simple.
   - `auditor` : lecture seule sur les dossiers autorisés pour révision.
   - `commercial` : prospection et devis, sans accès aux données GES.
3. **Sanitisation :** Protection contre injections SQL, XSS, CSRF, et formules malveillantes dans les exports CSV/Excel.

---

## 7. Rôle Facultatif de Gemini

1. **Rôle :** Assistant conversationnel purement pédagogique (explication des questions, orientation sectorielle, aide à la préparation des documents).
2. **Principe d'indépendance :** L'application, le moteur de calcul et l'ensemble des parcours doivent être 100% fonctionnels même si `GEMINI_API_KEY` est absente.
3. **Périmètre étanche :** Gemini n'a aucun accès en écriture sur la base de données, ne modifie pas les facteurs d'émission, n'exécute pas de calculs et n'a aucun accès aux données d'autres entreprises.
