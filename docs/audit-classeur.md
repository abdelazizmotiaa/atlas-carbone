# Audit Technique et Méthodologique du Classeur Excel Source

**Nom du fichier analysé :** `Bilan Carbone Maroc-compatible postes iso14064 et GHG Protocol-draft-15 octobre 2024 (3) (1).xlsx`  
**Empreinte SHA-256 :** `477f3cf008303144606baf80dba9b125d791a20eccdbc009cf9853e5007ded6c`  
**Taille :** 599,466 octets (585.42 Ko)  
**Date d'audit :** 20 octobre 2026  
**Statut de la source :** Document de travail / draft ministériel & partenarial (Fondation Mohammed VI, AMEE, IMANOR, ABC, ADEME)  

---

## 1. Synthèse globale des constats

- **Nombre total de feuilles :** 28 (27 visibles, 1 masquée : `Incertitude et PRG`)
- **Nombre total de cellules avec formules :** 7,681
- **Cellules dont l'expression contient `#REF!` :** 1,274
- **Valeurs d'erreur `#REF!` enregistrées en cache :** 1,583
- **Valeurs d'erreur `#NAME?` enregistrées en cache :** 848
- **Nombre de liens externes trouvés :** 3
- **Fonctions Excel propriétaires causant `#NAME?` :** `=IF, CONCAT, FORECAST.LINEAR`
- **Facteurs d'émission bruts identifiables extraits :** 665

### Alertes méthodologiques critiques
1. **Faute d'orthographe dans l'onglet de synthèse :** L'onglet se nomme textuellement `Synthèse selon GHG Ptorocol`. Cette chaîne exacte est conservée pour la traçabilité de l'import, mais corrigée en `GHG Protocol` dans l'interface et les exports.
2. **Facteurs mixtes « Amont + Combustion » dans le Scope 1 :** Dans `P1-S1-Source Fixe combustion`, de nombreux facteurs incorporent l'amont du combustible (ex: Anthracite 2 864 kgCO2e/tonne, GPL 3 428 kgCO2e/tonne). Selon le GHG Protocol et l'ISO 14064-1, la combustion directe appartient au Scope 1 (Catégorie 1), tandis que l'amont du combustible relève du Scope 3 Catégorie 3 (Énergie amont non incluse dans les Scopes 1 et 2). L'application Atlas Carbone doit ventiler ou exiger un facteur de combustion pure pour le Scope 1.
3. **Facteur d'émission de l'électricité réseau (`P6-S2`) :**
   - Libellé B49 : `Electricité réseau national - Mix moyen 2020`
   - Formule C49 : `=0.721/(1.122)` = `0.6426024955436719` kgCO2e/kWh
   - Taux de perte déclaré en C50 : `12.2` %
   - La formule de cellule d'exemple L27 applique un facteur brut de 0,721 kgCO2e/kWh (pertes incluses). Ce facteur reflète le mix moyen 2020 historique du Maroc. Il est conservé comme facteur historique sourcé, mais le moteur Atlas Carbone permet l'actualisation avec les facteurs ONEE/AMEE récents et sépare nettement la méthode *Location-based* et *Market-based*.
4. **Feuille masquée `Incertitude et PRG` :**
   - Les colonnes HFC et PFC contiennent des plages textuelles (`HFC`: `4,84 à 14600`, `PFC`: `0,004 à 12400`), et non des valeurs numériques scalaires. Aucun calcul automatique direct ne peut multiplier par une chaîne '4,84 à 14600'. Atlas Carbone implémente la table complète des fluides frigorigènes purs et mélanges (R-134a, R-410A, R-404A, etc.) avec leurs PRG AR6 individuels.
   - Les incertitudes dites « Exacte » (5%) à « ND » (50%) sont des conventions forfaitaires du classeur, pas des écarts-types statistiques mesurés.
5. **Feuilles Scope 3 aval dupliquées et corrompues :** Les feuilles P14, P15, P18, P19, P20, P21, P23 contiennent chacune 144 formules `#REF!` et aucune table de facteurs active. Elles ont été clonées à partir d'un gabarit sans que les plages sources n'existent.

---

## 2. Inventaire exhaustif des feuilles

| N° | Nom de l'onglet | Statut | Lignes max | Cols max | Formules | #REF! formules | #REF! cache | #NAME? cache | Facteurs extraits |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `Introduction` | visible | 36 | 20 | 0 | 0 | 0 | 0 | 0 |
| 2 | `Synthèse selon ISO 14064` | visible | 40 | 19 | 72 | 11 | 17 | 21 | 0 |
| 3 | `Synthèse selon GHG Ptorocol` | visible | 39 | 19 | 63 | 8 | 13 | 21 | 0 |
| 4 | `Incertitude et PRG` | hidden | 81 | 16 | 0 | 0 | 0 | 0 | 0 |
| 5 | `P1-S1-Source Fixe combustion` | visible | 77 | 59 | 189 | 0 | 0 | 20 | 28 |
| 6 | `P2-S1-Source mobile Combust.` | visible | 52 | 24 | 110 | 0 | 0 | 14 | 8 |
| 7 | `P3-S1-Emiss. Proc. hors énergie` | visible | 62 | 56 | 160 | 7 | 14 | 20 | 12 |
| 8 | `P4-S1-Emiss. fugitives Climatis` | visible | 188 | 50 | 395 | 0 | 0 | 36 | 100 |
| 9 | `P5-S1-UTCATF` | visible | 211 | 26 | 477 | 0 | 0 | 0 | 46 |
| 10 | `P6-S2-ConsommationElectricité` | visible | 65 | 23 | 140 | 0 | 0 | 18 | 7 |
| 11 | `P7-S2-Emiss. Vap. Chal. Froid` | visible | 58 | 23 | 132 | 36 | 54 | 18 | 0 |
| 12 | `P8-S3-En. non incluse post-1&7` | visible | 58 | 23 | 132 | 36 | 54 | 18 | 0 |
| 13 | `P9-S3-.Achats prod. et services` | visible | 142 | 51 | 225 | 0 | 0 | 22 | 59 |
| 14 | `P10-S3.Immobilisations de biens` | visible | 187 | 25 | 206 | 0 | 0 | 26 | 42 |
| 15 | `P11-S3- Déchets` | visible | 57 | 26 | 130 | 0 | 0 | 14 | 18 |
| 16 | `P17-S3-Transport march.aval` | visible | 195 | 28 | 356 | 0 | 0 | 42 | 75 |
| 17 | `P22-S3-Trajet dom.Travail.Empl.` | visible | 224 | 26 | 642 | 56 | 64 | 74 | 65 |
| 18 | `P16-S3-Trans.Client.Visit` | visible | 224 | 26 | 637 | 56 | 64 | 74 | 65 |
| 19 | `P13-S3-Transp. Professionnels` | visible | 224 | 26 | 637 | 56 | 64 | 74 | 65 |
| 20 | `P12-S3-Trans.March.amont` | visible | 195 | 28 | 355 | 0 | 0 | 42 | 75 |
| 21 | `P18-S3-Util. prod.vendus` | visible | 120 | 26 | 348 | 144 | 177 | 42 | 0 |
| 22 | `P19-S3-Fin vie prod.vendus` | visible | 120 | 26 | 348 | 144 | 177 | 42 | 0 |
| 23 | `P20-S3-Franchise aval` | visible | 120 | 26 | 348 | 144 | 177 | 42 | 0 |
| 24 | `P14-S3-Actifs en Leasing amont` | visible | 120 | 26 | 348 | 144 | 177 | 42 | 0 |
| 25 | `P21-S3-Actifs loués en aval` | visible | 120 | 26 | 348 | 144 | 177 | 42 | 0 |
| 26 | `P23-S3-Aut.émiss.non inclus.` | visible | 120 | 26 | 348 | 144 | 177 | 42 | 0 |
| 27 | `P15-S3-Investissements` | visible | 120 | 26 | 348 | 144 | 177 | 42 | 0 |
| 28 | `Validité facteurs émission` | visible | 197 | 8 | 187 | 0 | 0 | 0 | 0 |

---

## 3. Liens externes identifiés

Trois liens externes sont incorporés dans les définitions du classeur, prouvant une dépendance vers des chemins locaux Windows obsolètes :
- `file:///D:\EC\6.%20TECHNIQUE\BILAN%20CARBONE\6.%20AUTRES%20OUTILS-INITATIVES\Climate%20Leaders\Outil%20simplifié\Copie%20de%20sgec_tool_v3_1.xls`
- `file:///D:\Users\Asus\Documents\outil%20V10\Copie%20de%20Outil%20Bilan%20Carbone%20Maroc-v17-08-2023.xlsx`
- `Copie%20de%20Copie%20de%20Outil%20Bilan%20Carbone%20Maroc-v17-08-2023.xlsx`

> **Décision :** Atlas Carbone n'accède à aucun de ces fichiers externes inexistants. Toutes les données nécessaires sont intégrées de façon autonome dans la base de données relationnelle versionnée.

---

## 4. Analyse détaillée des postes et facteurs d'émission

### P1-S1-Source Fixe combustion (28 facteurs candidats identifiés)
| Ligne | Libellé original | Valeur | Unité | Incertitude | Source déclarée |
|---|---|---|---|---|---|
| 41 | Anthracite, amont et combustion | 2864 | `kgCO2e/tonne` | 0.2 | Non spécifié |
| 42 | Bois bûche (20 % humidité) | 0.06734199999999979 | `kgCO2e/kg` | 0.5 | Non spécifié |
| 43 | Butane (GPL) amont et combustion | 3428 | `kgCO2e/tonne` | 0.1 | Non spécifié |
| 44 | Charbon de bois | 0.323015 | `kgCO2e/kg` | 0.5 | Non spécifié |
| 45 | Fioul domestique, amont et combustion | 3.056 | `kgCO2e/litre` | 0.1 | Non spécifié |
| 46 | Fioul lourd, amont et combustion | 3.376 | `kgCO2e/litre` | 0.1 | Non spécifié |
| 47 | Gaz d'aciérie, combustion (Monde) | 1263 | `kgCO2e/tonne` | 0.1 | Non spécifié |
| 48 | Gaz de raffinerie / pétrochimie, combustion (Monde) | 11217 | `kgCO2e/tep PCI` | 0.1 | Non spécifié |
| ... | *(20 autres facteurs extraits)* | ... | ... | ... | ... |

### P2-S1-Source mobile Combust. (8 facteurs candidats identifiés)
| Ligne | Libellé original | Valeur | Unité | Incertitude | Source déclarée |
|---|---|---|---|---|---|
| 38 | Diesel Pompe | 3.056 | `kgCO2e/Litre` | 0.1 | Non spécifié |
| 39 | Essence Pompe | 2.915 | `kgCO2e/Litre` | 0.1 | Non spécifié |
| 40 | Kérosène | 3.085 | `kgCO2e/Litre` | 0.1 | Non spécifié |
| 41 | Hydrogène (Electrolyse source photovoltaïque) lieu de production | 3.22 | `kgCO2e/kg H2` | None | Non spécifié |
| 42 | Hydrogène (Electrolyse source éolien) lieu de production | 0.95 | `kgCO2e/kg H2` | None | Non spécifié |
| 43 | Hydrogène (Electrolyse source hydraulique) lieu de production | 0.59 | `kgCO2e/kg H2` | None | Non spécifié |
| 44 | Transport hydrogène à 200 bars | 1.12 | `kgCO2e/kg H2/100km` | None | Non spécifié |
| 45 | Transport hydrogène à 500 bars | 0.35 | `kgCO2e/kg H2/100km` | None | Non spécifié |

### P3-S1-Emiss. Proc. hors énergie (12 facteurs candidats identifiés)
| Ligne | Libellé original | Valeur | Unité | Incertitude | Source déclarée |
|---|---|---|---|---|---|
| 42 | Méthane | 0.0056 | `kgCO2e/kg DCO éliminée` | 0.5 | Non spécifié |
| 43 | Eaux usées domestiques- rejet libre et stagnant | 1.848 | `kgCO2e/kg de DCO` | 0.5 | Non spécifié |
| 44 | Méthanisation des déchets d'abattoirs viande blanche | 1.9280470588235297 | `kgCO2e/t de déchets` | 0.2 | Non spécifié |
| 45 | Méthanisation des déchets d'abattoirs viande rouge | 168 | `kgCO2e/t de déchets` | 0.2 | Non spécifié |
| 46 | Emission fugitive dans la production du clinker | 498.5 | `kgCO2e/tonne ciment` | 0.1 | Non spécifié |
| 47 | Emission fugitive dans la production du  polyuréthane | 70.8 | `kgCO2e/kg` | 0.1 | Non spécifié |
| 48 | Emission fugitive dans la production de la chaux à partir de la calcite | 790 | `kgCO2e/tonne chaux vive` | 0.1 | Non spécifié |
| 49 | Emission fugitive dans la production de la chaux à partir de la dolomite | 910 | `kgCO2e/tonne chaux vive` | 0.1 | Non spécifié |
| ... | *(4 autres facteurs extraits)* | ... | ... | ... | ... |

### P4-S1-Emiss. fugitives Climatis (100 facteurs candidats identifiés)
| Ligne | Libellé original | Valeur | Unité | Incertitude | Source déclarée |
|---|---|---|---|---|---|
| 76 | Transport frigorifique - Conteneur autonome | 9.2 | `Equipement` | 0.2 | Non spécifié |
| 88 | Carbon dioxide | 1 | `kgCO2e/kg` | 0.3 | Non spécifié |
| 89 | Methane | 27.9 | `kgCO2e/kg` | 0.3 | Non spécifié |
| 90 | Nitrous oxide | 273 | `kgCO2e/kg` | 0.3 | Non spécifié |
| 91 | HFC-23 | 14800 | `kgCO2e/kg` | 0.3 | Non spécifié |
| 92 | HFC-32 | 675 | `kgCO2e/kg` | 0.3 | Non spécifié |
| 93 | HFC-41 | 92 | `kgCO2e/kg` | 0.3 | Non spécifié |
| 94 | HFC-125 | 3500 | `kgCO2e/kg` | 0.3 | Non spécifié |
| ... | *(92 autres facteurs extraits)* | ... | ... | ... | ... |

### P5-S1-UTCATF (46 facteurs candidats identifiés)
| Ligne | Libellé original | Valeur | Unité | Incertitude | Source déclarée |
|---|---|---|---|---|---|
| 111 | Ovins | 104.42 | `kgCO2e/tête/an` | 0.74 | Non spécifié |
| 112 | Caprins | 104.7 | `kgCO2e/tête/an` | 0.74 | Non spécifié |
| 113 | Camélidés | 386.9 | `kgCO2e/tête/an` | 0.72 | Non spécifié |
| 114 | Chevaux | 379.06 | `kgCO2e/tête/an` | 0.72 | Non spécifié |
| 115 | Mules et ânes | 358.34 | `kgCO2e/tête/an` | 0.73 | Non spécifié |
| 116 | Bovins laitiers | 611 | `kgCO2e/tête/an` | 0.74 | Non spécifié |
| 117 | Bovins non laitiers | 444.43 | `kgCO2e/tête/an` | 0.73 | Non spécifié |
| 118 | volaille | 5.5 | `kgCO2e/tête/an` | 0.73 | Non spécifié |
| ... | *(38 autres facteurs extraits)* | ... | ... | ... | ... |

### P6-S2-ConsommationElectricité (7 facteurs candidats identifiés)
| Ligne | Libellé original | Valeur | Unité | Incertitude | Source déclarée |
|---|---|---|---|---|---|
| 49 | Electricité réseau national - Mix moyen 2020 | 0.6426024955436719 | `kgCO2e/kWh` | None | Non spécifié |
| 56 | Centrale éolienne | 0.0127 | `kgCO2e/kWh` | None | Non spécifié |
| 57 | Centrale hydraulique | 0.006 | `kgCO2e/kWh` | None | Non spécifié |
| 58 | Centrale solaire | 0.055 | `kgCO2e/kWh` | None | Non spécifié |
| 59 | Centrale thermique charbon | 1.06 | `kgCO2e/kWh` | None | Non spécifié |
| 60 | Centrale thermique fioul | 0.73 | `kgCO2e/kWh` | None | Non spécifié |
| 61 | Centrale thermique gaz naturel | 0.418 | `kgCO2e/kWh` | None | Non spécifié |

### P7-S2-Emiss. Vap. Chal. Froid (0 facteurs candidats identifiés)
*Aucun facteur numérique direct dans ce poste (modèle vide ou références rompues).*

### P8-S3-En. non incluse post-1&7 (0 facteurs candidats identifiés)
*Aucun facteur numérique direct dans ce poste (modèle vide ou références rompues).*

### P9-S3-.Achats prod. et services (59 facteurs candidats identifiés)
| Ligne | Libellé original | Valeur | Unité | Incertitude | Source déclarée |
|---|---|---|---|---|---|
| 59 | Acier - Fabrication | 1976.2 | `kgCO2e/Tonne` | 0.1 | Non spécifié |
| 60 | Acier import/local | 1976 | `kgCO2e/Tonne` | 0.1 | Non spécifié |
| 61 | Acier local | 1934 | `kgCO2e/Tonne` | 0.1 | Non spécifié |
| 62 | Acier - Neuf import | 3190 | `kgCO2e/Tonne` | 0.1 | Non spécifié |
| 63 | Acier - Recyclé import | 1100 | `kgCO2e/Tonne` | 0.1 | Non spécifié |
| 64 | Aluminium neuf/recyclé | 5631 | `kgCO2e/Tonne` | 0.3 | Non spécifié |
| 65 | Cuivre - Neuf | 1482.3 | `kgCO2e/Tonne` | 0.1 | Non spécifié |
| 66 | Cuivre - Recyclé | 1341.3 | `kgCO2e/Tonne` | 0.1 | Non spécifié |
| ... | *(51 autres facteurs extraits)* | ... | ... | ... | ... |

### P10-S3.Immobilisations de biens (42 facteurs candidats identifiés)
| Ligne | Libellé original | Valeur | Unité | Incertitude | Source déclarée |
|---|---|---|---|---|---|
| 44 | Appareil photo compact | 24.4 | `kgCO2e/appareil` | 0.5 | Base carbone |
| 45 | Appareil photo hybride | 29 | `kgCO2e/appareil` | 0.5 | Base carbone |
| 46 | Appareil photo reflex | 30.6 | `kgCO2e/appareil` | 0.5 | Base carbone |
| 47 | Baies de disques | 15.5 | `kgCO2e/appareil` | 0.8 | Base carbone |
| 48 | Bâtiment - Bureaux Béton | 469 | `kgCO2e/m²` | 0.5 | Base Carbone |
| 49 | Ecran | 678 | `kgCO2e/appareil` | 0.5 | Base Carbone |
| 50 | Ecran cathodique 17 pouce | 38 | `kgCO2e/appareil` | 0.5 | Base Carbone |
| 51 | Ecran LCD 17 pouce | 336 | `kgCO2e/appareil` | 1 | Base Carbone |
| ... | *(34 autres facteurs extraits)* | ... | ... | ... | ... |

### P11-S3- Déchets (18 facteurs candidats identifiés)
| Ligne | Libellé original | Valeur | Unité | Incertitude | Source déclarée |
|---|---|---|---|---|---|
| 40 | Papier et carton en fin de vie dans une décharge | 416.6 | `kgCO2e/Tonne` | 0.5 | Non spécifié |
| 41 | Compostage des déchets verts | 69.7 | `kgCO2e/tonne` | 0.2 | Non spécifié |
| 42 | Immobilisation et fonctionnement d'une décharge des déchets hors émissions de méthane-taille de la ville 10000 hab | 26.82 | `kgCO2e/t déchets enfouis` | 0.5 | Non spécifié |
| 43 | Immobilisation et fonctionnement d'une décharge des déchets hors émissions de méthane-taille de la ville 70000 hab | 3.8 | `kgCO2e/t déchets enfouis` | 0.5 | Non spécifié |
| 44 | Immobilisation et fonctionnement d'une décharge des déchets hors émissions de méthane-taille de la ville  120000 hab | 2.37 | `kgCO2e/t déchets enfouis` | 0.5 | Non spécifié |
| 45 | Immobilisation et fonctionnement d'une décharge des déchets hors émissions de méthane-taille de la ville  500000 hab | 1.06 | `kgCO2e/t déchets enfouis` | 0.5 | Non spécifié |
| 46 | Immobilisation et fonctionnement d'une décharge des déchets hors émissions de méthane-taille de la ville  800000 hab | 0.92 | `kgCO2e/t déchets enfouis` | 0.5 | Non spécifié |
| 47 | Immobilisation et fonctionnement d'une décharge des déchets hors émissions de méthane-taille de la ville  5700000 hab | 0.76 | `kgCO2e/t déchets enfouis` | 0.5 | Non spécifié |
| ... | *(10 autres facteurs extraits)* | ... | ... | ... | ... |

### P17-S3-Transport march.aval (75 facteurs candidats identifiés)
| Ligne | Libellé original | Valeur | Unité | Incertitude | Source déclarée |
|---|---|---|---|---|---|
| 93 | Benne 14 tonnes, amont et combustion | 0.115 | `kgCO2e/tonne.km` | 0.1 | FM6E |
| 94 | Benne 19 tonnes, amont et combustion | 0.088 | `kgCO2e/tonne.km` | 0.1 | FM6E |
| 95 | Benne 26 tonnes, amont et combustion | 0.072 | `kgCO2e/tonne.km` | 0.1 | FM6E |
| 96 | Benne 38 tonnes et plus, amont et combustion | 0.053 | `kgCO2e/tonne.km` | 0.1 | FM6E |
| 97 | Benne 5,5 tonnes, amont et combustion | 0.265 | `kgCO2e/tonne.km` | 0.1 | FM6E |
| 98 | Benne 8 tonnes, amont et combustion | 0.168 | `kgCO2e/tonne.km` | 0.1 | FM6E |
| 99 | Citerne 19 tonnes, amont et combustion | 0.076 | `kgCO2e/tonne.km` | 0.1 | FM6E |
| 100 | Citerne 26 tonnes, amont et combustion | 0.06 | `kgCO2e/tonne.km` | 0.1 | FM6E |
| ... | *(67 autres facteurs extraits)* | ... | ... | ... | ... |

### P22-S3-Trajet dom.Travail.Empl. (65 facteurs candidats identifiés)
| Ligne | Libellé original | Valeur | Unité | Incertitude | Source déclarée |
|---|---|---|---|---|---|
| 142 | Moto>50cc | 0.1166 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 143 | Particulier véhicule au gasoil | 0.1174 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 144 | particulier véhicule à l'essence | 0.117 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 145 | Grand taxi | 0.0542 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 146 | Petit taxi essence | 0.1444 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 147 | Petit taxi gasoil | 0.1355 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 148 | Moto<50cc | 0.0583 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 149 | Autocar et bus | 0.026 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| ... | *(57 autres facteurs extraits)* | ... | ... | ... | ... |

### P16-S3-Trans.Client.Visit (65 facteurs candidats identifiés)
| Ligne | Libellé original | Valeur | Unité | Incertitude | Source déclarée |
|---|---|---|---|---|---|
| 142 | Moto>50cc | 0.1166 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 143 | Particulier véhicule au gasoil | 0.1174 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 144 | particulier véhicule à l'essence | 0.117 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 145 | Grand taxi | 0.0542 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 146 | Petit taxi essence | 0.1444 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 147 | Petit taxi gasoil | 0.1355 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 148 | Moto<50cc | 0.0583 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 149 | Autocar et bus | 0.026 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| ... | *(57 autres facteurs extraits)* | ... | ... | ... | ... |

### P13-S3-Transp. Professionnels (65 facteurs candidats identifiés)
| Ligne | Libellé original | Valeur | Unité | Incertitude | Source déclarée |
|---|---|---|---|---|---|
| 142 | Moto>50cc | 0.1166 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 143 | Particulier véhicule au gasoil | 0.1174 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 144 | particulier véhicule à l'essence | 0.117 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 145 | Grand taxi | 0.0542 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 146 | Petit taxi essence | 0.1444 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 147 | Petit taxi gasoil | 0.1355 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 148 | Moto<50cc | 0.0583 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| 149 | Autocar et bus | 0.026 | `kgCO2e / (passager.km)` | 0.5 | FM6E |
| ... | *(57 autres facteurs extraits)* | ... | ... | ... | ... |

### P12-S3-Trans.March.amont (75 facteurs candidats identifiés)
| Ligne | Libellé original | Valeur | Unité | Incertitude | Source déclarée |
|---|---|---|---|---|---|
| 93 | Benne 14 tonnes, amont et combustion | 0.115 | `kgCO2e/tonne.km` | 0.1 | FM6E |
| 94 | Benne 19 tonnes, amont et combustion | 0.088 | `kgCO2e/tonne.km` | 0.1 | FM6E |
| 95 | Benne 26 tonnes, amont et combustion | 0.072 | `kgCO2e/tonne.km` | 0.1 | FM6E |
| 96 | Benne 38 tonnes et plus, amont et combustion | 0.053 | `kgCO2e/tonne.km` | 0.1 | FM6E |
| 97 | Benne 5,5 tonnes, amont et combustion | 0.265 | `kgCO2e/tonne.km` | 0.1 | FM6E |
| 98 | Benne 8 tonnes, amont et combustion | 0.168 | `kgCO2e/tonne.km` | 0.1 | FM6E |
| 99 | Citerne 19 tonnes, amont et combustion | 0.076 | `kgCO2e/tonne.km` | 0.1 | FM6E |
| 100 | Citerne 26 tonnes, amont et combustion | 0.06 | `kgCO2e/tonne.km` | 0.1 | FM6E |
| ... | *(67 autres facteurs extraits)* | ... | ... | ... | ... |

### P18-S3-Util. prod.vendus (0 facteurs candidats identifiés)
*Aucun facteur numérique direct dans ce poste (modèle vide ou références rompues).*

### P19-S3-Fin vie prod.vendus (0 facteurs candidats identifiés)
*Aucun facteur numérique direct dans ce poste (modèle vide ou références rompues).*

### P20-S3-Franchise aval (0 facteurs candidats identifiés)
*Aucun facteur numérique direct dans ce poste (modèle vide ou références rompues).*

### P14-S3-Actifs en Leasing amont (0 facteurs candidats identifiés)
*Aucun facteur numérique direct dans ce poste (modèle vide ou références rompues).*

### P21-S3-Actifs loués en aval (0 facteurs candidats identifiés)
*Aucun facteur numérique direct dans ce poste (modèle vide ou références rompues).*

### P23-S3-Aut.émiss.non inclus. (0 facteurs candidats identifiés)
*Aucun facteur numérique direct dans ce poste (modèle vide ou références rompues).*

### P15-S3-Investissements (0 facteurs candidats identifiés)
*Aucun facteur numérique direct dans ce poste (modèle vide ou références rompues).*

---

## 5. Mapping méthodologique : Postes historiques <-> ISO 14064-1 <-> GHG Protocol

| Poste historique | Libellé | Scope GHG Protocol | Catégorie ISO 14064-1:2018 | Catégorie Scope 3 GHG | Statut dans classeur |
|---|---|---|---|---|---|
| P1 | Sources fixes de combustion | Scope 1 | Catégorie 1 (Émissions directes) | N/A | Facteurs amont+combustion à décomposer |
| P2 | Sources mobiles de combustion | Scope 1 | Catégorie 1 (Émissions directes) | N/A | Opérationnel (8 facteurs) |
| P3 | Procédés hors énergie | Scope 1 | Catégorie 1 (Émissions directes) | N/A | Partiel (12 facteurs ciment/chaux/STEP) |
| P4 | Émissions fugitives climatisation | Scope 1 | Catégorie 1 (Émissions directes) | N/A | 100 facteurs fluides |
| P5 | Biomasse (UTCATF / Sols et forêts) | Scope 1 / Hors-Scope | Catégorie 1 / Séquestration | N/A | 46 facteurs agricoles |
| P6 | Consommation d'électricité | Scope 2 | Catégorie 2 (Émissions indirectes énergie) | N/A | Mix 2020 historique (0,6426 net / 0,721 brut) |
| P7 | Vapeur, chaleur, froid achetés | Scope 2 | Catégorie 2 (Émissions indirectes énergie) | N/A | Modèle avec formules #REF! |
| P8 | Énergie amont non incluse P1 & P7 | Scope 3 | Catégorie 3 (Transport) / Cat 4 (Produits utilisés) | Cat 3 : Combustibles et énergie | Modèle avec formules #REF! |
| P9 | Achats de produits et services | Scope 3 | Catégorie 4 (Produits utilisés par organisation) | Cat 1 : Biens et services achetés | 59 facteurs physiques et monétaires |
| P10 | Immobilisations de biens | Scope 3 | Catégorie 4 (Produits utilisés par organisation) | Cat 2 : Biens d'équipement | 42 facteurs matériels / équipements |
| P11 | Déchets | Scope 3 | Catégorie 4 (Produits utilisés par organisation) | Cat 5 : Déchets générés dans les opérations | 18 facteurs traitement déchets |
| P12 | Transport de marchandises amont | Scope 3 | Catégorie 3 (Émissions indirectes transport) | Cat 4 : Transport et distribution amont | 75 facteurs tonne-km |
| P13 | Déplacements professionnels | Scope 3 | Catégorie 3 (Émissions indirectes transport) | Cat 6 : Déplacements professionnels | 65 facteurs passager-km |
| P14 | Actifs en leasing amont | Scope 3 | Catégorie 4 (Produits utilisés par organisation) | Cat 8 : Actifs loués en amont | Gabarit copié avec #REF! |
| P15 | Investissements | Scope 3 | Catégorie 5 (Autres sources associées) | Cat 15 : Investissements | Gabarit copié avec #REF! |
| P16 | Transport visiteurs et clients | Scope 3 | Catégorie 3 (Émissions indirectes transport) | Cat 9 : Transport et distribution aval | 65 facteurs passager-km |
| P17 | Transport de marchandises aval | Scope 3 | Catégorie 3 (Émissions indirectes transport) | Cat 9 : Transport et distribution aval | 75 facteurs tonne-km |
| P18 | Utilisation des produits vendus | Scope 3 | Catégorie 5 (Émissions indirectes produits) | Cat 11 : Utilisation des produits vendus | Gabarit copié avec #REF! |
| P19 | Fin de vie des produits vendus | Scope 3 | Catégorie 5 (Émissions indirectes produits) | Cat 12 : Fin de vie des produits vendus | Gabarit copié avec #REF! |
| P20 | Franchises aval | Scope 3 | Catégorie 5 (Émissions indirectes produits) | Cat 14 : Franchises | Gabarit copié avec #REF! |
| P21 | Actifs loués en aval | Scope 3 | Catégorie 5 (Émissions indirectes produits) | Cat 13 : Actifs loués en aval | Gabarit copié avec #REF! |
| P22 | Déplacements domicile-travail | Scope 3 | Catégorie 3 (Émissions indirectes transport) | Cat 7 : Déplacements domicile-travail | 65 facteurs passager-km |
| P23 | Autres émissions indirectes | Scope 3 | Catégorie 6 (Autres émissions) | Catégories résiduelles | Gabarit copié avec #REF! |

---

## 6. Pipeline d'importation et de gouvernance des facteurs

Pour garantir la conformité méthodologique et l'intégrité juridique :
1. **Étape 1 — Extraction brute :** Sauvegarde immuable de chaque ligne extraite avec provenance exacte (feuille, ligne, colonne, valeur brute, unité brute, texte source).
2. **Étape 2 — Normalisation proposée :** Conversion des unités en SI normalisé (kgCO2e/kWh, kgCO2e/tonne, kgCO2e/litre, kgCO2e/passager-km, kgCO2e/t.km), détection des ambiguïtés « amont + combustion », attribution d'un code unique.
3. **Étape 3 — Revue et qualification :** Marquage en statut `extracted` (brut), `to_verify` (nécessite validation), `validated` (approuvé pour calcul officiel), `rejected` ou `archived`.
4. **Étape 4 — Publication au catalogue :** Seuls les facteurs avec statut `validated` peuvent être sélectionnés pour clôturer un bilan GES officiel. Les facteurs `to_verify` génèrent une mention d'avertissement 'calcul provisoire'.