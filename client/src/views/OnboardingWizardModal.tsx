/**
 * Atlas Carbone - Assistant d'Onboarding Guidé en 10 Étapes
 * Conforme au parcours client de zéro à un premier bilan (Prompt Maître Section 9)
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  ArrowLeft,
  X,
  Building2,
  Calendar,
  Layers,
  FileCheck,
  Users,
  Database,
  AlertCircle,
  Lock,
  Download,
  Sparkles
} from 'lucide-react';
import { api } from '../api.js';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  orgName: string;
  orgId?: string;
  initialStep?: number;
  onStepChange?: (step: number) => void;
}

const ONBOARDING_STEPS = [
  {
    step: 1,
    title: "1. Créer le compte et l'entreprise",
    desc: "Raison sociale, forme juridique (SARL/SA), ICE marocain, ville du siège, secteur d'activité.",
    icon: Building2,
    actionView: 'overview',
    actionText: "Vérifier la fiche entreprise"
  },
  {
    step: 2,
    title: "2. Définir l'exercice & le périmètre",
    desc: "Choix de l'année de référence, dates début/fin et critère de consolidation (contrôle opérationnel ou financier).",
    icon: Calendar,
    actionView: 'overview',
    actionText: "Configurer l'exercice"
  },
  {
    step: 3,
    title: "3. Créer les sites opérationnels",
    desc: "Déclaration des usines, entrepôts, agences et bureaux, avec affectation des responsables de site.",
    icon: Layers,
    actionView: 'activities',
    actionText: "Voir les sites déclarés"
  },
  {
    step: 4,
    title: "4. Questionnaire d'applicabilité des postes",
    desc: "Identification des postes pertinents (combustion, procédés, fluides, électricité, achats, fret) et justification des exclusions.",
    icon: FileCheck,
    actionView: 'factors',
    actionText: "Consulter les catégories"
  },
  {
    step: 5,
    title: "5. Liste des données à collecter",
    desc: "Inventaire des pièces à rassembler : factures ONEE/RAMSA/Lydec, cartes carburant, relevés compteurs, bordereaux de pesée.",
    icon: Database,
    actionView: 'activities',
    actionText: "Préparer la collecte"
  },
  {
    step: 6,
    title: "6. Affecter les tâches aux collaborateurs",
    desc: "Délégation de la saisie aux responsables de site et contributeurs locaux avec échéances de transmission.",
    icon: Users,
    actionView: 'activities',
    actionText: "Gérer l'équipe"
  },
  {
    step: 7,
    title: "7. Saisir ou importer les données",
    desc: "Saisie unitaire assistée ou import par fichier CSV/Excel avec calcul déterministe immédiat et sélection des facteurs.",
    icon: Sparkles,
    actionView: 'activities',
    actionText: "Accéder à la saisie"
  },
  {
    step: 8,
    title: "8. Corriger les anomalies & exclusions",
    desc: "Contrôle des unités (kWh, litres, tonnes), vérification des facteurs provisoires et détection d'éventuels doublons.",
    icon: AlertCircle,
    actionView: 'activities',
    actionText: "Vérifier les données"
  },
  {
    step: 9,
    title: "9. Révision & Clôture de l'inventaire",
    desc: "Revue par le responsable carbone et gel de l'inventaire sous forme de snapshot immuable certifiable.",
    icon: Lock,
    actionView: 'overview',
    actionText: "Clôturer le bilan"
  },
  {
    step: 10,
    title: "10. Télécharger le rapport & plan d'action",
    desc: "Édition du rapport BEGES/ISO 14064 officiel, export des données et modélisation du plan de décarbonation.",
    icon: Download,
    actionView: 'report',
    actionText: "Éditer le rapport officiel"
  }
];

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  orgName,
  orgId,
  initialStep = 1,
  onStepChange
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(Math.max(0, initialStep - 1));

  useEffect(() => {
    if (isOpen && orgId) {
      api.organizations.getOnboarding(orgId)
        .then(res => {
          if (res?.onboarding_step) {
            const idx = Math.min(Math.max(0, res.onboarding_step - 1), ONBOARDING_STEPS.length - 1);
            setCurrentStepIndex(idx);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, orgId]);

  const handleStepSelect = (idx: number) => {
    setCurrentStepIndex(idx);
    const stepNumber = idx + 1;
    if (orgId) {
      api.organizations.updateOnboarding(orgId, { step: stepNumber, completed: stepNumber >= 10 }).catch(console.error);
    }
    onStepChange?.(stepNumber);
  };

  if (!isOpen) return null;

  const currentStep = ONBOARDING_STEPS[currentStepIndex];
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-bold text-brand-800 uppercase tracking-wider">
              Parcours Guidé • Étape {currentStep.step} / 10
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              De Zéro à votre Premier Bilan Carbone
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre de progression des 10 étapes */}
        <div className="grid grid-cols-10 gap-1.5">
          {ONBOARDING_STEPS.map((s, idx) => (
            <div
              key={s.step}
              onClick={() => handleStepSelect(idx)}
              className={`h-2 rounded-full cursor-pointer transition ${
                idx === currentStepIndex
                  ? 'bg-brand-800 ring-2 ring-brand-300'
                  : idx < currentStepIndex
                  ? 'bg-emerald-500'
                  : 'bg-slate-200'
              }`}
              title={s.title}
            ></div>
          ))}
        </div>

        {/* Contenu de l'étape courante */}
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-800 text-white flex items-center justify-center font-bold">
              <Icon className="w-5 h-5 text-brand-200" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-base">{currentStep.title}</h4>
              <span className="text-xs text-slate-500">Entreprise : {orgName}</span>
            </div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">
            {currentStep.desc}
          </p>

          <div className="pt-2">
            <button
              onClick={() => {
                onNavigate(currentStep.actionView);
                onClose();
              }}
              className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-xl shadow transition flex items-center space-x-1.5"
            >
              <span>{currentStep.actionText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Pied de navigation précédent / suivant */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <button
            disabled={currentStepIndex === 0}
            onClick={() => handleStepSelect(currentStepIndex - 1)}
            className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition flex items-center space-x-1 disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Étape précédente</span>
          </button>

          <span className="text-xs text-slate-400 font-mono">
            Progression : {Math.round(((currentStepIndex + 1) / 10) * 100)}%
          </span>

          <button
            onClick={() => {
              if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
                handleStepSelect(currentStepIndex + 1);
              } else {
                onClose();
              }
            }}
            className="px-4 py-2 bg-brand-800 hover:bg-brand-900 text-white font-semibold text-xs rounded-xl shadow transition flex items-center space-x-1"
          >
            <span>{currentStepIndex === ONBOARDING_STEPS.length - 1 ? 'Terminer' : 'Étape suivante'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
