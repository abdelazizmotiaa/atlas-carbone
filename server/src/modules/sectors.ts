/**
 * Atlas Carbone - Référentiel des Profils Sectoriels Marocains & Options de Saisie
 * Conforme aux Sections 5, 6, 7 du Prompt Maître
 */

export interface SectorQuestion {
  id: string;
  category: string;
  scope: number;
  label_fr: string;
  label_en: string;
  why_asked_fr: string;
  why_asked_en: string;
  where_to_find_fr: string;
  where_to_find_en: string;
  expected_unit: string;
  example_fictif_fr: string;
  example_fictif_en: string;
  missing_fallback_fr: string;
  missing_fallback_en: string;
  default_factor_search: string; // Terme de recherche pour lier au catalogue
}

export interface SectorProfile {
  id: string;
  name_fr: string;
  name_en: string;
  description_fr: string;
  description_en: string;
  priority_scopes: number[];
  questions: SectorQuestion[];
}

export const SECTOR_PROFILES: SectorProfile[] = [
  {
    id: 'metallurgie_ciment_chimie',
    name_fr: 'Industrie lourde, métallurgie, ciment et chimie',
    name_en: 'Heavy Industry, Metallurgy, Cement & Chemicals',
    description_fr: 'Profil pour usines de production, fonderies, cimenteries et chimie avec combustion stationnaire et précurseurs MACF.',
    description_en: 'Profile for manufacturing plants, foundries, cement plants, and chemical synthesis with stationary combustion and CBAM precursors.',
    priority_scopes: [1, 2, 3],
    questions: [
      {
        id: 'q_met_elec',
        category: 'Électricité réseau',
        scope: 2,
        label_fr: 'Électricité des installations de production et ateliers',
        label_en: 'Electricity for production facilities and workshops',
        why_asked_fr: 'L’électricité soutirée au réseau national ONEE alimente les moteurs, broyeurs et fours électriques.',
        why_asked_en: 'Electricity drawn from national ONEE grid powers motors, grinders, and induction furnaces.',
        where_to_find_fr: 'Factures mensuelles ONEE Haute Tension (HT) ou Moyenne Tension (MT) - Relevé kWh consommation active.',
        where_to_find_en: 'Monthly ONEE utility invoices (High/Medium Voltage) - Active consumption kWh.',
        expected_unit: 'kWh',
        example_fictif_fr: 'Exemple fictif : Usine Aciers Atlas, consommation de 1 250 000 kWh en 2025.',
        example_fictif_en: 'Fictional example: Atlas Steel Mill consumed 1,250,000 kWh in 2025.',
        missing_fallback_fr: 'En cas d’absence, possibilité de saisir les relevés de compteurs divisionnaires ou de déclarer à compléter.',
        missing_fallback_en: 'If bills are unavailable, internal sub-meter logs can be used, or tagged to be completed.',
        default_factor_search: 'Electricité réseau national'
      },
      {
        id: 'q_met_comb_fixe',
        category: 'Combustion fixe',
        scope: 1,
        label_fr: 'Combustibles des fours, chaudières et brûleurs',
        label_en: 'Fuels consumed in furnaces, boilers, and burners',
        why_asked_fr: 'La combustion de fioul lourd, coke, butane ou gaz naturel dégage des émissions directes de CO₂ dans l’atmosphère.',
        why_asked_en: 'Combusting heavy fuel oil, coke, butane, or natural gas releases direct CO₂ into the atmosphere.',
        where_to_find_fr: 'Bons de livraison citernes, factures fournisseurs d’énergie et balances matières de combustion.',
        where_to_find_en: 'Bulk tanker delivery slips, energy supplier invoices, and fuel inventories.',
        expected_unit: 'tonne',
        example_fictif_fr: 'Exemple fictif : 450 tonnes de fioul lourd n°2 consommé dans les brûleurs.',
        example_fictif_en: 'Fictional example: 450 tonnes of heavy fuel oil consumed in factory burners.',
        missing_fallback_fr: 'Si les factures annuelles ne sont pas encore arrêtées, déclarer « À compléter » sans forcer zéro.',
        missing_fallback_en: 'If annual invoices are not yet reconciled, declare "To be completed" without forcing zero.',
        default_factor_search: 'Fioul lourd'
      },
      {
        id: 'q_met_precurseurs',
        category: 'Achats de matières premières',
        scope: 3,
        label_fr: 'Matières premières métalliques ou minérales (Précurseurs)',
        label_en: 'Purchased metallic or mineral inputs (Precursors)',
        why_asked_fr: 'Les matières achetées (ferraille, billettes, clinker) portent l’empreinte carbone de leur fabrication en amont.',
        why_asked_en: 'Purchased raw materials (scrap, billets, clinker) carry significant embedded upstream emissions.',
        where_to_find_fr: 'Rapport annuel du service Achats : tonnages reçus par nuance d’acier ou type de matière.',
        where_to_find_en: 'Annual purchasing summary: tonnage received broken down by steel grade or mineral type.',
        expected_unit: 'tonne',
        example_fictif_fr: 'Exemple fictif : 5 000 tonnes de billettes d’acier brut achetées.',
        example_fictif_en: 'Fictional example: 5,000 tonnes of crude steel billets purchased.',
        missing_fallback_fr: 'Si l’origine exacte n’est pas connue, renseigné comme poste identifié à préciser.',
        missing_fallback_en: 'If exact provenance is unknown, record as an identified item to be refined.',
        default_factor_search: 'Acier'
      },
      {
        id: 'q_met_fret_export',
        category: 'Transport de marchandises',
        scope: 3,
        label_fr: 'Fret et expédition vers les ports marocains ou l’Europe',
        label_en: 'Freight logistics to Moroccan export ports or Europe',
        why_asked_fr: 'Le transport des produits finis par camion ou bateau constitue un poste d’émissions aval majeur.',
        why_asked_en: 'Shipping finished goods by truck or sea container represents a primary downstream emission source.',
        where_to_find_fr: 'Bordereaux de transporteurs, factures de transitaires maritimes ou lettres de voiture.',
        where_to_find_en: 'Carrier freight invoices, sea shipping manifests, and logistics CMR documents.',
        expected_unit: 'tonne-km',
        example_fictif_fr: 'Exemple fictif : 10 000 tonnes transportées sur 250 km jusqu’au port Tanger Med = 2 500 000 t.km.',
        example_fictif_en: 'Fictional example: 10,000 tonnes hauled over 250 km to Tangier Med Port = 2,500,000 t.km.',
        missing_fallback_fr: 'Calculé automatiquement via distance et tonnage si le t.km brut n’est pas disponible.',
        missing_fallback_en: 'Computed automatically from distance and tonnage if direct t.km is unavailable.',
        default_factor_search: 'Transport de marchandise'
      }
    ]
  },
  {
    id: 'textile_confection',
    name_fr: 'Textile, habillement et cuir',
    name_en: 'Textiles, Apparel & Leather Goods',
    description_fr: 'Profil pour usines de tricotage, tissage, teinture, confection et maroquinerie.',
    description_en: 'Profile for knitting, weaving, dyeing, garment manufacturing, and leather factories.',
    priority_scopes: [1, 2, 3],
    questions: [
      {
        id: 'q_tex_elec',
        category: 'Électricité réseau',
        scope: 2,
        label_fr: 'Électricité des ateliers de coupe, confection et finition',
        label_en: 'Electricity for cutting, sewing, and finishing workshops',
        why_asked_fr: 'L’alimentation des machines à coudre, tables de coupe automatique et compresseurs d’air.',
        why_asked_en: 'Powering industrial sewing stations, automated cutting tables, and air compressors.',
        where_to_find_fr: 'Factures mensuelles ONEE ou régie locale d’eau et d’électricité (Amendis, Lydec, Radeema, etc.).',
        where_to_find_en: 'Monthly ONEE or municipal utility bills (Amendis, Lydec, Radeema, etc.).',
        expected_unit: 'kWh',
        example_fictif_fr: 'Exemple fictif : Atelier Confection Tanger, 180 000 kWh consommés sur l’année.',
        example_fictif_en: 'Fictional example: Tangier Apparel Workshop, 180,000 kWh consumed over the year.',
        missing_fallback_fr: 'Relever les index compteurs ou sommer les factures disponibles.',
        missing_fallback_en: 'Aggregate available monthly bills or take meter index readings.',
        default_factor_search: 'Electricité réseau national'
      },
      {
        id: 'q_tex_vapeur',
        category: 'Combustion fixe',
        scope: 1,
        label_fr: 'Combustible des chaudières vapeur et repassage',
        label_en: 'Boiler fuel for steam generation, pressing, and ironing',
        why_asked_fr: 'Le repassage et le thermocollage requièrent de la vapeur souvent produite par du gaz propane ou du fioul.',
        why_asked_en: 'Ironing, pressing, and bonding require steam generated by propane or light fuel oil.',
        where_to_find_fr: 'Factures de livraison de gaz propane en citerne ou de fioul domestique.',
        where_to_find_en: 'Propane gas bulk delivery bills or light fuel oil invoices.',
        expected_unit: 'tonne',
        example_fictif_fr: 'Exemple fictif : 24 tonnes de gaz propane livrées par Afriquia Gaz.',
        example_fictif_en: 'Fictional example: 24 tonnes of bulk propane gas delivered.',
        missing_fallback_fr: 'Si données manquantes, consigné comme poste identifié à compléter.',
        missing_fallback_en: 'If missing, recorded as an identified item to be verified.',
        default_factor_search: 'Propane'
      },
      {
        id: 'q_tex_matieres',
        category: 'Achats de matières premières',
        scope: 3,
        label_fr: 'Fils, tissus et matières premières achetées',
        label_en: 'Yarn, fabric, and raw materials procured',
        why_asked_fr: 'La culture du coton ou la fabrication de fibres synthétiques (polyester, polyamide) pèse lourdement dans le bilan.',
        why_asked_en: 'Cotton cultivation or synthetic fiber extrusion (polyester, nylon) constitutes a major footprint share.',
        where_to_find_fr: 'Grand livre des achats matières ou récapitulatif annuel du service d’approvisionnement.',
        where_to_find_en: 'Purchasing ledger or annual fabric intake weight reports.',
        expected_unit: 'tonne',
        example_fictif_fr: 'Exemple fictif : 85 tonnes de tissu jersey coton et 40 tonnes de polyester.',
        example_fictif_en: 'Fictional example: 85 tonnes of cotton jersey fabric and 40 tonnes of polyester.',
        missing_fallback_fr: 'Indiquer la matière principale si le détail fin n’est pas encore disponible.',
        missing_fallback_en: 'State dominant fabric category if granular blends are not yet categorized.',
        default_factor_search: 'Coton'
      },
      {
        id: 'q_tex_fret_client',
        category: 'Transport de marchandises',
        scope: 3,
        label_fr: 'Expédition des vêtements vers les plateformes clientes',
        label_en: 'Garment shipments to retailer logistics hubs',
        why_asked_fr: 'Les vêtements confectionnés au Maroc sont acheminés par remorques TIR ou navettes maritimes vers l’Europe.',
        why_asked_en: 'Finished apparel is trucked via roll-on/roll-off ferries or road freight to European distribution centers.',
        where_to_find_fr: 'Bons de livraison internationaux et factures des transitaires routiers.',
        where_to_find_en: 'International shipping manifests and road freight forwarder invoices.',
        expected_unit: 'tonne-km',
        example_fictif_fr: 'Exemple fictif : 120 tonnes expédiées sur 1 800 km vers l’Espagne et la France = 216 000 t.km.',
        example_fictif_en: 'Fictional example: 120 tonnes shipped over 1,800 km to Spain and France = 216,000 t.km.',
        missing_fallback_fr: 'Estimer à partir du nombre de camions expédiés et de la ville de destination.',
        missing_fallback_en: 'Estimate from number of truck dispatches and destination cities.',
        default_factor_search: 'Transport de marchandise'
      }
    ]
  },
  {
    id: 'agroalimentaire_froid',
    name_fr: 'Agroalimentaire et chaîne du froid',
    name_en: 'Agri-Food Processing & Cold Chain Logistics',
    description_fr: 'Profil pour conserveries, laiteries, abattoirs, conditionnement de fruits et légumes et entrepôts frigorifiques.',
    description_en: 'Profile for canneries, dairies, packing houses, cold storage, and food manufacturing facilities.',
    priority_scopes: [1, 2, 3],
    questions: [
      {
        id: 'q_agro_froid',
        category: 'Émissions fugitives',
        scope: 1,
        label_fr: 'Recharges et entretien des gaz frigorigènes (chambres froides)',
        label_en: 'Refrigerant gas top-ups from cold rooms and chillers',
        why_asked_fr: 'Les fluides frigorigènes (R-404A, R-134a, R-410A) ont un pouvoir de réchauffement climatique extrême (1 000 à 4 000 fois le CO₂).',
        why_asked_en: 'Refrigerant fluids (R-404A, R-134a, R-410A) possess extreme global warming potentials (1,000 to 4,000 times CO₂).',
        where_to_find_fr: 'Registre d’entretien du frigoriste, factures de maintenance mentionnant les kg de fluide rechargé.',
        where_to_find_en: 'HVAC contractor service logbooks detailing kilograms of refrigerant gas refilled.',
        expected_unit: 'kg',
        example_fictif_fr: 'Exemple fictif : Entrepôt Frigo Agadir, recharge de 8 kg de R-404A lors de la révision estivale.',
        example_fictif_en: 'Fictional example: Cold Storage Agadir, 8 kg of R-404A recharged during annual servicing.',
        missing_fallback_fr: 'Si aucune recharge n’a eu lieu, cocher « Non concerné » avec justification de circuit étanche vérifié.',
        missing_fallback_en: 'If no recharge occurred, check "Not applicable" confirming certified leak-free inspection.',
        default_factor_search: 'R-404A'
      },
      {
        id: 'q_agro_elec',
        category: 'Électricité réseau',
        scope: 2,
        label_fr: 'Électricité des groupes frigorifiques et lignes de transformation',
        label_en: 'Electricity for industrial refrigeration and processing lines',
        why_asked_fr: 'Le maintien de la température dirigée 24h/24 représente souvent plus de 70 % de la facture énergétique du site.',
        why_asked_en: 'Maintaining sub-zero or chilled temperatures 24/7 often accounts for over 70% of total site power demand.',
        where_to_find_fr: 'Factures mensuelles ONEE ou relevés télérelevés des compteurs du poste transformateur.',
        where_to_find_en: 'Monthly ONEE power bills or electronic transformer telemetry readouts.',
        expected_unit: 'kWh',
        example_fictif_fr: 'Exemple fictif : Station de conditionnement Berkane, 420 000 kWh consommés sur la campagne.',
        example_fictif_en: 'Fictional example: Berkane Packing Station, 420,000 kWh consumed during the harvest season.',
        missing_fallback_fr: 'Sommer les 12 mois de facturation ONEE.',
        missing_fallback_en: 'Sum the 12 calendar monthly utility bills.',
        default_factor_search: 'Electricité réseau national'
      },
      {
        id: 'q_agro_emballages',
        category: 'Achats de matières premières',
        scope: 3,
        label_fr: 'Emballages alimentaires (Cartons, barquettes, verre, boîtes métal)',
        label_en: 'Food packaging supplies (Cartons, plastic trays, glass, cans)',
        why_asked_fr: 'La fabrication des barquettes en plastique, boîtes en fer blanc et cartons ondulés génère des émissions amont.',
        why_asked_en: 'Producing plastic trays, tinplate cans, and corrugated cardboard boxes incurs upstream manufacturing emissions.',
        where_to_find_fr: 'Bons de réception du magasin d’emballage et factures fournisseurs annuelles.',
        where_to_find_en: 'Packaging warehouse intake records and annual supplier spend ledgers.',
        expected_unit: 'tonne',
        example_fictif_fr: 'Exemple fictif : 60 tonnes de cartons ondulés et 15 tonnes de barquettes PET.',
        example_fictif_en: 'Fictional example: 60 tonnes of corrugated boxes and 15 tonnes of PET trays.',
        missing_fallback_fr: 'Indiquer le tonnage global estimé à partir des unités d’emballages expédiées.',
        missing_fallback_en: 'Estimate total tonnage from shipped product packaging count.',
        default_factor_search: 'Carton'
      }
    ]
  },
  {
    id: 'transport_logistique',
    name_fr: 'Transport et logistique',
    name_en: 'Transport & Freight Logistics',
    description_fr: 'Profil pour transporteurs routiers, messagerie express, flottes d’autocars et opérateurs logistiques.',
    description_en: 'Profile for road hauliers, parcel couriers, coach operators, and freight logistics companies.',
    priority_scopes: [1, 2, 3],
    questions: [
      {
        id: 'q_trans_gasoil',
        category: 'Combustion mobile',
        scope: 1,
        label_fr: 'Gasoil consommé par la flotte de véhicules maîtrisée',
        label_en: 'Diesel consumed by company-owned or leased fleet vehicles',
        why_asked_fr: 'C’est le cœur de l’activité : chaque litre de gasoil brûlé dégage directement 2,67 kgCO₂e à l’échappement.',
        why_asked_en: 'This is the operational core: each liter of diesel burned emits 2.67 kgCO₂e directly at the tailpipe.',
        where_to_find_fr: 'Relevés mensuels des cartes pétrolières (TotalEnergies, Afriquia, Shell, Winxo) ou cuve privée interne.',
        where_to_find_en: 'Monthly corporate fuel card reports or internal depot fuel dispensing logs.',
        expected_unit: 'litre',
        example_fictif_fr: 'Exemple fictif : Flotte de 25 camions semi-remorques, 380 000 litres de gasoil sur l’exercice.',
        example_fictif_en: 'Fictional example: 25-semi-truck fleet, 380,000 liters of diesel over the financial year.',
        missing_fallback_fr: 'Calculable à partir du kilométrage total parcouru et de la consommation moyenne aux 100 km.',
        missing_fallback_en: 'Can be calculated from total fleet kilometers and average fuel consumption per 100 km.',
        default_factor_search: 'Gazole'
      },
      {
        id: 'q_trans_sous_traite',
        category: 'Transport de marchandises',
        scope: 3,
        label_fr: 'Transport et fret sous-traité à des tiers (Affrètement)',
        label_en: 'Outsourced freight and chartered third-party hauling',
        why_asked_fr: 'Les trajets réalisés par des sous-traitants pour vos clients relèvent de votre Scope 3.',
        why_asked_en: 'Trips performed by subcontractors on your behalf represent your Scope 3 indirect logistics.',
        where_to_find_fr: 'Factures d’affrètement et registres des expéditions sous-traitées.',
        where_to_find_en: 'Chartering invoices and subcontracted dispatch records.',
        expected_unit: 'tonne-km',
        example_fictif_fr: 'Exemple fictif : 500 000 t.km sous-traitées en période de pointe agricole.',
        example_fictif_en: 'Fictional example: 500,000 t.km chartered during harvest peak season.',
        missing_fallback_fr: 'Enregistrer comme poste non quantifié si le t.km ne peut pas être reconstitué.',
        missing_fallback_en: 'Record as unquantified if t.km cannot be defensibly estimated.',
        default_factor_search: 'Transport de marchandise'
      }
    ]
  },
  {
    id: 'services_tertiaire',
    name_fr: 'Services, bureaux, banques et technologies',
    name_en: 'Services, Corporate Offices, Banking & IT',
    description_fr: 'Profil pour cabinets de conseil, agences, sièges sociaux, banques, assurances et entreprises de logiciels.',
    description_en: 'Profile for consultancies, agencies, corporate headquarters, banks, insurers, and tech companies.',
    priority_scopes: [2, 3],
    questions: [
      {
        id: 'q_serv_elec',
        category: 'Électricité réseau',
        scope: 2,
        label_fr: 'Électricité des locaux et bureaux professionnels',
        label_en: 'Electricity consumed in office premises',
        why_asked_fr: 'Alimentation de l’éclairage, des ordinateurs, des serveurs informatiques et de la climatisation des plateaux.',
        why_asked_en: 'Powering office lighting, workstations, server rooms, and floor HVAC systems.',
        where_to_find_fr: 'Factures d’électricité du bailleur ou de la régie locale (Lydec, Redal, Amendis, Radeema).',
        where_to_find_en: 'Office electricity bills or landlord common-charges utility breakdowns.',
        expected_unit: 'kWh',
        example_fictif_fr: 'Exemple fictif : Siège Casa Finance City, 45 000 kWh consommés sur l’année.',
        example_fictif_en: 'Fictional example: Casablanca office suite, 45,000 kWh consumed over the year.',
        missing_fallback_fr: 'Si l’électricité est incluse dans les charges sans compteur dédié, estimer par ratio surface m².',
        missing_fallback_en: 'If electricity is bundled into rent without a sub-meter, estimate from floor area m².',
        default_factor_search: 'Electricité réseau national'
      },
      {
        id: 'q_serv_deplacements',
        category: 'Déplacements professionnels',
        scope: 3,
        label_fr: 'Voyages d’affaires et déplacements des collaborateurs',
        label_en: 'Business travel (Flights, high-speed rail Al Boraq, taxis)',
        why_asked_fr: 'Les trajets en train (Al Boraq / ONCF), en avion pour missions clients et en taxi génèrent des émissions Scope 3.',
        why_asked_en: 'Train journeys (Al Boraq high-speed line), client business flights, and taxis generate Scope 3 travel emissions.',
        where_to_find_fr: 'Relevés de l’agence de voyages d’affaires, notes de frais de transport et billets ONCF.',
        where_to_find_en: 'Corporate travel agency summaries, expense reports, and railway ticket records.',
        expected_unit: 'passager-km',
        example_fictif_fr: 'Exemple fictif : 25 allers-retours Casa-Tanger en Al Boraq (17 000 p.km) et 6 vols Casa-Paris.',
        example_fictif_en: 'Fictional example: 25 Casa-Tangier high-speed train roundtrips (17,000 p.km) and 6 flights to Europe.',
        missing_fallback_fr: 'Possibilité d’agréger les billets d’avion par destination (court / moyen / long courrier).',
        missing_fallback_en: 'Aggregate flights by destination tier (domestic, regional, long-haul).',
        default_factor_search: 'Transport de passager'
      },
      {
        id: 'q_serv_informatique',
        category: 'Immobilisations et achats IT',
        scope: 3,
        label_fr: 'Parc informatique acheté ou renouvelé (PC portables, écrans)',
        label_en: 'IT hardware procured or renewed (Laptops, displays, servers)',
        why_asked_fr: 'La fabrication des puces électroniques et écrans représente l’essentiel de l’empreinte du matériel informatique.',
        why_asked_en: 'Semiconductor manufacturing and display fabrication drive the majority of hardware lifecycle footprint.',
        where_to_find_fr: 'Registre des immobilisations informatiques ou factures du service DSI / Achats.',
        where_to_find_en: 'IT asset registers or annual hardware purchase orders.',
        expected_unit: 'nombre',
        example_fictif_fr: 'Exemple fictif : 20 ordinateurs portables professionnels neufs mis en service.',
        example_fictif_en: 'Fictional example: 20 brand-new business laptops deployed during the year.',
        missing_fallback_fr: 'Renseigner le nombre de postes de travail actifs.',
        missing_fallback_en: 'Indicate the active corporate workstation count.',
        default_factor_search: 'Ordinateur'
      }
    ]
  },
  {
    id: 'hotellerie_restauration',
    name_fr: 'Hôtellerie, tourisme et restauration',
    name_en: 'Hospitality, Tourism & Restaurants',
    description_fr: 'Profil pour hôtels, resorts, riads, restaurants et traiteurs.',
    description_en: 'Profile for hotels, resorts, traditional riads, restaurants, and catering services.',
    priority_scopes: [1, 2, 3],
    questions: [
      {
        id: 'q_hot_elec',
        category: 'Électricité réseau',
        scope: 2,
        label_fr: 'Électricité de l’établissement (Chambres, cuisine, spa, pompes piscines)',
        label_en: 'Electricity for hotel premises (Rooms, kitchens, spa, pool pumps)',
        why_asked_fr: 'L’éclairage, les ascenseurs, la climatisation continue et les équipements de bien-être.',
        why_asked_en: 'Continuous guest room HVAC, kitchens, elevators, spa heating, and pool filtration pumps.',
        where_to_find_fr: 'Factures mensuelles ONEE ou régie locale d’électricité.',
        where_to_find_en: 'Monthly ONEE utility bills or municipal distribution invoices.',
        expected_unit: 'kWh',
        example_fictif_fr: 'Exemple fictif : Hôtel 4 étoiles Marrakech, 320 000 kWh sur l’année.',
        example_fictif_en: 'Fictional example: Marrakech 4-star hotel, 320,000 kWh consumed annually.',
        missing_fallback_fr: 'Sommer les factures annuelles.',
        missing_fallback_en: 'Sum annual power invoices.',
        default_factor_search: 'Electricité réseau national'
      },
      {
        id: 'q_hot_gaz',
        category: 'Combustion fixe',
        scope: 1,
        label_fr: 'Gaz propane ou butane pour cuisines et eau chaude sanitaire',
        label_en: 'Propane or butane gas for kitchens and domestic hot water',
        why_asked_fr: 'Les pianos de cuisson des restaurants et la production d’eau chaude brûlent du gaz.',
        why_asked_en: 'Commercial kitchen cooktops, ovens, and central boiler water heaters combust gas fuel.',
        where_to_find_fr: 'Bons de livraison de citernes de gaz propane ou factures de bouteilles de gaz.',
        where_to_find_en: 'Bulk propane deliveries or bottled cylinder refill bills.',
        expected_unit: 'tonne',
        example_fictif_fr: 'Exemple fictif : 18 tonnes de gaz propane en citerne.',
        example_fictif_en: 'Fictional example: 18 tonnes of bulk propane gas.',
        missing_fallback_fr: 'Calculable à partir du nombre de bouteilles ou livraisons.',
        missing_fallback_en: 'Derivable from cylinder counts or bulk delivery receipts.',
        default_factor_search: 'Propane'
      }
    ]
  },
  {
    id: 'construction_btp',
    name_fr: 'BTP, construction et génie civil',
    name_en: 'Construction, Infrastructure & Civil Engineering',
    description_fr: 'Profil pour entreprises de travaux publics, chantiers de construction, terrassement et voirie.',
    description_en: 'Profile for civil works contractors, building sites, earthmoving, and roadworks operators.',
    priority_scopes: [1, 3],
    questions: [
      {
        id: 'q_btp_engins',
        category: 'Combustion mobile',
        scope: 1,
        label_fr: 'Gasoil des engins de chantier et groupes électrogènes',
        label_en: 'Diesel consumed by heavy construction machinery and site generators',
        why_asked_fr: 'Les pelles mécaniques, bulldozers, chargeuses et groupes diesel brûlent d’importants volumes de carburant.',
        why_asked_en: 'Excavators, bulldozers, loaders, and standalone diesel generators burn heavy fuel volumes.',
        where_to_find_fr: 'Bons de livraison citernes mobiles de chantier et cartes carburant dédiées.',
        where_to_find_en: 'Mobile on-site fuel tank delivery slips and designated contractor fuel cards.',
        expected_unit: 'litre',
        example_fictif_fr: 'Exemple fictif : Chantier Rocade Sud, 95 000 litres de gasoil consommés par les engins.',
        example_fictif_en: 'Fictional example: Highway Project, 95,000 liters of diesel burned by earthmoving machinery.',
        missing_fallback_fr: 'Compiler les factures fournisseurs de carburant.',
        missing_fallback_en: 'Reconcile supplier bulk diesel bills.',
        default_factor_search: 'Gazole'
      },
      {
        id: 'q_btp_materiaux',
        category: 'Achats de matières premières',
        scope: 3,
        label_fr: 'Ciment, béton prêt à l’emploi et armatures en acier',
        label_en: 'Cement, ready-mix concrete, and steel rebar procured',
        why_asked_fr: 'Le béton et l’acier d’armature représentent plus de 80 % du carbone intrinsèque d’un bâtiment ou ouvrage.',
        why_asked_en: 'Ready-mix concrete and steel reinforcing bar drive over 80% of embodied building emissions.',
        where_to_find_fr: 'Bons de livraison des centrales à béton et factures d’armatures métalliques.',
        where_to_find_en: 'Batching plant delivery dockets and steel supplier invoices.',
        expected_unit: 'tonne',
        example_fictif_fr: 'Exemple fictif : 2 400 m³ de béton prêt à l’emploi et 180 tonnes d’acier pour béton.',
        example_fictif_en: 'Fictional example: 2,400 m³ of ready-mix concrete and 180 tonnes of rebar.',
        missing_fallback_fr: 'Relever les métrés prévisionnels ou décomptes définitifs de travaux.',
        missing_fallback_en: 'Refer to bills of quantities (BOQ) or final construction settlement accounts.',
        default_factor_search: 'Ciment'
      }
    ]
  },
  {
    id: 'agriculture_elevage',
    name_fr: 'Agriculture, élevage et arboriculture',
    name_en: 'Agriculture, Farming & Livestock',
    description_fr: 'Profil pour exploitations agricoles, fermes maraîchères, vergers d’agrumes et élevages.',
    description_en: 'Profile for crop farming, citrus orchards, market gardens, and livestock holdings.',
    priority_scopes: [1, 2, 3],
    questions: [
      {
        id: 'q_agri_tracteurs',
        category: 'Combustion mobile',
        scope: 1,
        label_fr: 'Gasoil des tracteurs, moissonneuses et motopompes diesel',
        label_en: 'Diesel for agricultural tractors, harvesters, and diesel pumps',
        why_asked_fr: 'La traction agricole et le pompage autonome au diesel émettent directement du CO₂.',
        why_asked_en: 'Tractor tillage, harvesting, and autonomous diesel irrigation pumps emit direct combustion CO₂.',
        where_to_find_fr: 'Factures de carburant agricole livré à l’exploitation.',
        where_to_find_en: 'Invoices for agricultural diesel delivered to the farm depot.',
        expected_unit: 'litre',
        example_fictif_fr: 'Exemple fictif : Domaine agricole Souss, 35 000 litres de gasoil pour les tracteurs.',
        example_fictif_en: 'Fictional example: Souss citrus orchard, 35,000 liters of diesel for tractor operations.',
        missing_fallback_fr: 'Renseigner le volume total de carburant acheté pour la saison.',
        missing_fallback_en: 'Indicate total fuel volume purchased across the seasonal campaign.',
        default_factor_search: 'Gazole'
      },
      {
        id: 'q_agri_engrais',
        category: 'Achats de matières premières',
        scope: 3,
        label_fr: 'Engrais minéraux azotés et fertilisants chimiques',
        label_en: 'Synthetic nitrogen fertilizers and chemical inputs',
        why_asked_fr: 'La synthèse de l’ammoniac et des nitrates d’ammoniac requiert d’importantes quantités de gaz naturel en amont.',
        why_asked_en: 'Industrial synthesis of ammonia and ammonium nitrate consumes massive upstream natural gas volumes.',
        where_to_find_fr: 'Bons de commande et factures de fertilisants (ammonitrate, urée, NPK).',
        where_to_find_en: 'Fertilizer purchase receipts (ammonium nitrate, urea, compound NPK).',
        expected_unit: 'tonne',
        example_fictif_fr: 'Exemple fictif : 25 tonnes d’ammonitrate 33,5% et 10 tonnes d’urée.',
        example_fictif_en: 'Fictional example: 25 tonnes of 33.5% ammonium nitrate and 10 tonnes of urea.',
        missing_fallback_fr: 'Déclarer les tonnages des principaux engrais épandus.',
        missing_fallback_en: 'Report applied tonnage of the primary commercial fertilizer formulations.',
        default_factor_search: 'Engrais'
      }
    ]
  }
];
