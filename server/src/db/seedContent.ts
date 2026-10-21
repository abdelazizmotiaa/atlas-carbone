/**
 * Atlas Carbone - Initialisation des Contenus Pédagogiques, Guides Piliers et Actualités
 * Contenus originaux bilingues conformes aux normes ISO 14064-1, GHG Protocol et à la méthodologie marocaine.
 */

import { db } from './database.js';

export function runContentSeeds() {
  // 1. Guides Piliers (6 guides originaux en français et en anglais)
  const guideCountStmt = db.prepare('SELECT COUNT(*) as count FROM guides');
  const guideCount = (guideCountStmt.get() as any).count;

  if (guideCount === 0) {
    console.log("--> Initialisation des 6 guides piliers originaux...");
    const insertGuide = db.prepare(`
      INSERT INTO guides (
        id, slug_fr, slug_en, title_fr, title_en, summary_fr, summary_en,
        content_fr, content_en, category, reading_time_minutes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const guides = [
      {
        id: 'guide-01-maroc',
        slug_fr: 'realiser-un-bilan-carbone-d-entreprise-au-maroc',
        slug_en: 'conducting-corporate-carbon-footprint-morocco',
        title_fr: 'Réaliser un bilan carbone d’entreprise au Maroc : méthode et repères clés',
        title_en: 'Conducting a Corporate Carbon Footprint in Morocco: Key Methodological Steps',
        summary_fr: 'Guide pratique pour initier la comptabilité carbone de votre entreprise au Maroc : obligations, normes applicables, spécificités du mix électrique national et étapes de collecte.',
        summary_en: 'Practical roadmap for Moroccan businesses embarking on carbon accounting: regulatory context, standards, Moroccan grid realities, and key collection phases.',
        category: 'méthodologie',
        time: 7,
        content_fr: `## Pourquoi engager un bilan carbone au Maroc aujourd’hui ?

Pour les entreprises opérant au Maroc, la comptabilité carbone n'est plus un simple exercice de communication RSE. Elle est devenue un levier stratégique de compétitivité industrielle et commerciale pour trois raisons majeures :
1. **Les exigences des donneurs d'ordre internationaux** : Les multinationales clientes de la sous-traitance marocaine (automobile, aéronautique, textile) exigent la transparence sur l'empreinte carbone de leurs fournisseurs.
2. **Le Mécanisme d’Ajustement Carbone aux Frontières (MACF / CBAM)** : Entré en vigueur dans l'Union européenne, il impose aux exportateurs de déclarer leurs émissions intrinsèques sous peine de sanctions financières.
3. **Le cadre national de transition bas carbone** : Porté par la Fondation Mohammed VI pour la Protection de l'Environnement, l'AMEE et le Ministère de la Transition Énergétique, l'écosystème marocain s'aligne progressivement sur les standards ISO 14064.

## Les grandes étapes de la démarche

1. **Définir l’année de référence et le périmètre** : Généralement l’exercice comptable civil le plus récent clos (du 1er janvier au 31 décembre).
2. **Cartographier les flux physiques** : Identifier où l'énergie et la matière entrent et sortent (combustibles chaudières, flotte de véhicules, électricité réseau, fret amont et aval, intrants industriels).
3. **Appliquer les facteurs d’émission marocains validés** : Utiliser en priorité les facteurs territorialisés (ONEE, AMEE, classeur de référence marocain) plutôt que des facteurs génériques internationaux qui ne reflètent pas le mix marocain.
4. **Calculer et documenter les incertitudes** : Assurer une traçabilité intégrale pour chaque calcul pour permettre les audits futurs.`,
        content_en: `## Why Undertake a Carbon Footprint in Morocco Today?

For companies operating in Morocco, carbon accounting is no longer a mere CSR exercise. It has become a strategic commercial prerequisite driven by three core forces:
1. **Supply chain requirements from global buyers**: Multinationals sourcing from Moroccan suppliers (automotive, aerospace, apparel) demand complete Scope 1, 2, and 3 disclosure.
2. **The European Carbon Border Adjustment Mechanism (CBAM)**: Enforced by the EU, requiring heavy industry exporters to report certified embedded emissions.
3. **The national low-carbon transition framework**: Championed by the Mohammed VI Foundation for Environmental Protection and AMEE, moving Moroccan industry toward ISO 14064 standards.

## Core Implementation Steps

1. **Define baseline year and organizational boundary**: Typically the latest full calendar fiscal year.
2. **Map physical operational flows**: Fuel combustion, vehicle fleets, electricity meters, freight logistics, and purchased raw materials.
3. **Apply verified Moroccan emission factors**: Prioritizing national sources (ONEE, national reference datasets) over generic international defaults.
4. **Calculate, report, and establish a reduction baseline**: Ensuring verifiable documentation ready for third-party inspection.`
      },
      {
        id: 'guide-02-scopes',
        slug_fr: 'comprendre-les-scopes-1-2-et-3',
        slug_en: 'understanding-scopes-1-2-and-3',
        title_fr: 'Comprendre les Scopes 1, 2 et 3 : repères clairs sans jargon',
        title_en: 'Demystifying Scopes 1, 2, and 3: Clear Guidelines Without the Jargon',
        summary_fr: 'Comprendre facilement la distinction entre émissions directes, électricité réseau et émissions indirectes de la chaîne de valeur selon le GHG Protocol et l’ISO 14064-1.',
        summary_en: 'A clear guide to distinguishing direct emissions, purchased electricity, and value-chain indirect emissions under GHG Protocol and ISO 14064-1.',
        category: 'méthodologie',
        time: 6,
        content_fr: `## Les trois périmètres d'émissions expliqués simplement

La comptabilité carbone répartit les émissions de gaz à effet de serre en trois « scopes » (ou catégories selon l'ISO 14064-1:2018) :

### Scope 1 : Vos émissions directes
Ce sont les émissions qui s'échappent physiquement de vos propres installations ou équipements :
- **Combustion stationnaire** : Gaz naturel, butane, fioul ou charbon brûlés dans vos chaudières, fours ou groupes électrogènes.
- **Combustion mobile** : Gasoil ou essence consommés par les véhicules possédés ou loués par l'entreprise.
- **Émissions fugitives** : Fuites de gaz frigorigènes lors de l'entretien ou du fonctionnement de vos climatiseurs et chambres froides.

### Scope 2 : Vos émissions indirectes liées à l'énergie
Il s'agit des émissions générées lors de la production de l'électricité que vous achetez :
- Principalement l'électricité soutirée du réseau national ONEE.
- Au Maroc, le mix électrique moyen historique est d'environ 0,643 kgCO₂e/kWh net (hors pertes de réseau).

### Scope 3 : Toutes les autres émissions de votre chaîne de valeur
Ce sont les émissions en amont et en aval de vos opérations :
- Matières premières et emballages achetés (Catégorie 1).
- Déplacements domicile-travail de vos collaborateurs (Catégorie 7).
- Transport et fret de marchandises confié à des prestataires (Catégories 4 et 9).
- Fin de vie et utilisation des produits vendus.`,
        content_en: `## Clear Overview of the Three Scopes

Carbon accounting classifies greenhouse gas emissions into three operational scopes under GHG Protocol and ISO 14064-1:2018:

### Scope 1: Direct Emissions
Emissions physically released from sources owned or controlled by your company:
- **Stationary combustion**: Fuel oil, natural gas, butane, or coal burned in factory boilers, kilns, or generators.
- **Mobile combustion**: Diesel or gasoline consumed by company-owned or leased fleet vehicles.
- **Fugitive emissions**: Refrigerant gas leakages from HVAC systems and cold rooms.

### Scope 2: Indirect Emissions from Purchased Energy
Emissions created during the generation of purchased electricity:
- In Morocco, primarily electricity drawn from the national ONEE grid.
- Scope 2 rules require reporting under the Location-based method (reflecting the regional grid average).

### Scope 3: Value Chain Indirect Emissions
All other upstream and downstream emissions across suppliers and product life cycles:
- Purchased goods, raw materials, and packaging (Category 1).
- Employee commuting (Category 7).
- Third-party freight logistics (Categories 4 and 9).
- End-of-life treatment of sold products.`
      },
      {
        id: 'guide-03-preparer-donnees',
        slug_fr: 'preparer-ses-donnees-avant-de-commencer',
        slug_en: 'preparing-data-before-starting',
        title_fr: 'Préparer ses données avant de commencer : check-list des pièces et documents',
        title_en: 'Preparing Your Data Before Starting: Essential Documents Checklist',
        summary_fr: 'La liste exhaustive des factures, compteurs et justificatifs à rassembler dans vos services comptabilité, achats et logistique pour renseigner votre bilan.',
        summary_en: 'Comprehensive checklist of bills, utility invoices, and purchasing reports needed to build your carbon inventory.',
        category: 'pratique',
        time: 5,
        content_fr: `## La règle d'or : privilégier les données physiques

Pour obtenir un calcul fiable, recherchez toujours la quantité physique (litres, kWh, tonnes, m³) plutôt qu'un montant monétaire en dirhams (MAD). Une dépense financière varie avec les cours du marché et l'inflation, alors qu'une émission dépend strictement de la quantité physique consommée.

## Checklist par département

### 1. Direction financière et comptabilité
- [ ] Factures d'électricité annuelles ONEE ou régie locale (relever les kWh consommés, mois par mois).
- [ ] Factures d'achat de carburant (relevés mensuels des cartes carburant avec volume en litres).
- [ ] Factures de gaz propane, butane ou fioul de chauffe (quantité en tonnes ou litres).
- [ ] Factures de maintenance des climatiseurs (rechercher la mention de recharge de fluide frigorigène en kg).

### 2. Service Achats & Approvisionnements
- [ ] État annuel des réceptions de matières premières principales (tonnage d'acier, de plastique, de tissu, de carton, de ciment).
- [ ] Bons de livraison des palettes et emballages consommés.

### 3. Logistique & Expéditions
- [ ] Bordereaux d'expédition avec tonnages transportés et distances parcourues (tonnes-kilomètres).
- [ ] Mode de transport utilisé : camion porteur, semi-remorque, bateau, avion.

### 4. Ressources Humaines
- [ ] Effectif moyen annuel équivalent temps plein (ETP).
- [ ] Distance moyenne domicile-travail et modes de déplacement majeurs du personnel.`,
        content_en: `## The Golden Rule: Prioritize Physical Activity Data

To guarantee accuracy, always seek physical units (kWh, liters, tonnes, km) rather than monetary spending in Dirhams (MAD). Monetary conversions distort emissions due to price volatility and inflation.

## Departmental Collection Checklist

### 1. Finance & Accounting
- [ ] Monthly electricity invoices from ONEE or local water/power utilities (kWh consumed).
- [ ] Corporate fleet fuel cards (liters of diesel and gasoline).
- [ ] Stationary fuel invoices (butane, fuel oil, natural gas).
- [ ] HVAC maintenance service sheets noting refrigerant top-ups (kg of R-410A, R-134a, etc.).

### 2. Procurement & Purchasing
- [ ] Annual summaries of primary raw material purchases by weight (steel, cotton, polymers, paper).
- [ ] Packaging materials deliveries (pallets, cartons, plastic wraps).

### 3. Logistics & Shipping
- [ ] Outbound logistics manifests detailing tonnage and route distances (tonne-kilometers).
- [ ] Transport modes: dedicated heavy trucks, maritime freight, or air cargo.

### 4. Human Resources
- [ ] Full-time equivalent (FTE) headcount.
- [ ] Commuting mode split and average distances.`
      },
      {
        id: 'guide-04-facteurs-emission',
        slug_fr: 'comprendre-les-facteurs-d-emission-et-leurs-limites',
        slug_en: 'understanding-emission-factors-and-limitations',
        title_fr: 'Comprendre les facteurs d’émission et leurs limites : traçabilité et incertitudes',
        title_en: 'Understanding Emission Factors and Their Boundaries: Traceability and Uncertainty',
        summary_fr: 'Comment est construit un facteur d’émission, pourquoi son unité et son année importent, et comment traiter l’absence d’un facteur adapté.',
        summary_en: 'How emission factors are formulated, why reference years matter, and how to address missing emission factors rigorously.',
        category: 'méthodologie',
        time: 6,
        content_fr: `## Qu'est-ce qu'un facteur d'émission ?

Un facteur d'émission est un coefficient multiplicateur qui convertit une quantité d'activité observable en une masse de gaz à effet de serre équivalente :
$$\\text{Émissions } (kgCO_2e) = \\text{Donnée d'activité} \\times \\text{Facteur d'émission}$$

## Pourquoi tous les facteurs ne se valent pas ?

1. **Le périmètre couvert (amont vs combustion)** :
   Un litre de gasoil émet environ 2,67 kgCO₂e lors de sa combustion directe dans le moteur (Scope 1). Mais son extraction, son raffinage et son transport ajoutent environ 0,38 kgCO₂e supplémentaires en amont (Scope 3). Utiliser un facteur global « amont + combustion » dans le Scope 1 constitue une erreur méthodologique.
2. **La zone géographique** :
   Le facteur de l'électricité dépend du mix énergétique local. Appliquer un facteur européen à une usine casablancaise fausse l'inventaire. Au Maroc, le mix électrique fait encore appel au charbon, au fioul et au gaz, combinés à un développement rapide de l'éolien et du solaire.
3. **Que faire quand aucun facteur n'existe ?** :
   Dans Atlas Carbone, si une activité est identifiée sans facteur validé correspondant dans notre classeur de référence, nous appliquons la règle de rigueur : elle est déclarée comme **« Poste identifié, non quantifié : facteur disponible insuffisant »**. Nous n'attribuons jamais zéro par défaut.`,
        content_en: `## What is an Emission Factor?

An emission factor is a conversion metric relating physical activity to equivalent greenhouse gas mass:
$$\\text{Emissions } (kgCO_2e) = \\text{Activity Data} \\times \\text{Emission Factor}$$

## Critical Evaluation Criteria

1. **Boundary scope (combustion vs upstream)**:
   One liter of diesel emits ~2.67 kgCO₂e upon combustion (Scope 1). Upstream refining and transit add ~0.38 kgCO₂e (Scope 3). Mixing total factors into Scope 1 violates ISO 14064 principles.
2. **Geographical relevance**:
   Moroccan electricity relies on the national ONEE production profile. Using French or German grid coefficients for a facility in Kenitra invalidates the audit.
3. **Handling Missing Factors**:
   In Atlas Carbone, whenever an identified activity lacks a validated coefficient in the official reference workbook, it is marked as **« Identified activity, unquantified »**. We strictly reject assigning arbitrary zeros.`
      },
      {
        id: 'guide-05-inventaire-vs-macf',
        slug_fr: 'distinguer-inventaire-d-entreprise-et-macf-cbam',
        slug_en: 'distinguishing-corporate-inventory-and-cbam',
        title_fr: 'Distinguer inventaire d’entreprise (Bilan Carbone) et MACF/CBAM européen',
        title_en: 'Distinguishing Corporate GHG Accounting from the EU CBAM Regulation',
        summary_fr: 'Attention aux amalgames : un inventaire annuel d’organisation n’est pas une déclaration MACF. Règles d’attribution par code produit NC et périmètre des installations.',
        summary_en: 'Avoiding common confusion: a corporate annual carbon footprint is not a CBAM filing. Product CN codes, system boundaries, and embedded emissions.',
        category: 'réglementation',
        time: 8,
        content_fr: `## Deux exercices radicalement différents

Nombre d'entreprises exportatrices pensent qu'un bilan carbone global suffit pour répondre à leurs importateurs européens soumis au MACF. C'est une confusion coûteuse :

| Critère | Bilan Carbone / ISO 14064-1 | MACF / CBAM (Règlement UE 2023/956) |
|---|---|---|
| **Objet évalué** | L'organisation entière (sites, bureaux, personnel) | Un produit manufacturé spécifique (Code NC 8 chiffres) |
| **Périmètre** | Année civile, tous les scopes (1, 2, 3) | Émissions intrinsèques de l'installation de production ($SEE$) |
| **Scope 3** | Exhaustif (achats, fret, déplacements, etc.) | Limité aux précurseurs directs (ex: fonte pour fabriquer l'acier) |
| **Unité finale** | Total en $tCO_2e$ de l'entreprise | Ratio en $tCO_2e$ par tonne de produit fini exporté |
| **Obligation légale** | Volontaire ou exigée par les clients | Légale obligatoire pour l'importateur européen |

## Comment Atlas Carbone sépare ces deux flux

Atlas Carbone intègre un module MACF totalement indépendant de votre inventaire d'entreprise. Il permet de renseigner vos installations de production au Maroc, vos procédés, vos consommations de précurseurs et de générer le fichier de communication XML/JSON conforme aux exigences de la Commission Européenne.`,
        content_en: `## Two Distinct Regulatory Dimensions

Corporate GHG accounting and EU CBAM reporting serve fundamentally different purposes:

| Feature | Corporate GHG / ISO 14064 | EU CBAM Regulation (EU 2023/956) |
|---|---|---|
| **Target Object** | The whole organization | Specific product lines (8-digit CN code) |
| **Boundary** | Annual organization operations | Specific installation production processes |
| **Scope 3 Treatment** | Full value chain categories | Strictly limited to relevant input precursors |
| **Metric** | Total annual $tCO_2e$ | Specific embedded emissions ($tCO_2e$ / tonne) |
| **Enforcement** | Commercial / voluntary standard | Statutory EU customs regulation |

## Architectural Separation in Atlas Carbone

Atlas Carbone isolates CBAM calculations from corporate inventories, generating dedicated installation reports for European customs importers.`
      },
      {
        id: 'guide-06-plan-reduction',
        slug_fr: 'lire-son-rapport-et-construire-un-plan-de-reduction',
        slug_en: 'reading-reports-and-building-reduction-plans',
        title_fr: 'Lire son rapport et construire un plan de réduction pragmatique',
        title_en: 'Reading Your Report and Structuring an Actionable Reduction Plan',
        summary_fr: 'Comment analyser les postes prépondérants de vos émissions, fixer des objectifs réalistes et chiffrer des actions concrètes (solaire, efficacité énergétique, écoconduite).',
        summary_en: 'Interpreting major emission hotspots, setting credible reduction targets, and scheduling practical investments (photovoltaic solar, energy efficiency, logistics).',
        category: 'action',
        time: 6,
        content_fr: `## L'inventaire n'est qu'un point de départ

Mesurer ses émissions de gaz à effet de serre n'a de sens que si cela débouche sur une stratégie de décarbonation mesurable dans le temps.

## Les 3 règles d'un plan d'actions solide

1. **Attaquer les postes de Pareto** : Dans la majorité des PME marocaines, 80 % des émissions proviennent de 2 ou 3 postes seulement (électricité réseau, combustible chaudière ou fret lourd). Concentrez vos investissements là où se trouvent les tonnes, pas sur des actions symboliques.
2. **Prioriser les gisements à retour sur investissement rapide** :
   - *Autoconsommation solaire photovoltaïque* : Avec un ensoleillement marocain moyen produisant 1 650 kWh/kWc/an, le solaire en toiture réduit directement le Scope 2 tout en protégeant l'entreprise contre les hausses tarifaires de l'énergie.
   - *Récupération de chaleur et isolation industrielle* : Calorifugeage des réseaux vapeur et des échangeurs.
   - *Optimisation des tournées logistiques* : Réduction des trajets à vide et écoconduite.
3. **Désigner un responsable et une échéance claire pour chaque action** : Une action sans responsable ni jalon calendaire ne se concrétise jamais. Atlas Carbone vous permet d'assigner chaque mesure à un porteur identifié avec un indicateur de suivi vérifiable.`,
        content_en: `## An Inventory is Just Day Zero

Calculating your corporate carbon footprint only delivers business value when paired with a measurable decarbonization plan.

## Three Pillars of an Actionable Plan

1. **Focus on Pareto Hotspots**: In most Moroccan enterprises, 80% of emissions stem from 2 or 3 activities (ONEE electricity, thermal boilers, or heavy freight). Invest where the tons reside.
2. **Prioritize High-ROI Interventions**:
   - *Rooftop Solar PV*: Generating ~1,650 kWh/kWp/year under Moroccan sunshine, cutting Scope 2 while capping energy costs.
   - *Industrial Heat Recovery & Insulation*: Insulating steam circuits and boilers.
   - *Fleet Route Optimization & Eco-Driving*: Lowering fuel liters per delivered ton.
3. **Assign Clear Ownership and Milestones**: Every initiative must have a named owner, target year, and measurable performance indicator tracked inside Atlas Carbone.`
      }
    ];

    for (const g of guides) {
      insertGuide.run(
        g.id, g.slug_fr, g.slug_en, g.title_fr, g.title_en,
        g.summary_fr, g.summary_en, g.content_fr, g.content_en,
        g.category, g.time, new Date().toISOString()
      );
    }
    console.log(`✅ ${guides.length} guides piliers insérés.`);
  }

  // 2. Actualités sectorielles et réglementaires
  const newsCountStmt = db.prepare('SELECT COUNT(*) as count FROM news_articles');
  const newsCount = (newsCountStmt.get() as any).count;

  if (newsCount === 0) {
    console.log("--> Initialisation des actualités sectorielles et réglementaires...");
    const insertNews = db.prepare(`
      INSERT INTO news_articles (
        id, slug_fr, slug_en, title_fr, title_en, excerpt_fr, excerpt_en,
        content_fr, content_en, category, status, author, sources_json,
        published_at, updated_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const articles = [
      {
        id: 'news-01-macf-2026',
        slug_fr: 'entree-en-vigueur-regime-definitif-macf-impact-maroc',
        slug_en: 'definitive-eu-cbam-regime-enters-into-force-morocco',
        title_fr: 'Régime définitif du MACF : ce qui change pour les industriels marocains',
        title_en: 'Definitive EU CBAM Regime: What Changes for Moroccan Manufacturers',
        excerpt_fr: 'La période transitoire du MACF prend fin. Les importateurs européens exigent désormais des données vérifiées et l’achat de certificats pour l’acier, le ciment et les engrais.',
        excerpt_en: 'The EU CBAM transitional phase has concluded. European importers now demand verified installation data for steel, cement, and fertilizer imports.',
        category: 'reglementation',
        sources: JSON.stringify(['Commission Européenne - Règlement (UE) 2023/956', 'Douanes Européennes DG TAXUD']),
        published_at: '2026-09-15T10:00:00Z',
        content_fr: `Depuis l'entrée en vigueur du régime définitif du Mécanisme d'Ajustement Carbone aux Frontières (MACF) de l'Union européenne, les industriels marocains exportateurs de fer, acier, aluminium, ciment et engrais doivent fournir des données précises et certifiées sur leurs émissions intrinsèques directes et indirectes.

L'utilisation de valeurs par défaut pénalise lourdement les flux commerciaux. Atlas Carbone accompagne les opérateurs de la métallurgie et des matériaux pour calculer précisément leurs ratios d'émissions par tonne de produit fini et préparer le dossier de transmission attendu par leurs déclarants européens.`,
        content_en: `With the definitive EU Carbon Border Adjustment Mechanism (CBAM) rules taking full effect, Moroccan exporters of iron, steel, aluminum, cement, and fertilizers must provide verified data on direct and indirect embedded emissions.

Relying on generic default values exposes EU importers to penalizing surcharges. Atlas Carbone enables Moroccan industrial operators to calculate certified product intensities per ton and export standard communication files.`
      },
      {
        id: 'news-02-mix-maroc-solaire',
        slug_fr: 'evolution-mix-electrique-maroc-autoconsommation-loi-82-21',
        slug_en: 'moroccan-power-mix-evolution-and-self-generation-law-82-21',
        title_fr: 'Décarbonation de l’énergie : la loi 82-21 sur l’autoconsommation électrique au Maroc',
        title_en: 'Energy Decarbonization: Morocco’s Law 82-21 on Self-Generation Acceleration',
        excerpt_fr: 'L’essor des parcs photovoltaïques en toiture industrielle permet aux entreprises de réduire drastiquement leur Scope 2 tout en abaissant leur facture énergétique.',
        excerpt_en: 'The rollout of rooftop industrial solar plants enables Moroccan enterprises to curtail Scope 2 emissions while stabilizing electricity costs.',
        category: 'energie',
        sources: JSON.stringify(['Bulletin Officiel du Royaume du Maroc', 'Ministère de la Transition Énergétique et du Développement Durable']),
        published_at: '2026-08-20T14:30:00Z',
        content_fr: `La mise en application des textes d'application de la loi n° 82-21 relative à l'autoconsommation d'énergie électrique ouvre de formidables perspectives pour l'industrie marocaine.

Les entreprises peuvent désormais raccorder des installations solaires sur leurs sites industriels avec des modalités de raccordement clarifiées. Dans un bilan carbone, l'électricité solaire autoconsommée présente un facteur d'émission de combustion directe nul, allégeant immédiatement le Scope 2 de l'entreprise.`,
        content_en: `The implementation decrees of Moroccan Law 82-21 governing electrical self-generation represent a breakthrough for sustainable industrial parks across the Kingdom.

Enterprises can now deploy and interconnect rooftop solar plants with simplified grid access. In greenhouse gas accounting, self-consumed solar power carries zero direct combustion emissions, delivering immediate Scope 2 reductions.`
      },
      {
        id: 'news-03-rse-maroc-cgem',
        slug_fr: 'exigences-rse-donneurs-ordre-automobile-textile',
        slug_en: 'esg-and-carbon-reporting-automotive-textile-ecosystems',
        title_fr: 'Automobile et Textile : les donneurs d’ordre renforcent leurs audits carbone',
        title_en: 'Automotive & Apparel: Global Buyers Intensify Supplier Carbon Audits',
        excerpt_fr: 'Les écosystèmes automobiles de Tanger Med et de Kénitra, ainsi que les confectionneurs textiles, voient leurs grilles d’évaluation ESG intégrer des exigences carbone strictes.',
        excerpt_en: 'Automotive supplier clusters in Tangier and Kenitra, alongside textile exporters, face strict supplier decarbonization scorecards.',
        category: 'entreprises_maroc',
        sources: JSON.stringify(['Fédération Marocaine de l’Automobile (FMA)', 'AMITH Maroc']),
        published_at: '2026-07-10T09:15:00Z',
        content_fr: `Les constructeurs et marques internationales opérant au Maroc intègrent désormais l'empreinte carbone comme critère éliminatoire lors des renouvellements de contrats d'approvisionnement.

Un bilan carbone complet réalisé selon l'ISO 14064-1 et documenté avec traçabilité des données d'activité permet aux sous-traitants de préserver leur rang et d'accéder aux marchés préférentiels.`,
        content_en: `International OEMs and apparel retailers sourcing from Morocco now enforce carbon accounting as a qualification threshold in supplier tenders.

A complete inventory compliant with ISO 14064-1 and backed by full activity trace allows local suppliers to maintain their tier-1 ranking and secure long-term procurement contracts.`
      }
    ];

    for (const a of articles) {
      insertNews.run(
        a.id, a.slug_fr, a.slug_en, a.title_fr, a.title_en,
        a.excerpt_fr, a.excerpt_en, a.content_fr, a.content_en,
        a.category, 'published', 'Abdelaziz Motiaa', a.sources,
        a.published_at, null, new Date().toISOString()
      );
    }
    console.log(`✅ ${articles.length} actualités insérées.`);
  }

  // 3. Modules Pédagogiques de l'Académie Bilan Carbone (10 modules)
  const academyCountStmt = db.prepare('SELECT COUNT(*) as count FROM academy_modules');
  const academyCount = (academyCountStmt.get() as any).count;

  if (academyCount === 0) {
    console.log("--> Initialisation des 10 modules pédagogiques de l'Académie...");
    const insertModule = db.prepare(`
      INSERT INTO academy_modules (
        id, module_number, title_fr, title_en, summary_fr, summary_en,
        content_fr, content_en, example_fr, example_en,
        quiz_question_fr, quiz_question_en, quiz_options_fr, quiz_options_en,
        quiz_correct_index, quiz_explanation_fr, quiz_explanation_en,
        action_link, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const modules = [
      {
        id: 'mod-01-ges',
        num: 1,
        title_fr: 'Comprendre les gaz à effet de serre et le CO₂e',
        title_en: 'Understanding Greenhouse Gases and CO₂e',
        summary_fr: 'Les 6 gaz de Kyoto, le pouvoir de réchauffement global (PRG) et pourquoi nous comptons en équivalent CO₂.',
        summary_en: 'The Kyoto basket of GHGs, Global Warming Potential (GWP), and why we measure in CO₂ equivalent.',
        content_fr: 'Le dioxyde de carbone (CO₂) est le principal gaz émis par l’activité humaine, mais ce n’est pas le seul : méthane (CH₄), protoxyde d’azote (N₂O) et gaz fluorés (HFC, PFC, SF₆, NF₃) ont un pouvoir de réchauffement bien supérieur. Le PRG permet de ramener l’impact de chaque gaz à une unité commune : le kg ou la tonne d’équivalent CO₂ (kgCO₂e).',
        content_en: 'While carbon dioxide (CO₂) represents the bulk of industrial emissions, methane (CH₄), nitrous oxide (N₂O), and fluorinated gases (HFCs, PFCs, SF₆, NF₃) trap heat far more aggressively. The Global Warming Potential (GWP) standardizes these impacts into a single unit: kilograms or metric tons of CO₂ equivalent (kgCO₂e).',
        example_fr: '1 kg de fluide frigorigène R-410A relâché dans l’air a le même impact climatique que 2 088 kg de CO₂ émis par une chaudière.',
        example_en: 'Releasing 1 kg of R-410A refrigerant gas has the exact same climate warming impact as 2,088 kg of CO₂ from fuel combustion.',
        quiz_q_fr: 'Si un facteur d’émission est déjà exprimé en kgCO₂e, faut-il le multiplier par son PRG ?',
        quiz_q_en: 'If an emission factor is already expressed in kgCO₂e, should you multiply it again by its GWP?',
        quiz_opt_fr: JSON.stringify(['Oui, pour inclure le méthane', 'Non, le PRG est déjà incorporé dans l’unité CO₂e', 'Seulement pour les carburants']),
        quiz_opt_en: JSON.stringify(['Yes, to account for methane', 'No, the GWP is already factored into CO₂e', 'Only for transport fuels']),
        quiz_ans: 1,
        quiz_exp_fr: 'Multiplier un facteur exprimé en CO₂e par son PRG constitue une erreur de double comptage grave.',
        quiz_exp_en: 'Multiplying an already unified CO₂e factor by a GWP factor constitutes severe double counting.',
        action: '/activities'
      },
      {
        id: 'mod-02-perimetre',
        num: 2,
        title_fr: 'Définir le périmètre organisationnel de son entreprise',
        title_en: 'Defining Your Organizational Boundary',
        summary_fr: 'Contrôle opérationnel, contrôle financier ou part en capital : quelle méthode de consolidation choisir ?',
        summary_en: 'Operational control, financial control, or equity share: choosing your consolidation approach.',
        content_fr: 'Avant de saisir la moindre facture, l’entreprise doit fixer la règle d’inclusion de ses sites, filiales et équipements. La règle recommandée pour 95 % des entreprises est le « Contrôle Opérationnel » : vous comptabilisez 100 % des émissions des sites où vous avez le pouvoir de définir les politiques opérationnelles.',
        content_en: 'Before entering any data, an organization must define how subsidiaries, leased sites, and assets are consolidated. For 95% of businesses, the recommended standard is Operational Control: accounting for 100% of emissions from facilities where your management has full authority to introduce operating policies.',
        example_fr: 'Un entrepôt loué à Casablanca dont vous gérez l’activité et payez l’électricité entre à 100 % dans votre périmètre opérationnel.',
        example_en: 'A leased warehouse in Casablanca where you direct operations and pay electricity falls 100% within your operational control.',
        quiz_q_fr: 'Quelle est l’approche de consolidation la plus couramment utilisée pour les PME marocaines ?',
        quiz_q_en: 'What is the most widely adopted consolidation approach for Moroccan mid-caps?',
        quiz_opt_fr: JSON.stringify(['La part en capital stricte', 'Le contrôle opérationnel', 'L’approche par chiffre d’affaires']),
        quiz_opt_en: JSON.stringify(['Strict equity share', 'Operational control', 'Revenue share approach']),
        quiz_ans: 1,
        quiz_exp_fr: 'Le contrôle opérationnel permet d’agir directement sur les leviers d’efficacité énergétique et de réduction.',
        quiz_exp_en: 'Operational control aligns directly with internal management authority to implement carbon reduction measures.',
        action: '/onboarding'
      },
      {
        id: 'mod-03-scopes',
        num: 3,
        title_fr: 'Comprendre les Scopes avec des situations concrètes',
        title_en: 'Understanding Scopes Through Real Business Cases',
        summary_fr: 'Distinguer émissions directes (Scope 1), électricité (Scope 2) et chaîne de valeur (Scope 3).',
        summary_en: 'Distinguishing direct emissions (Scope 1), purchased power (Scope 2), and value chain (Scope 3).',
        content_fr: 'Le Scope 1 correspond à ce que brûlent ou rejettent vos propres machines. Le Scope 2 correspond à la centrale électrique qui produit le courant que vous consommez. Le Scope 3 correspond à tout ce que font vos fournisseurs pour vous livrer et à l’usage de vos produits.',
        content_en: 'Scope 1 covers physical combustion or gas escapes from your owned assets. Scope 2 accounts for power plants generating the grid electricity you buy. Scope 3 encompasses supplier production, freight, commuting, and product life cycles.',
        example_fr: 'Carburant d’un camion appartenant à l’entreprise = Scope 1. Transport de vos marchandises confié à un transporteur tiers = Scope 3.',
        example_en: 'Fuel consumed by a company-owned van = Scope 1. Outbound delivery outsourced to a 3rd-party haulier = Scope 3.',
        quiz_q_fr: 'Un transport confié à un transporteur externe relève de quel scope ?',
        quiz_q_en: 'Freight logistics contracted out to a third-party haulier belongs to which scope?',
        quiz_opt_fr: JSON.stringify(['Scope 1', 'Scope 2', 'Scope 3 (Catégorie 4 ou 9)']),
        quiz_opt_en: JSON.stringify(['Scope 1', 'Scope 2', 'Scope 3 (Category 4 or 9)']),
        quiz_ans: 2,
        quiz_exp_fr: 'N’ayant pas la propriété des camions du sous-traitant, l’émission est indirecte et relève du Scope 3.',
        quiz_exp_en: 'Because the vehicles are not owned or leased by your company, the emissions are indirect value-chain emissions (Scope 3).',
        action: '/activities'
      },
      {
        id: 'mod-04-documents',
        num: 4,
        title_fr: 'Préparer les documents nécessaires à la collecte',
        title_en: 'Preparing Your Essential Activity Invoices',
        summary_fr: 'Quels documents rechercher et comment mobiliser les équipes comptabilité et achats.',
        summary_en: 'What documents to retrieve and how to mobilize your finance and purchasing departments.',
        content_fr: 'Un inventaire GES réussi repose à 80 % sur la qualité des justificatifs rassemblés : factures ONEE (kWh), relevés de cartes carburant (litres), fiches d’intervention frigorifique (kg de fluides) et balances d’achats matières premières (tonnes).',
        content_en: 'A robust GHG inventory is 80% dependent on solid physical records: utility power bills (kWh), fleet fuel reports (liters), HVAC service certificates (kg gas recharged), and purchasing weight ledgers (tonnes).',
        example_fr: 'La fiche d’intervention annuelle du frigoriste indiquant « 5 kg de R-404A ajoutés » constitue la preuve d’une fuite Scope 1 de 19 610 kgCO₂e.',
        example_en: 'An HVAC maintenance log recording "5 kg of R-404A refilled" proves an operational Scope 1 leakage of 19,610 kgCO₂e.',
        quiz_q_fr: 'Quelle donnée est la plus fiable pour calculer les émissions des véhicules ?',
        quiz_q_en: 'What is the most reliable input for corporate vehicle fleet emissions?',
        quiz_opt_fr: JSON.stringify(['Le montant total des indemnités kilométriques en MAD', 'Les litres réels de carburant consommés issus des cartes carburant', 'Une estimation basée sur la cylindrée']),
        quiz_opt_en: JSON.stringify(['Total mileage allowance reimbursements in MAD', 'Actual liters of fuel drawn from fleet card logs', 'An estimate based on engine size']),
        quiz_ans: 1,
        quiz_exp_fr: 'Le volume physique en litres donne le calcul le plus exact sans distorsion monétaire.',
        quiz_exp_en: 'Physical liters yield direct, highly defensible calculations unaffected by fuel price shifts.',
        action: '/activities'
      },
      {
        id: 'mod-05-unites',
        num: 5,
        title_fr: 'Choisir une donnée et son unité physique',
        title_en: 'Selecting Data and Physical Units',
        summary_fr: 'Pourquoi les unités monétaires doivent être évitées au profit des unités physiques.',
        summary_en: 'Why monetary spend ratios should be avoided in favor of physical metric units.',
        content_fr: 'Les facteurs monétaires (kgCO₂e par dirham dépensé) comportent une incertitude de 40 % à 80 % liée à l’inflation et aux marges commerciales. Privilégiez toujours les grandeurs physiques : kWh, MWh, litres, mètres cubes, tonnes, passager-km ou tonne-km.',
        content_en: 'Spend-based carbon intensities (kgCO₂e per MAD spent) suffer high uncertainty (40% to 80%) caused by commercial margins and inflation. Always favor physical parameters: kWh, MWh, liters, tonnes, passenger-km, or tonne-km.',
        example_fr: '10 tonnes transportées sur 200 km = 2 000 tonnes-kilomètres (t.km), unité standard du fret routier.',
        example_en: '10 metric tons hauled over 200 kilometers = 2,000 tonne-kilometers (t.km), the universal freight unit.',
        quiz_q_fr: 'Quelle est l’unité physique officielle pour exprimer l’activité de fret de marchandises ?',
        quiz_q_en: 'What is the standardized physical unit for freight logistics activity?',
        quiz_opt_fr: JSON.stringify(['Le nombre de camions observés', 'La tonne-kilomètre (tonne-km)', 'Le coût en dirhams du transport']),
        quiz_opt_en: JSON.stringify(['Number of observed trucks', 'Tonne-kilometer (tonne-km)', 'Haulage invoice cost in MAD']),
        quiz_ans: 1,
        quiz_exp_fr: 'La tonne-kilomètre combine la masse transportée et la distance pour refléter l’effort physique réel.',
        quiz_exp_en: 'The tonne-kilometer combines mass and transit distance to mirror real combustion exertion.',
        action: '/activities'
      },
      {
        id: 'mod-06-facteurs',
        num: 6,
        title_fr: 'Comprendre un facteur d’émission et sa traçabilité',
        title_en: 'Understanding Emission Factors and Traceability',
        summary_fr: 'Origine des facteurs, périmètre amont/combustion et année de référence.',
        summary_en: 'Origins of emission coefficients, upstream/combustion split, and reference vintage.',
        content_fr: 'Un facteur d’émission d’un classeur de référence ne doit jamais être utilisé sans comprendre son périmètre. Par exemple, un facteur de fioul qui intègre à la fois l’amont et la combustion ne peut pas être imputé intégralement au Scope 1 sans fausser la déclaration.',
        content_en: 'An emission factor from an official workbook must never be applied blindly. A heavy fuel oil factor that combines extraction, refining, and combustion cannot be allocated 100% to Scope 1 without corrupting boundaries.',
        example_fr: 'Pour le diesel, la combustion pure est de 2,67 kgCO₂e/l (Scope 1) et l’amont pétrolier est de 0,38 kgCO₂e/l (Scope 3 Cat 3).',
        example_en: 'For diesel, tailpipe combustion is 2.67 kgCO₂e/l (Scope 1), while upstream refining is 0.38 kgCO₂e/l (Scope 3 Cat 3).',
        quiz_q_fr: 'Que doit-on faire si un facteur d’émission officiel mélange amont et combustion ?',
        quiz_q_en: 'What should be done if an official factor bundles upstream and combustion together?',
        quiz_opt_fr: JSON.stringify(['L’affecter entièrement en Scope 1', 'Le ventiler ou signaler une réserve méthodologique sur le périmètre', 'Le supprimer']),
        quiz_opt_en: JSON.stringify(['Allocate it entirely to Scope 1', 'Split components or flag a methodological scope reservation', 'Delete it']),
        quiz_ans: 1,
        quiz_exp_fr: 'La rigueur ISO 14064 exige de distinguer les émissions directes des émissions indirectes amont.',
        quiz_exp_en: 'ISO 14064 compliance strictly mandates isolating direct combustion from upstream supply emissions.',
        action: '/activities'
      },
      {
        id: 'mod-07-doubles-comptes',
        num: 7,
        title_fr: 'Repérer les oublis et les risques de doubles comptes',
        title_en: 'Spotting Omissions and Double-Counting Risks',
        summary_fr: 'Les pièges classiques : climatisation oubliée, carburant comptabilisé deux fois, voyages d’affaires.',
        summary_en: 'Classic pitfalls: forgotten HVAC recharges, double-counted fuel receipts, business travel.',
        content_fr: 'Les deux erreurs les plus courantes sont l’omission de postes significatifs (les fluides frigorigènes des climatiseurs, souvent oubliés alors qu’ils représentent parfois 20 % du Scope 1) et le double comptage (compter les factures de carburant globales de la comptabilité ET les notes de frais individuelles).',
        content_en: 'The two most pervasive errors in corporate reporting are omitting high-impact sources (HVAC leakages, which often account for 20% of Scope 1) and double counting (tallying bulk fuel tank bills AND personal mileage expense claims).',
        example_fr: 'Comptabiliser une facture de citerne de diesel de 10 000 litres ET les tickets de la flotte alimentée par cette citerne crée un double compte immédiat.',
        example_en: 'Recording an on-site 10,000-liter diesel storage delivery AND the vehicle odometer draw-downs from that exact tank doubles emissions.',
        quiz_q_fr: 'Quel poste d’émissions directes Scope 1 est le plus fréquemment oublié par les PME ?',
        quiz_q_en: 'Which Scope 1 direct emission source is most frequently forgotten by mid-sized firms?',
        quiz_opt_fr: JSON.stringify(['L’électricité des bureaux', 'Les fuites de gaz frigorigènes des climatiseurs', 'Le carburant des camions']),
        quiz_opt_en: JSON.stringify(['Office electricity', 'Refrigerant gas leaks from air-conditioners', 'Fleet truck fuel']),
        quiz_ans: 1,
        quiz_exp_fr: 'Les climatiseurs fonctionnent sans combustion visible, ce qui conduit souvent à oublier leurs recharges de fluide.',
        quiz_exp_en: 'Because HVAC units run quietly with no exhaust smoke, refrigerant top-ups are often overlooked.',
        action: '/activities'
      },
      {
        id: 'mod-08-rapport',
        num: 8,
        title_fr: 'Lire un rapport d’inventaire et comprendre ses limites',
        title_en: 'Interpreting a GHG Inventory Report and Its Boundaries',
        summary_fr: 'Comprendre l’incertitude globale, les postes non quantifiés et la traçabilité.',
        summary_en: 'Understanding overall uncertainty bounds, unquantified items, and audit trails.',
        content_fr: 'Un rapport d’inventaire sérieux ne prétend jamais être « 100 % parfait sans aucune incertitude ». Il présente clairement le total calculé sur le périmètre couvert, l’intervalle d’incertitude statistique (par exemple ± 12 %) et la liste honnête des postes identifiés mais non quantifiés par manque de données.',
        content_en: 'A credible carbon report never claims "100% absolute perfection". It transparently states the computed total over the declared perimeter, the 95% confidence uncertainty interval (e.g., ± 12%), and lists items identified but unquantified.',
        example_fr: 'Si les déplacements professionnels n’ont pas pu être renseignés faute de registres de voyage, le rapport doit l’indiquer explicitement dans ses limites.',
        example_en: 'If business flights could not be compiled due to missing travel agent reports, the report must state this exclusion explicitly.',
        quiz_q_fr: 'Que signifie une mention « Poste identifié, non quantifié » dans un rapport ?',
        quiz_q_en: 'What does an "Identified item, unquantified" note indicate in a carbon report?',
        quiz_opt_fr: JSON.stringify(['Que ce poste émet 0 tCO₂e', 'Que l’activité existe mais qu’aucun facteur ou donnée fiable n’a permis de la calculer avec certitude', 'Que le poste est illégal']),
        quiz_opt_en: JSON.stringify(['The item has zero emissions', 'The activity exists but lacked verified factors or primary data to quantify defensibly', 'The activity is non-compliant']),
        quiz_ans: 1,
        quiz_exp_fr: 'Cette mention évite de fausser le total avec un zéro factice tout en informant en toute transparence l’auditeur.',
        quiz_exp_en: 'This notation prevents distorting totals with fake zeros while giving full disclosure to auditors.',
        action: '/report'
      },
      {
        id: 'mod-09-plan-action',
        num: 9,
        title_fr: 'Construire un plan de réduction carbone opérationnel',
        title_en: 'Structuring an Actionable Decarbonization Plan',
        summary_fr: 'Définir des actions prioritaires, des responsables, des échéances et des gains tCO₂e réalistes.',
        summary_en: 'Defining priority actions, owners, milestones, and justified tCO₂e reduction targets.',
        content_fr: 'Un plan d’action bas-carbone doit s’appuyer sur la réalité économique de l’entreprise. Au Maroc, le solaire photovoltaïque en toiture, l’optimisation des chaudières vapeur et le remplacement des vieux climatiseurs par des modèles au R-32 sont des investissements hautement rentables.',
        content_en: 'A decarbonization plan must align with business economics. In Morocco, industrial rooftop solar PV, boiler steam insulation, and shifting HVAC fleets to modern R-32 refrigerants offer rapid paybacks.',
        example_fr: 'Installer 100 kWc de panneaux solaires en toiture à Tanger évite environ 106 tCO₂e par an sur le Scope 2 de l’usine.',
        example_en: 'Installing 100 kWp of rooftop solar PV in Tangier avoids ~106 tCO₂e annually from the factory Scope 2 footprint.',
        quiz_q_fr: 'Comment doit être formulée une action de réduction efficace ?',
        quiz_q_en: 'How should an effective carbon reduction initiative be structured?',
        quiz_opt_fr: JSON.stringify(['Avec un slogan général', 'Avec un responsable désigné, un budget, une année cible et un indicateur physique mesurable', 'En promettant la neutralité immédiate']),
        quiz_opt_en: JSON.stringify(['With a generic mission slogan', 'With a named owner, budget, target completion year, and measurable physical KPI', 'By promising instant zero-carbon neutrality']),
        quiz_ans: 1,
        quiz_exp_fr: 'La traçabilité et l’affectation d’un responsable garantissent la réalisation effective des travaux.',
        quiz_exp_en: 'Accountability, clear ownership, and physical KPIs turn pledges into executed engineering projects.',
        action: '/reduction'
      },
      {
        id: 'mod-10-verification',
        num: 10,
        title_fr: 'Calcul interne, contrôle logiciel et vérification indépendante',
        title_en: 'Internal Calculation vs. 3rd-Party Verification',
        summary_fr: 'Ne confondez pas un calcul logiciel avec une certification d’audit accréditée ISO 14065.',
        summary_en: 'Do not confuse software calculations with accredited 3rd-party ISO 14065 audit certification.',
        content_fr: 'Atlas Carbone est un outil déterministe puissant qui applique rigoureusement les formules et les facteurs officiels. Cependant, un contrôle logiciel ou une réponse de l’assistant ne remplace jamais un audit de vérification par un organisme tiers indépendant accrédité (selon l’ISO 14065 / ISO 14064-3). Aucun logiciel ne peut s’auto-déclarer « certifiant » sans vérificateur humain assermenté.',
        content_en: 'Atlas Carbone is an engine strictly executing certified equations and factors. However, automated validation or AI guidance never substitutes for an independent verification audit conducted by an ISO 14065 / ISO 14064-3 accredited inspection body. Software cannot legally declare an inventory certified without certified human auditors.',
        example_fr: 'Atlas Carbone génère un dossier structuré et horodaté prêt à être soumis à un auditeur externe agréé.',
        example_en: 'Atlas Carbone produces an immutable, fully referenced dossier engineered specifically for third-party external audit inspection.',
        quiz_q_fr: 'Un rapport généré par un logiciel carbone constitue-t-il automatiquement une certification ISO 14064 ?',
        quiz_q_en: 'Does a software-generated carbon report constitute an automatic ISO 14064 audit certificate?',
        quiz_opt_fr: JSON.stringify(['Oui, le logiciel est certifié', 'Non, seule une vérification indépendante par un auditeur accrédité peut délivrer une attestation de conformité', 'Seulement si le calcul a été vérifié par Gemini']),
        quiz_opt_en: JSON.stringify(['Yes, the software is certified', 'No, only independent inspection by an accredited auditor can issue a compliance certificate', 'Only if reviewed by Gemini']),
        quiz_ans: 1,
        quiz_exp_fr: 'L’audit externe évalue la réalité physique des factures et l’absence de biais sur site, ce qu’aucun logiciel ne peut faire seul.',
        quiz_exp_en: 'Accredited verifiers inspect on-site physical meter validity and source data authenticity, which no software can perform in isolation.',
        action: '/report'
      }
    ];

    for (const m of modules) {
      insertModule.run(
        m.id, m.num, m.title_fr, m.title_en, m.summary_fr, m.summary_en,
        m.content_fr, m.content_en, m.example_fr, m.example_en,
        m.quiz_q_fr, m.quiz_q_en, m.quiz_opt_fr, m.quiz_opt_en,
        m.quiz_ans, m.quiz_exp_fr, m.quiz_exp_en, m.action,
        new Date().toISOString()
      );
    }
    console.log(`✅ ${modules.length} modules pédagogiques de l'Académie insérés.`);
  }
}
