import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Calendar,
  Phone,
  Mail,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  Edit2,
  RefreshCw,
  Download
} from 'lucide-react';
import { api } from '../api.js';

interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company: string;
  sector: string;
  city?: string;
  employee_count?: string;
  has_existing_bilan?: string;
  main_objective?: string;
  message?: string;
  status: string;
  notes?: string;
  meeting_booked: number;
  created_at: string;
}

export const AdminLeadsView: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const statuses = ['Nouveau', 'Contacté', 'Rendez-vous', 'Devis envoyé', 'Client', 'Clôturé'];

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const res = await api.leads.list();
      setLeads(res.leads || []);
      if (res.leads && res.leads.length > 0 && !selectedLead) {
        setSelectedLead(res.leads[0]);
        setEditStatus(res.leads[0].status);
        setEditNotes(res.leads[0].notes || '');
      }
    } catch (err) {
      console.error('Erreur chargement leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setEditStatus(lead.status);
    setEditNotes(lead.notes || '');
  };

  const handleSaveStatus = async () => {
    if (!selectedLead) return;
    setIsUpdating(true);
    try {
      await api.leads.updateStatus(selectedLead.id, editStatus, editNotes);
      setLeads(prev =>
        prev.map(l => (l.id === selectedLead.id ? { ...l, status: editStatus, notes: editNotes } : l))
      );
      setSelectedLead({ ...selectedLead, status: editStatus, notes: editNotes });
      alert('Statut du prospect mis à jour avec succès.');
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportCsv = () => {
    if (leads.length === 0) {
      alert("Aucune donnée d'entreprise à exporter.");
      return;
    }
    const headers = [
      'ID',
      'Date Inscription',
      'Entreprise',
      'Responsable',
      'Email',
      'Téléphone',
      'Ville',
      'Secteur Activité',
      'Taille Entreprise',
      'Bilan Existant',
      'Objectif Principal',
      'Statut CRM',
      'RDV Calendly Réservé',
      'Notes Internes'
    ];

    const rows = leads.map(l => [
      l.id,
      new Date(l.created_at).toLocaleDateString('fr-FR'),
      `"${(l.company || '').replace(/"/g, '""')}"`,
      `"${(l.full_name || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.city || '').replace(/"/g, '""')}"`,
      `"${(l.sector || '').replace(/"/g, '""')}"`,
      `"${(l.employee_count || '').replace(/"/g, '""')}"`,
      `"${(l.has_existing_bilan || '').replace(/"/g, '""')}"`,
      `"${(l.main_objective || '').replace(/"/g, '""')}"`,
      `"${(l.status || '').replace(/"/g, '""')}"`,
      l.meeting_booked ? 'Oui' : 'Non',
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `entreprises_et_leads_atlas_carbone_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch =
      l.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.city && l.city.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Nouveau':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Contacté':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Rendez-vous':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Devis envoyé':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Client':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      case 'Clôturé':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Pipeline Commercial & Entreprises Enregistrées
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Suivi des entreprises enregistrées, rendez-vous Calendly, cadrage des prestations et devis personnalisés
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 text-white hover:bg-emerald-700 text-xs font-semibold shadow-sm transition"
            title="Télécharger toutes les données d'entreprises sous format Excel / CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV (Excel)</span>
          </button>
          <button
            onClick={loadLeads}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statuses.map(st => {
          const count = leads.filter(l => l.status === st).length;
          return (
            <div
              key={st}
              onClick={() => setFilterStatus(filterStatus === st ? 'all' : st)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                filterStatus === st
                  ? 'bg-brand-900 text-white border-brand-800 shadow-md'
                  : 'bg-white border-slate-200 hover:border-brand-500/50 shadow-sm'
              }`}
            >
              <span className="block text-[11px] font-semibold text-slate-400 truncate">{st}</span>
              <span className={`text-xl font-black ${filterStatus === st ? 'text-brand-300' : 'text-slate-900'}`}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Filtres & Recherche */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Rechercher par entreprise, responsable, email, ville..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white outline-none cursor-pointer"
        >
          <option value="all">Tous les statuts ({leads.length})</option>
          {statuses.map(st => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
      </div>

      {/* Corps Principal : Table + Fiche Détail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Liste des Leads */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Prospects ({filteredLeads.length})</span>
            <span className="text-slate-400">Tri par date décroissante</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px]">
            {filteredLeads.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Aucun prospect ne correspond aux critères de recherche.
              </div>
            ) : (
              filteredLeads.map(lead => {
                const isSelected = selectedLead?.id === lead.id;
                return (
                  <div
                    key={lead.id}
                    onClick={() => handleSelectLead(lead)}
                    className={`p-4 cursor-pointer transition flex items-start justify-between gap-3 ${
                      isSelected ? 'bg-brand-50/70 border-l-4 border-brand-700' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm truncate">{lead.company}</span>
                        {lead.city && (
                          <span className="text-[11px] text-slate-500 font-medium shrink-0">({lead.city})</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 truncate">
                        {lead.full_name} • <span className="text-slate-500">{lead.sector}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        Objectif : <strong className="text-slate-700">{lead.main_objective}</strong>
                      </p>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(lead.status)}`}>
                        {lead.status}
                      </span>
                      {lead.meeting_booked === 1 && (
                        <div className="text-[10px] font-bold text-purple-700 flex items-center justify-end space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>RDV pris</span>
                        </div>
                      )}
                      <span className="block text-[10px] text-slate-400">
                        {new Date(lead.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Fiche Détail & Mise à Jour du Prospect */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
          {selectedLead ? (
            <>
              <div className="border-b border-slate-200 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{selectedLead.company}</h3>
                    <p className="text-xs text-slate-500">{selectedLead.sector}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(selectedLead.status)}`}>
                    {selectedLead.status}
                  </span>
                </div>
              </div>

              {/* Coordonnées */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-slate-700">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Contact : <strong>{selectedLead.full_name}</strong></span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`mailto:${selectedLead.email}`} className="text-brand-800 hover:underline font-medium">
                    {selectedLead.email}
                  </a>
                </div>
                <div className="flex items-center space-x-2 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`tel:${selectedLead.phone}`} className="text-brand-800 hover:underline font-medium">
                    {selectedLead.phone}
                  </a>
                  <a
                    href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] hover:bg-emerald-200"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Informations Entreprise */}
              <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 text-xs text-slate-700 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ville :</span>
                  <span className="font-semibold">{selectedLead.city || 'Non renseignée'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Effectif :</span>
                  <span className="font-semibold">{selectedLead.employee_count || 'Non spécifié'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bilan déjà réalisé :</span>
                  <span className="font-semibold">{selectedLead.has_existing_bilan || 'Non'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Objectif :</span>
                  <span className="font-semibold text-brand-900">{selectedLead.main_objective}</span>
                </div>
              </div>

              {/* Message complémentaire du prospect */}
              {selectedLead.message && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Message transmis par le prospect :
                  </label>
                  <p className="p-3 rounded-xl bg-slate-50 text-slate-800 text-xs italic border border-slate-200">
                    "{selectedLead.message}"
                  </p>
                </div>
              )}

              {/* Mise à Jour Statut & Notes */}
              <div className="pt-2 border-t border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Changer le statut du prospect :
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {statuses.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>

                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Notes internes (cadrage, périmètre convenu, devis) :
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Ex : Échange 30 min réalisé le 24/10. Périmètre convenu Scope 1 & 2. Devis 12 000 MAD envoyé..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white outline-none focus:ring-2 focus:ring-brand-500"
                />

                <button
                  onClick={handleSaveStatus}
                  disabled={isUpdating}
                  className="w-full py-2.5 rounded-xl bg-brand-800 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                >
                  {isUpdating ? 'Enregistrement...' : 'Enregistrer la mise à jour'}
                </button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Sélectionnez un prospect dans la liste pour consulter ses détails et mettre à jour son statut.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
