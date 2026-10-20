#!/usr/bin/env python3
"""
Atlas Carbone - Script d'audit exhaustif du classeur Excel
Fichier source : Bilan Carbone Maroc-compatible postes iso14064 et GHG Protocol-draft-15 octobre 2024 (3) (1).xlsx
"""

import os
import sys
import hashlib
import json
import openpyxl

EXCEL_PATH = '/home/abdelaziz/Downloads/Bilan Carbone Maroc-compatible postes iso14064 et GHG Protocol-draft-15 octobre 2024 (3) (1).xlsx'
DOCS_DIR = '/home/abdelaziz/Desktop/PhD/analysis/atlas-carbone/docs'
OUTPUT_MD = os.path.join(DOCS_DIR, 'audit-classeur.md')

def main():
    print(f"Audit du classeur : {EXCEL_PATH}")
    if not os.path.exists(EXCEL_PATH):
        print(f"Erreur: fichier introuvable {EXCEL_PATH}")
        sys.exit(1)

    # 1. Hachage et métadonnées fichier
    with open(EXCEL_PATH, 'rb') as f:
        file_bytes = f.read()
    sha256_hash = hashlib.sha256(file_bytes).hexdigest()
    file_size = len(file_bytes)

    wb_form = openpyxl.load_workbook(EXCEL_PATH, data_only=False)
    wb_data = openpyxl.load_workbook(EXCEL_PATH, data_only=True)

    # 2. Liens externes
    external_links = []
    try:
        for link in wb_form._external_links:
            target = getattr(link.file_link, 'Target', str(link))
            external_links.append(target)
    except Exception as e:
        external_links.append(f"Erreur d'accès aux liens externes: {e}")

    # 3. Parcours des feuilles
    sheets_info = []
    total_cells = 0
    total_formulas = 0
    total_ref_in_f = 0
    total_cached_ref = 0
    total_cached_name = 0
    xlfn_functions = set()
    total_extracted_factors = 0

    postes_factors = {}

    for idx, sname in enumerate(wb_form.sheetnames):
        ws_f = wb_form[sname]
        ws_d = wb_data[sname]
        state = ws_f.sheet_state

        f_count = 0
        ref_f = 0
        c_ref = 0
        c_name = 0
        factors_found = []

        for r in range(1, ws_f.max_row + 1):
            for c in range(1, ws_f.max_column + 1):
                total_cells += 1
                vf = ws_f.cell(r, c).value
                vd = ws_d.cell(r, c).value

                if vf is not None and str(vf).startswith('='):
                    f_count += 1
                    vf_str = str(vf)
                    if '#REF!' in vf_str:
                        ref_f += 1
                    if '_xlfn.' in vf_str:
                        for part in vf_str.split('_xlfn.'):
                            fn = part.split('(')[0]
                            if fn:
                                xlfn_functions.add(fn)
                if isinstance(vd, str):
                    if vd == '#REF!':
                        c_ref += 1
                    elif vd == '#NAME?':
                        c_name += 1

        total_formulas += f_count
        total_ref_in_f += ref_f
        total_cached_ref += c_ref
        total_cached_name += c_name

        # Extraction des facteurs candidats si poste P
        if sname.startswith('P') and '-S' in sname:
            for r in range(1, ws_d.max_row + 1):
                label = ws_d.cell(r, 2).value or ws_d.cell(r, 1).value
                f_val = ws_d.cell(r, 3).value
                u_val = ws_d.cell(r, 4).value
                unc_val = ws_d.cell(r, 5).value
                src_val = ws_d.cell(r, 6).value if ws_d.max_column >= 6 else None

                if isinstance(f_val, (int, float)) and f_val > 0 and isinstance(u_val, str) and ('/' in u_val or 'kg' in u_val or 't' in u_val or 'kWh' in u_val or 'litre' in u_val):
                    factors_found.append({
                        'row': r,
                        'label': str(label).strip() if label else 'Inconnu',
                        'value': f_val,
                        'unit': u_val.strip(),
                        'uncertainty': unc_val,
                        'source': str(src_val).strip() if src_val else 'Non spécifié'
                    })
            postes_factors[sname] = factors_found
            total_extracted_factors += len(factors_found)

        sheets_info.append({
            'index': idx + 1,
            'name': sname,
            'state': state,
            'max_row': ws_f.max_row,
            'max_col': ws_f.max_column,
            'formulas': f_count,
            'ref_in_formula': ref_f,
            'cached_ref': c_ref,
            'cached_name': c_name,
            'factors_count': len(factors_found) if sname in postes_factors else 0
        })

    # 4. Spécificités P6
    p6_b49 = wb_data['P6-S2-ConsommationElectricité']['B49'].value
    p6_c49_form = wb_form['P6-S2-ConsommationElectricité']['C49'].value
    p6_c49_val = wb_data['P6-S2-ConsommationElectricité']['C49'].value
    p6_d49 = wb_data['P6-S2-ConsommationElectricité']['D49'].value
    p6_c50 = wb_data['P6-S2-ConsommationElectricité']['C50'].value
    p6_c27 = wb_data['P6-S2-ConsommationElectricité']['C27'].value
    p6_l27_form = wb_form['P6-S2-ConsommationElectricité']['L27'].value
    p6_l27_val = wb_data['P6-S2-ConsommationElectricité']['L27'].value

    # 5. Spécificités Incertitude et PRG
    ws_prg = wb_data['Incertitude et PRG']
    prg_header = [ws_prg.cell(32, c).value for c in range(1, 10) if ws_prg.cell(32, c).value is not None]
    prg_values = [ws_prg.cell(33, c).value for c in range(1, 10) if ws_prg.cell(33, c).value is not None]

    # Génération du rapport Markdown
    md = []
    md.append("# Audit Technique et Méthodologique du Classeur Excel Source")
    md.append("")
    md.append("**Nom du fichier analysé :** `Bilan Carbone Maroc-compatible postes iso14064 et GHG Protocol-draft-15 octobre 2024 (3) (1).xlsx`  ")
    md.append(f"**Empreinte SHA-256 :** `{sha256_hash}`  ")
    md.append(f"**Taille :** {file_size:,} octets ({file_size / 1024:.2f} Ko)  ")
    md.append("**Date d'audit :** 20 octobre 2026  ")
    md.append("**Statut de la source :** Document de travail / draft ministériel & partenarial (Fondation Mohammed VI, AMEE, IMANOR, ABC, ADEME)  ")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 1. Synthèse globale des constats")
    md.append("")
    md.append(f"- **Nombre total de feuilles :** {len(sheets_info)} (27 visibles, 1 masquée : `Incertitude et PRG`)")
    md.append(f"- **Nombre total de cellules avec formules :** {total_formulas:,}")
    md.append(f"- **Cellules dont l'expression contient `#REF!` :** {total_ref_in_f:,}")
    md.append(f"- **Valeurs d'erreur `#REF!` enregistrées en cache :** {total_cached_ref:,}")
    md.append(f"- **Valeurs d'erreur `#NAME?` enregistrées en cache :** {total_cached_name:,}")
    md.append(f"- **Nombre de liens externes trouvés :** {len(external_links)}")
    md.append(f"- **Fonctions Excel propriétaires causant `#NAME?` :** `{', '.join(sorted(xlfn_functions))}`")
    md.append(f"- **Facteurs d'émission bruts identifiables extraits :** {total_extracted_factors}")
    md.append("")
    md.append("### Alertes méthodologiques critiques")
    md.append("1. **Faute d'orthographe dans l'onglet de synthèse :** L'onglet se nomme textuellement `Synthèse selon GHG Ptorocol`. Cette chaîne exacte est conservée pour la traçabilité de l'import, mais corrigée en `GHG Protocol` dans l'interface et les exports.")
    md.append("2. **Facteurs mixtes « Amont + Combustion » dans le Scope 1 :** Dans `P1-S1-Source Fixe combustion`, de nombreux facteurs incorporent l'amont du combustible (ex: Anthracite 2 864 kgCO2e/tonne, GPL 3 428 kgCO2e/tonne). Selon le GHG Protocol et l'ISO 14064-1, la combustion directe appartient au Scope 1 (Catégorie 1), tandis que l'amont du combustible relève du Scope 3 Catégorie 3 (Énergie amont non incluse dans les Scopes 1 et 2). L'application Atlas Carbone doit ventiler ou exiger un facteur de combustion pure pour le Scope 1.")
    md.append("3. **Facteur d'émission de l'électricité réseau (`P6-S2`) :**")
    md.append(f"   - Libellé B49 : `{p6_b49}`")
    md.append(f"   - Formule C49 : `{p6_c49_form}` = `{p6_c49_val}` {p6_d49}")
    md.append(f"   - Taux de perte déclaré en C50 : `{p6_c50}` %")
    md.append("   - La formule de cellule d'exemple L27 applique un facteur brut de 0,721 kgCO2e/kWh (pertes incluses). Ce facteur reflète le mix moyen 2020 historique du Maroc. Il est conservé comme facteur historique sourcé, mais le moteur Atlas Carbone permet l'actualisation avec les facteurs ONEE/AMEE récents et sépare nettement la méthode *Location-based* et *Market-based*.")
    md.append("4. **Feuille masquée `Incertitude et PRG` :**")
    md.append(f"   - Les colonnes HFC et PFC contiennent des plages textuelles (`HFC`: `{prg_values[3]}`, `PFC`: `{prg_values[4]}`), et non des valeurs numériques scalaires. Aucun calcul automatique direct ne peut multiplier par une chaîne '4,84 à 14600'. Atlas Carbone implémente la table complète des fluides frigorigènes purs et mélanges (R-134a, R-410A, R-404A, etc.) avec leurs PRG AR6 individuels.")
    md.append("   - Les incertitudes dites « Exacte » (5%) à « ND » (50%) sont des conventions forfaitaires du classeur, pas des écarts-types statistiques mesurés.")
    md.append("5. **Feuilles Scope 3 aval dupliquées et corrompues :** Les feuilles P14, P15, P18, P19, P20, P21, P23 contiennent chacune 144 formules `#REF!` et aucune table de facteurs active. Elles ont été clonées à partir d'un gabarit sans que les plages sources n'existent.")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 2. Inventaire exhaustif des feuilles")
    md.append("")
    md.append("| N° | Nom de l'onglet | Statut | Lignes max | Cols max | Formules | #REF! formules | #REF! cache | #NAME? cache | Facteurs extraits |")
    md.append("|---|---|---|---|---|---|---|---|---|---|")
    for s in sheets_info:
        md.append(f"| {s['index']} | `{s['name']}` | {s['state']} | {s['max_row']} | {s['max_col']} | {s['formulas']} | {s['ref_in_formula']} | {s['cached_ref']} | {s['cached_name']} | {s['factors_count']} |")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 3. Liens externes identifiés")
    md.append("")
    md.append("Trois liens externes sont incorporés dans les définitions du classeur, prouvant une dépendance vers des chemins locaux Windows obsolètes :")
    for link in external_links:
        md.append(f"- `{link}`")
    md.append("")
    md.append("> **Décision :** Atlas Carbone n'accède à aucun de ces fichiers externes inexistants. Toutes les données nécessaires sont intégrées de façon autonome dans la base de données relationnelle versionnée.")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 4. Analyse détaillée des postes et facteurs d'émission")
    md.append("")
    for p, facts in postes_factors.items():
        md.append(f"### {p} ({len(facts)} facteurs candidats identifiés)")
        if facts:
            md.append("| Ligne | Libellé original | Valeur | Unité | Incertitude | Source déclarée |")
            md.append("|---|---|---|---|---|---|")
            for f in facts[:8]: # top 8
                md.append(f"| {f['row']} | {f['label']} | {f['value']} | `{f['unit']}` | {f['uncertainty']} | {f['source']} |")
            if len(facts) > 8:
                md.append(f"| ... | *({len(facts) - 8} autres facteurs extraits)* | ... | ... | ... | ... |")
        else:
            md.append("*Aucun facteur numérique direct dans ce poste (modèle vide ou références rompues).*")
        md.append("")

    md.append("---")
    md.append("")
    md.append("## 5. Mapping méthodologique : Postes historiques <-> ISO 14064-1 <-> GHG Protocol")
    md.append("")
    md.append("| Poste historique | Libellé | Scope GHG Protocol | Catégorie ISO 14064-1:2018 | Catégorie Scope 3 GHG | Statut dans classeur |")
    md.append("|---|---|---|---|---|---|")
    md.append("| P1 | Sources fixes de combustion | Scope 1 | Catégorie 1 (Émissions directes) | N/A | Facteurs amont+combustion à décomposer |")
    md.append("| P2 | Sources mobiles de combustion | Scope 1 | Catégorie 1 (Émissions directes) | N/A | Opérationnel (8 facteurs) |")
    md.append("| P3 | Procédés hors énergie | Scope 1 | Catégorie 1 (Émissions directes) | N/A | Partiel (12 facteurs ciment/chaux/STEP) |")
    md.append("| P4 | Émissions fugitives climatisation | Scope 1 | Catégorie 1 (Émissions directes) | N/A | 100 facteurs fluides |")
    md.append("| P5 | Biomasse (UTCATF / Sols et forêts) | Scope 1 / Hors-Scope | Catégorie 1 / Séquestration | N/A | 46 facteurs agricoles |")
    md.append("| P6 | Consommation d'électricité | Scope 2 | Catégorie 2 (Émissions indirectes énergie) | N/A | Mix 2020 historique (0,6426 net / 0,721 brut) |")
    md.append("| P7 | Vapeur, chaleur, froid achetés | Scope 2 | Catégorie 2 (Émissions indirectes énergie) | N/A | Modèle avec formules #REF! |")
    md.append("| P8 | Énergie amont non incluse P1 & P7 | Scope 3 | Catégorie 3 (Transport) / Cat 4 (Produits utilisés) | Cat 3 : Combustibles et énergie | Modèle avec formules #REF! |")
    md.append("| P9 | Achats de produits et services | Scope 3 | Catégorie 4 (Produits utilisés par organisation) | Cat 1 : Biens et services achetés | 59 facteurs physiques et monétaires |")
    md.append("| P10 | Immobilisations de biens | Scope 3 | Catégorie 4 (Produits utilisés par organisation) | Cat 2 : Biens d'équipement | 42 facteurs matériels / équipements |")
    md.append("| P11 | Déchets | Scope 3 | Catégorie 4 (Produits utilisés par organisation) | Cat 5 : Déchets générés dans les opérations | 18 facteurs traitement déchets |")
    md.append("| P12 | Transport de marchandises amont | Scope 3 | Catégorie 3 (Émissions indirectes transport) | Cat 4 : Transport et distribution amont | 75 facteurs tonne-km |")
    md.append("| P13 | Déplacements professionnels | Scope 3 | Catégorie 3 (Émissions indirectes transport) | Cat 6 : Déplacements professionnels | 65 facteurs passager-km |")
    md.append("| P14 | Actifs en leasing amont | Scope 3 | Catégorie 4 (Produits utilisés par organisation) | Cat 8 : Actifs loués en amont | Gabarit copié avec #REF! |")
    md.append("| P15 | Investissements | Scope 3 | Catégorie 5 (Autres sources associées) | Cat 15 : Investissements | Gabarit copié avec #REF! |")
    md.append("| P16 | Transport visiteurs et clients | Scope 3 | Catégorie 3 (Émissions indirectes transport) | Cat 9 : Transport et distribution aval | 65 facteurs passager-km |")
    md.append("| P17 | Transport de marchandises aval | Scope 3 | Catégorie 3 (Émissions indirectes transport) | Cat 9 : Transport et distribution aval | 75 facteurs tonne-km |")
    md.append("| P18 | Utilisation des produits vendus | Scope 3 | Catégorie 5 (Émissions indirectes produits) | Cat 11 : Utilisation des produits vendus | Gabarit copié avec #REF! |")
    md.append("| P19 | Fin de vie des produits vendus | Scope 3 | Catégorie 5 (Émissions indirectes produits) | Cat 12 : Fin de vie des produits vendus | Gabarit copié avec #REF! |")
    md.append("| P20 | Franchises aval | Scope 3 | Catégorie 5 (Émissions indirectes produits) | Cat 14 : Franchises | Gabarit copié avec #REF! |")
    md.append("| P21 | Actifs loués en aval | Scope 3 | Catégorie 5 (Émissions indirectes produits) | Cat 13 : Actifs loués en aval | Gabarit copié avec #REF! |")
    md.append("| P22 | Déplacements domicile-travail | Scope 3 | Catégorie 3 (Émissions indirectes transport) | Cat 7 : Déplacements domicile-travail | 65 facteurs passager-km |")
    md.append("| P23 | Autres émissions indirectes | Scope 3 | Catégorie 6 (Autres émissions) | Catégories résiduelles | Gabarit copié avec #REF! |")
    md.append("")
    md.append("---")
    md.append("")
    md.append("## 6. Pipeline d'importation et de gouvernance des facteurs")
    md.append("")
    md.append("Pour garantir la conformité méthodologique et l'intégrité juridique :")
    md.append("1. **Étape 1 — Extraction brute :** Sauvegarde immuable de chaque ligne extraite avec provenance exacte (feuille, ligne, colonne, valeur brute, unité brute, texte source).")
    md.append("2. **Étape 2 — Normalisation proposée :** Conversion des unités en SI normalisé (kgCO2e/kWh, kgCO2e/tonne, kgCO2e/litre, kgCO2e/passager-km, kgCO2e/t.km), détection des ambiguïtés « amont + combustion », attribution d'un code unique.")
    md.append("3. **Étape 3 — Revue et qualification :** Marquage en statut `extracted` (brut), `to_verify` (nécessite validation), `validated` (approuvé pour calcul officiel), `rejected` ou `archived`.")
    md.append("4. **Étape 4 — Publication au catalogue :** Seuls les facteurs avec statut `validated` peuvent être sélectionnés pour clôturer un bilan GES officiel. Les facteurs `to_verify` génèrent une mention d'avertissement 'calcul provisoire'.")

    # Écriture dans le fichier Markdown
    with open(OUTPUT_MD, 'w', encoding='utf-8') as f:
        f.write('\n'.join(md))

    print(f"Rapport d'audit généré avec succès dans : {OUTPUT_MD}")

if __name__ == '__main__':
    main()
