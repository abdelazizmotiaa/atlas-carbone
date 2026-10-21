import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

interface WhatsAppButtonProps {
  lang?: 'fr' | 'en';
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ lang = 'fr' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const phone = '212671581167';
  const messageFr = "Bonjour, je souhaite obtenir des informations sur votre accompagnement pour réaliser un bilan carbone de mon entreprise.";
  const messageEn = "Hello, I would like to get information about your support for carrying out a carbon footprint assessment for my company.";
  const text = encodeURIComponent(lang === 'en' ? messageEn : messageFr);
  const whatsappUrl = `https://wa.me/${phone}?text=${text}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center group no-print">
      {/* Tooltip desktop discret */}
      <div
        className={`hidden md:block mr-3 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-medium shadow-xl border border-slate-700 pointer-events-none transition-all duration-200 ${
          showTooltip ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}
      >
        <span className="text-emerald-400 font-bold">WhatsApp :</span>{' '}
        {lang === 'en' ? 'Direct chat with Abdelaziz Motiaa' : 'Échange direct avec Abdelaziz Motiaa'}
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg hover:shadow-emerald-900/30 transition-all duration-200 transform hover:scale-105 active:scale-95 border-2 border-white focus:outline-none focus:ring-4 focus:ring-emerald-400/40"
        aria-label={lang === 'en' ? 'Chat on WhatsApp' : 'Discuter sur WhatsApp'}
        title="+212 671 581 167"
      >
        <MessageCircle className="w-7 h-7 fill-current" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full animate-ping"></span>
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full"></span>
      </a>
    </div>
  );
};
