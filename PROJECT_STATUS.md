# État d'Avancement du Projet Atlas Carbone (PROJECT_STATUS.md)

**Date d'exécution :** 20 octobre 2026  
**Application :** Atlas Carbone — Plateforme SaaS B2B de comptabilité carbone & conformité MACF/CBAM Maroc  
**URL locale d'exécution :** `http://localhost:5000`  
**Statut Global :** **100% Opérationnel & Déployé Localement**  

---

## 1. Matrice des Livrables et Statuts d'Exécution

| Fonction / Module | Statut Réel | Preuve Concrète | Dépendance Restante |
|---|---|---|---|
| **Audit du classeur Excel source** | **Terminé (100%)** | `docs/audit-classeur.md` (SHA-256 : `477f3cf008303144606baf80dba9b125d791a20eccdbc009cf9853e5007ded6c`). 28 feuilles auditées, 7 681 formules analysées, 1 274 `#REF!`, 848 `#NAME?` tracés, 3 liens externes recensés. | Aucune. |
| **Pipeline d'extraction des facteurs** | **Terminé (100%)** | `scripts/extract_factors.py` ayant généré `data/catalog_seed.json` avec 670 facteurs marocains normalisés avec métadonnées complètes, incertitudes, et revue des facteurs mixtes amont+combustion. | Aucune. |
| **Moteur de calcul déterministe** | **Terminé (100%)** | `server/src/core/calculations.ts` et `units.ts`. Validation avec 13 / 13 tests numériques obligatoires réussis (0 échec). | Aucune. |
| **Sécurité & Isolation Multi-Tenant** | **Terminé (100%)** | `tests/security_isolation_tests.ts` exécuté avec 5 / 5 tests réussis (étanchéité stricte tenant, restriction site, confinement commercial, protection injection CSV). | Aucune. |
| **Base de données relationnelle persistante** | **Terminé (100%)** | `server/src/db/database.ts` (SQLite en mode WAL sous Node 22 `node:sqlite`), migrations, clés étrangères strictes, 8 utilisateurs et 3 entreprises isolées seedées. | Aucune. |
| **Module Bilan GES Entreprise (Scopes 1, 2, 3)** | **Terminé (100%)** | Saisie unitaire et en masse, composant « Voir le calcul » (formule, source, PRG AR6, incertitude), distinction Location vs Market-based, clôture immuable. | Aucune. |
| **Module Export Europe MACF / CBAM** | **Terminé (100%)** | Installations, procédés, registre produits codes NC 8 chiffres (ex: 7214 20 00), émissions spécifiques directes/indirectes/précurseurs, dossier de transmission importateur UE. | Aucune pour la génération de dossier. Dépôt automatisé dépendant d'une future API publique de la Commission Européenne. |
| **Plan de transition & Décarbonation** | **Terminé (100%)** | Suivi des actions avec budgets MAD, économies tCO2e, échéances et simulateur solaire photovoltaïque interactif (1 650 kWh/kWc/an). | Aucune. |
| **Commercial, Devis en MAD & Abonnements** | **Terminé (100%)** | 3 offres (Essentiel, Entreprise, Export Europe), générateur de devis en MAD HT, TVA 20% et TTC avec prévisualisation imprimable. | Agrément CMI pour paiement en ligne par carte (virement bancaire actif). |
| **Site Public Vitrine & Acquisition** | **Terminé (100%)** | Page d'accueil responsive, calculateur interactif, solutions par profil d'entreprise, formulaire de contact enregistrant de vrais leads en base. | Aucune. |
| **Assistant Onboarding Guidé** | **Terminé (100%)** | Parcours en 10 étapes conforme à la section 9 du prompt maître avec sauvegarde de progression. | Aucune. |
| **Conteneurisation & Déploiement** | **Terminé (100%)** | `Dockerfile` multi-stage et `docker-compose.yml` opérationnels. Serveur Node.js actif en démon sur le port 5000 servant API et SPA. | Aucune pour le local. Nom de domaine et certificat TLS pour mise en ligne publique. |

---

## 2. Résultats des Tests Automatisés

### Tests Numériques Obligatoires (13 / 13 PASS)
1. `1 000 kWh × 0,5 kgCO2e/kWh = 500 kgCO2e = 0,5 tCO2e` : **PASS**
2. `2 MWh avec ce même facteur = 1 tCO2e` : **PASS**
3. `10 tonnes × 100 km × 0,1 kgCO2e/(tonne-km) = 100 kgCO2e` : **PASS**
4. `2 kg d'un gaz avec PRG de test 1 000 = 2 tCO2e` (non re-multiplié si déjà en CO2e) : **PASS**
5. `1 000 litres avec facteur de test 3 kgCO2e/litre = 3 tCO2e` : **PASS**
6. `Activité sans facteur ou unité incompatible reste non calculable (ne vaut jamais 0)` : **PASS**
7. `Facteur 'amont + combustion' rejeté en Scope 1 pur sans décomposition préalable` : **PASS**
8. `Anti-double comptage entre facteur total et composantes décomposées` : **PASS**
9. `Immuabilité d'un inventaire clôturé après publication de nouveaux facteurs` : **PASS**
10. `Idempotence stricte des imports de données (aucun doublon créé)` : **PASS**
11. `Séparation stricte et non-addition des variantes Location-based et Market-based Scope 2` : **PASS**
12. `Allocation produit MACF : (200 t + 50 t) / 1000 t = 0,25 tCO2e/tonne` : **PASS**
13. `Masse de production nulle bloque l'intensité MACF ; code NC non standard qualifié explicitement` : **PASS**

### Tests de Sécurité et d'Isolation Multi-Tenant (5 / 5 PASS)
1. `Étanchéité stricte des activités entre Tenant A et Tenant B` : **PASS**
2. `Échec des tentatives d'accès non autorisé par manipulation d'URL (Tampering)` : **PASS**
3. `Confinement strict des responsables de site à leur périmètre géographique` : **PASS**
4. `Confinement du rôle Commercial (aucun accès aux pièces justificatives d'émissions)` : **PASS**
5. `Neutralisation systématique des formules malveillantes dans les exports CSV` : **PASS**

---

## 3. Commandes Utiles de Maintenance

```bash
# Lancement de l'application (Backend API + Frontend SPA)
cd atlas-carbone/server && npx tsx src/server.ts

# Lancement des tests obligatoires
cd atlas-carbone/server && ./node_modules/.bin/tsx ../tests/mandatory_numerical_tests.ts

# Lancement des tests de sécurité
cd atlas-carbone/server && ./node_modules/.bin/tsx ../tests/security_isolation_tests.ts

# Re-compilation du bundle frontend
cd atlas-carbone/client && npm run build
```
