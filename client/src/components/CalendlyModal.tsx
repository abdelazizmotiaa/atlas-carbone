import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Sparkles, ExternalLink, Mail, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface CalendlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'fr' | 'en';
  prefill?: {
    name?: string;
    email?: string;
    company?: string;
  };
}

export const OFFICIAL_CALENDLY_URL = 'https://calendly.com/abdelaziz-motiaa/30min';
export const OFFICIAL_PHONE = '+212 671 581 167';
export const OFFICIAL_EMAIL = 'abdelaziz.motiaa@gmail.com';

export const CalendlyModal: React.FC<CalendlyModalProps> = ({
  isOpen,
  onClose,
  lang = 'fr',
  prefill
}) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIframeLoaded(false);
      setHasError(false);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Construction de l'URL Calendly avec paramètres de personnalisation
  const params = new URLSearchParams({
    hide_landing_page_details: '1',
    hide_gdpr_banner: '1',
    background_color: 'ffffff',
    text_color: '0f172a',
    primary_color: '047857'
  });

  if (prefill?.name) params.set('name', prefill.name);
  if (prefill?.email) params.set('email', prefill.email);

  const embedUrl = `${OFFICIAL_CALENDLY_URL}?${params.toString()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="px-5 py-4 sm:px-6 sm:py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Calendar className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {lang === 'en' ? 'Discovery Consultation — Carbon Footprint' : 'Consultation découverte — Bilan carbone'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider">
                  {lang === 'en' ? '100% Free' : '100% Gratuit'}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-300 mt-0.5">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>30 minutes</span>
                </span>
                <span>•</span>
                <span className="text-slate-300">
                  {lang === 'en' ? 'With Abdelaziz Motiaa (Environmental Engineer & PhD Researcher)' : 'Avec Abdelaziz Motiaa (Ingénieur Environnement & Doctorant UM6P)'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sous-bandeau de cadrage transparent */}
        <div className="px-5 py-2.5 sm:px-6 bg-emerald-50/70 border-b border-emerald-100 flex flex-wrap items-center justify-between text-xs text-emerald-950 gap-2 shrink-0">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              {lang === 'en'
                ? 'No commitment. We explore your company activity, energy bills and initial scope.'
                : 'Sans engagement. Analyse de votre activité, factures énergétiques et cadrage du premier périmètre.'}
            </span>
          </div>
          <a
            href={OFFICIAL_CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-emerald-800 hover:text-emerald-900 flex items-center space-x-1 underline"
          >
            <span>{lang === 'en' ? 'Open in new tab' : 'Ouvrir dans un nouvel onglet'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Corps : Iframe Calendly avec état de chargement */}
        <div className="relative flex-1 min-h-[460px] sm:min-h-[520px] bg-white overflow-hidden">
          {!iframeLoaded && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 p-6 text-center space-y-3 z-10">
              <div className="w-10 h-10 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-700">
                {lang === 'en' ? 'Loading booking calendar...' : 'Chargement du calendrier de rendez-vous...'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm">
                {lang === 'en'
                  ? 'If the calendar does not load, you can book directly on Calendly or contact us directly.'
                  : 'Si le calendrier met du temps à charger, vous pouvez réserver directement ou nous contacter par téléphone.'}
              </p>
            </div>
          )}

          {hasError ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                !
              </div>
              <h4 className="text-base font-bold text-slate-900">
                {lang === 'en' ? 'Direct booking option' : 'Réservation directe recommandée'}
              </h4>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                {lang === 'en'
                  ? 'Your browser settings may prevent loading embedded calendars. Click below to book directly.'
                  : 'Votre navigateur bloque le calendrier intégré. Cliquez ci-dessous pour ouvrir la page officielle de réservation.'}
              </p>
              <a
                href={OFFICIAL_CALENDLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-800 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-md"
              >
                <span>{lang === 'en' ? 'Book directly on Calendly' : 'Réserver directement sur Calendly'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              frameBorder="0"
              title="Calendly — Abdelaziz Motiaa"
              className="w-full h-full min-h-[480px] sm:min-h-[540px]"
              onLoad={() => setIframeLoaded(true)}
              onError={() => setHasError(true)}
            />
          )}
        </div>

        {/* Footer Contact direct de repli */}
        <div className="px-5 py-3 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2 shrink-0">
          <span className="font-medium text-slate-700">
            {lang === 'en' ? 'Prefer a direct contact right away?' : 'Besoin d’un contact immédiat ?'}
          </span>
          <div className="flex items-center space-x-4">
            <a
              href={`mailto:${OFFICIAL_EMAIL}`}
              className="hover:text-emerald-800 font-semibold flex items-center space-x-1"
            >
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{OFFICIAL_EMAIL}</span>
            </a>
            <a
              href={`tel:${OFFICIAL_PHONE.replace(/\s+/g, '')}`}
              className="hover:text-emerald-800 font-semibold flex items-center space-x-1"
            >
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>{OFFICIAL_PHONE}</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
