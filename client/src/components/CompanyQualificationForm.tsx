import React, { useState } from 'react';
import {
  Building2,
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Users,
  Target,
  FileQuestion,
  MessageSquare,
  Send,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { api } from '../api.js';

interface CompanyQualificationFormProps {
  lang?: 'fr' | 'en';
  onOpenCalendly: (prefill?: { name?: string; email?: string; company?: string }) => void;
}

export const CompanyQualificationForm: React.FC<CompanyQualificationFormProps> = ({
  lang = 'fr',
  onOpenCalendly
}) => {
  const [formData, setFormData] = useState({
    company: '',
    full_name: '',
    email: '',
    phone: '',
    sector: '',
    city: '',
    employee_count: '',
    has_existing_bilan: 'non',
    main_objective: 'Réaliser un premier bilan carbone',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sectorOptionsFr = [
    { value: 'Industrie exportatrice / Métallurgie / Ciment', label: 'Industrie exportatrice, Métallurgie, Ciment' },
    { value: 'Textile et habillement', label: 'Textile et habillement' },
    { value: 'Agroalimentaire et chaîne du froid', label: 'Agroalimentaire et chaîne du froid' },
    { value: 'Transport et logistique', label: 'Transport et logistique' },
    { value: 'Construction / BTP', label: 'Construction et BTP' },
    { value: 'Services, bureaux et laboratoires', label: 'Services, bureaux et laboratoires' },
    { value: 'Hôtellerie et restauration', label: 'Hôtellerie et restauration' },
    { value: 'Agriculture', label: 'Agriculture' },
    { value: 'Autre', label: 'Autre secteur' }
  ];

  const sectorOptionsEn = [
    { value: 'Industrie exportatrice / Métallurgie / Ciment', label: 'Export Industry, Metallurgy, Cement' },
    { value: 'Textile et habillement', label: 'Textile & Apparel' },
    { value: 'Agroalimentaire et chaîne du froid', label: 'Agri-food & Cold Chain' },
    { value: 'Transport et logistique', label: 'Transport & Logistics' },
    { value: 'Construction / BTP', label: 'Construction & Civil Engineering' },
    { value: 'Services, bureaux et laboratoires', label: 'Services, Offices & Labs' },
    { value: 'Hôtellerie et restauration', label: 'Hospitality & Catering' },
    { value: 'Agriculture', label: 'Agriculture' },
    { value: 'Autre', label: 'Other Sector' }
  ];

  const objectiveOptionsFr = [
    'Réaliser un premier bilan carbone',
    'Répondre à une demande d\'un client',
    'Mieux comprendre nos émissions',
    'Préparer un projet environnemental',
    'Autre'
  ];

  const objectiveOptionsEn = [
    'Carry out a first carbon footprint',
    'Respond to a customer / buyer request',
    'Better understand our GHG emissions',
    'Prepare an environmental project',
    'Other'
  ];

  const sectors = lang === 'en' ? sectorOptionsEn : sectorOptionsFr;
  const objectives = lang === 'en' ? objectiveOptionsEn : objectiveOptionsFr;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.company || !formData.full_name || !formData.email || !formData.phone || !formData.sector) {
      setErrorMessage(
        lang === 'en'
          ? 'Please complete all required fields.'
          : 'Veuillez renseigner tous les champs obligatoires (*).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.leads.submit({
        ...formData,
        utm_source: 'form_qualification_homepage'
      });
      setLeadId(res.leadId);
      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Une erreur est survenue lors de l’envoi. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookMeeting = () => {
    if (leadId) {
      api.leads.meetingBooked(leadId).catch(() => {});
    }
    onOpenCalendly({
      name: formData.full_name,
      email: formData.email,
      company: formData.company
    });
  };

  return (
    <div id="qualification-form" className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Header Formulaire */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-6 sm:p-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{lang === 'en' ? 'Quick Qualification • < 3 minutes' : 'Qualification Rapide • Rempli en moins de 3 minutes'}</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          {lang === 'en' ? 'Tell us about your company' : 'Parlez-nous de votre entreprise'}
        </h3>
        <p className="text-slate-300 text-sm mt-2 max-w-2xl leading-relaxed">
          {lang === 'en'
            ? 'Receive a clear initial assessment proposal tailored to your sector, starting from 10,000 MAD.'
            : 'Recevez une proposition d’accompagnement initial adaptée à votre secteur, à partir de 10 000 MAD.'}
        </p>
      </div>

      {submitted ? (
        /* État Succès avec Redirection Calendly Immédiate */
        <div className="p-8 sm:p-12 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h4 className="text-2xl font-black text-slate-900">
              {lang === 'en' ? 'Information received successfully!' : 'Votre demande a été bien enregistrée !'}
            </h4>
            <p className="text-slate-600 text-sm max-w-lg mx-auto">
              {lang === 'en'
                ? `Thank you ${formData.full_name}. A confirmation email has been sent to ${formData.email}. Abdelaziz Motiaa has been notified.`
                : `Merci ${formData.full_name}. Un accusé de réception a été envoyé à ${formData.email}. Le consultant Abdelaziz Motiaa a été notifié.`}
            </p>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-6 max-w-lg mx-auto text-left space-y-4">
            <div className="flex items-start space-x-3">
              <Calendar className="w-6 h-6 text-emerald-800 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-emerald-950 text-base">
                  {lang === 'en' ? 'Next step: Book your free 30-min call' : 'Étape suivante : Réservez votre créneau de 30 minutes'}
                </h5>
                <p className="text-xs text-emerald-900/80 mt-1">
                  {lang === 'en'
                    ? 'Lock a direct 30-minute exchange with Abdelaziz Motiaa to frame your scope.'
                    : 'Bloquez directement votre échange avec Abdelaziz Motiaa pour cadrer le périmètre de votre bilan.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleBookMeeting}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 border border-emerald-900"
            >
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>{lang === 'en' ? 'Choose my 30-min slot on Calendly' : 'Choisir mon créneau sur Calendly (30 min)'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-2 text-xs text-slate-500">
            <span>{lang === 'en' ? 'Or contact directly:' : 'Ou contactez directement :'} </span>
            <a href="mailto:abdelaziz.motiaa@gmail.com" className="font-bold text-emerald-800 underline">abdelaziz.motiaa@gmail.com</a>
            <span> • </span>
            <a href="tel:+212671581167" className="font-bold text-emerald-800 underline">+212 671 581 167</a>
          </div>
        </div>
      ) : (
        /* Formulaire Actif */
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Grille Champs Obligatoires */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nom Entreprise */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {lang === 'en' ? 'Company Name *' : 'Nom de l’entreprise *'}
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder={lang === 'en' ? 'e.g., Atlas Agro SARL' : 'Ex : Atlas Industries SA'}
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition"
                />
              </div>
            </div>

            {/* Nom Responsable */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {lang === 'en' ? 'Full Name & Title *' : 'Nom du responsable *'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder={lang === 'en' ? 'e.g., Karim Benjelloun (Managing Director)' : 'Ex : Karim Bennani (Directeur Général)'}
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition"
                />
              </div>
            </div>

            {/* Email Pro */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {lang === 'en' ? 'Professional Email *' : 'Email professionnel *'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="nom@entreprise.ma"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition"
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {lang === 'en' ? 'Phone / WhatsApp *' : 'Téléphone / WhatsApp *'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="+212 6XX XX XX XX"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition"
                />
              </div>
            </div>

            {/* Secteur d'activité */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {lang === 'en' ? 'Activity Sector *' : 'Secteur d’activité *'}
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <select
                  required
                  value={formData.sector}
                  onChange={e => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition bg-white"
                >
                  <option value="">{lang === 'en' ? 'Select your sector...' : 'Sélectionnez votre secteur...'}</option>
                  {sectors.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ville (Facultatif) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {lang === 'en' ? 'City (Optional)' : 'Ville (Facultatif)'}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Ex : Casablanca, Tanger, Rabat..."
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition"
                />
              </div>
            </div>

            {/* Nombre d'employés (Facultatif) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {lang === 'en' ? 'Approximate Employees (Optional)' : 'Nombre approximatif d’employés (Facultatif)'}
              </label>
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <select
                  value={formData.employee_count}
                  onChange={e => setFormData({ ...formData, employee_count: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition bg-white"
                >
                  <option value="">{lang === 'en' ? 'Select size...' : 'Taille de l’effectif...'}</option>
                  <option value="1-10">1 à 10 salariés</option>
                  <option value="11-50">11 à 50 salariés</option>
                  <option value="51-250">51 à 250 salariés</option>
                  <option value="250+">Plus de 250 salariés</option>
                </select>
              </div>
            </div>

            {/* A déjà réalisé un bilan carbone ? */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {lang === 'en' ? 'Have you already completed a carbon assessment?' : 'L’entreprise a-t-elle déjà réalisé un bilan carbone ?'}
              </label>
              <div className="relative">
                <FileQuestion className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <select
                  value={formData.has_existing_bilan}
                  onChange={e => setFormData({ ...formData, has_existing_bilan: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition bg-white"
                >
                  <option value="non">Non, premier bilan carbone</option>
                  <option value="oui">Oui, déjà réalisé par le passé</option>
                  <option value="je ne sais pas">Je ne sais pas</option>
                </select>
              </div>
            </div>

            {/* Objectif principal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {lang === 'en' ? 'Main Objective *' : 'Objectif principal *'}
              </label>
              <div className="relative">
                <Target className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <select
                  required
                  value={formData.main_objective}
                  onChange={e => setFormData({ ...formData, main_objective: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition bg-white"
                >
                  {objectives.map(obj => (
                    <option key={obj} value={obj}>{obj}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Message complémentaire (Facultatif) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {lang === 'en' ? 'Additional Message (Optional)' : 'Précisions complémentaires (Facultatif)'}
            </label>
            <div className="relative">
              <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <textarea
                rows={3}
                placeholder={
                  lang === 'en'
                    ? 'Tell us about your expectations, specific deadlines or questions...'
                    : 'Précisez votre besoin, vos échéances, ou toute question relative à vos factures ou périmètres...'
                }
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition"
              />
            </div>
          </div>

          {/* Mentions de confidentialité & Sécurité */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-2.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>
              {lang === 'en'
                ? 'Confidentiality commitment: your information will only be used to answer your inquiry by Abdelaziz Motiaa. No sensitive industrial data or invoices are requested at this stage.'
                : 'Engagement de confidentialité : vos coordonnées sont strictement utilisées par Abdelaziz Motiaa pour répondre à votre demande. Aucune donnée industrielle confidentielle ni facture n’est exigée à ce stade.'}
            </span>
          </div>

          {/* Bouton de Soumission */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-700">Prestation :</span> À partir de 10 000 MAD • Consultation 30 min gratuite
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 border border-emerald-900 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{lang === 'en' ? 'Sending...' : 'Envoi en cours...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-amber-300" />
                  <span>{lang === 'en' ? 'Submit and book my free call' : 'Envoyer et réserver mon échange gratuit'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
