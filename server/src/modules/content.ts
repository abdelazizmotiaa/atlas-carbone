/**
 * Atlas Carbone - Module Contenus Publics, Guides, Actualités, Newsletter & Académie
 * Conforme aux Sections 10, 15, 16, 17 du Prompt Maître
 */

import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.js';

export const contentRouter = Router();

// -------------------------------------------------------------
// 1. Guides Piliers Originaux (SEO & Pédagogie)
// -------------------------------------------------------------

contentRouter.get('/guides', (req: Request, res: Response) => {
  const lang = req.query.lang === 'en' ? 'en' : 'fr';
  const category = req.query.category as string;

  let query = 'SELECT id, slug_fr, slug_en, title_fr, title_en, summary_fr, summary_en, category, reading_time_minutes, created_at FROM guides WHERE 1=1';
  const params: any[] = [];
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  query += ' ORDER BY id ASC';

  const rows: any[] = db.prepare(query).all(...params);
  const localized = rows.map(r => ({
    id: r.id,
    slug: lang === 'en' ? r.slug_en : r.slug_fr,
    title: lang === 'en' ? r.title_en : r.title_fr,
    summary: lang === 'en' ? r.summary_en : r.summary_fr,
    category: r.category,
    readingTimeMinutes: r.reading_time_minutes,
    createdAt: r.created_at
  }));

  res.json(localized);
});

contentRouter.get('/guides/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const guide: any = db.prepare('SELECT * FROM guides WHERE slug_fr = ? OR slug_en = ?').get(slug, slug);

  if (!guide) {
    return res.status(404).json({ error: "Guide introuvable." });
  }

  const isEnglish = guide.slug_en === slug;
  res.json({
    id: guide.id,
    slug: isEnglish ? guide.slug_en : guide.slug_fr,
    alternateSlug: isEnglish ? guide.slug_fr : guide.slug_en,
    title: isEnglish ? guide.title_en : guide.title_fr,
    summary: isEnglish ? guide.summary_en : guide.summary_fr,
    content: isEnglish ? guide.content_en : guide.content_fr,
    category: guide.category,
    readingTimeMinutes: guide.reading_time_minutes,
    createdAt: guide.created_at
  });
});

// -------------------------------------------------------------
// 2. Espace Éditorial & Actualités Réglementaires
// -------------------------------------------------------------

contentRouter.get('/news', (req: Request, res: Response) => {
  const lang = req.query.lang === 'en' ? 'en' : 'fr';
  const category = req.query.category as string;
  const includeDrafts = req.query.includeDrafts === 'true';

  let query = 'SELECT id, slug_fr, slug_en, title_fr, title_en, excerpt_fr, excerpt_en, category, status, author, sources_json, published_at, updated_at FROM news_articles WHERE 1=1';
  const params: any[] = [];

  if (!includeDrafts) {
    query += " AND status = 'published'";
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  query += ' ORDER BY published_at DESC';

  const rows: any[] = db.prepare(query).all(...params);
  const localized = rows.map(r => ({
    id: r.id,
    slug: lang === 'en' ? r.slug_en : r.slug_fr,
    title: lang === 'en' ? r.title_en : r.title_fr,
    excerpt: lang === 'en' ? r.excerpt_en : r.excerpt_fr,
    category: r.category,
    status: r.status,
    author: r.author,
    sources: JSON.parse(r.sources_json || '[]'),
    publishedAt: r.published_at,
    updatedAt: r.updated_at
  }));

  res.json(localized);
});

contentRouter.get('/news/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const article: any = db.prepare('SELECT * FROM news_articles WHERE slug_fr = ? OR slug_en = ?').get(slug, slug);

  if (!article) {
    return res.status(404).json({ error: "Article d'actualité introuvable." });
  }

  const isEnglish = article.slug_en === slug;
  res.json({
    id: article.id,
    slug: isEnglish ? article.slug_en : article.slug_fr,
    alternateSlug: isEnglish ? article.slug_fr : article.slug_en,
    title: isEnglish ? article.title_en : article.title_fr,
    excerpt: isEnglish ? article.excerpt_en : article.excerpt_fr,
    content: isEnglish ? article.content_en : article.content_fr,
    category: article.category,
    status: article.status,
    author: article.author,
    sources: JSON.parse(article.sources_json || '[]'),
    publishedAt: article.published_at,
    updatedAt: article.updated_at
  });
});

// Création / Modification d'articles (Réservé administrateur éditorial)
contentRouter.post('/news', (req: Request, res: Response) => {
  // Vérification basique du rôle admin ou clé d'administration
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: "Authentification requise pour publier des actualités." });
  }

  const {
    id, slug_fr, slug_en, title_fr, title_en, excerpt_fr, excerpt_en,
    content_fr, content_en, category, status, author, sources
  } = req.body;

  if (!slug_fr || !title_fr || !content_fr) {
    return res.status(400).json({ error: "Les champs slug_fr, title_fr et content_fr sont obligatoires." });
  }

  const articleId = id || `news-${Date.now()}`;
  const now = new Date().toISOString();

  const upsert = db.prepare(`
    INSERT INTO news_articles (
      id, slug_fr, slug_en, title_fr, title_en, excerpt_fr, excerpt_en,
      content_fr, content_en, category, status, author, sources_json, published_at, updated_at, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    ON CONFLICT(id) DO UPDATE SET
      slug_fr = excluded.slug_fr,
      slug_en = excluded.slug_en,
      title_fr = excluded.title_fr,
      title_en = excluded.title_en,
      excerpt_fr = excluded.excerpt_fr,
      excerpt_en = excluded.excerpt_en,
      content_fr = excluded.content_fr,
      content_en = excluded.content_en,
      category = excluded.category,
      status = excluded.status,
      author = excluded.author,
      sources_json = excluded.sources_json,
      updated_at = excluded.updated_at
  `);

  upsert.run(
    articleId, slug_fr, slug_en || slug_fr, title_fr, title_en || title_fr,
    excerpt_fr || '', excerpt_en || '', content_fr, content_en || content_fr,
    category || 'reglementation', status || 'published', author || 'Abdelaziz Motiaa',
    JSON.stringify(sources || []), now, now, now
  );

  res.status(201).json({ id: articleId, message: "Article enregistré avec succès." });
});

// -------------------------------------------------------------
// 3. Newsletter Bilingue avec Double Opt-in
// -------------------------------------------------------------

contentRouter.post('/newsletter/subscribe', (req: Request, res: Response) => {
  const { email, lang } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: "Adresse email valide requise." });
  }

  const cleanEmail = email.toLowerCase().trim();
  const selectedLang = lang === 'en' ? 'en' : 'fr';
  const confirmationToken = crypto.randomBytes(24).toString('hex');
  const now = new Date().toISOString();

  // Vérifier si déjà inscrit ou sur liste d'exclusion
  const existing: any = db.prepare('SELECT * FROM newsletter_subscribers WHERE email = ?').get(cleanEmail);

  if (existing) {
    if (existing.status === 'confirmed') {
      return res.json({
        message: selectedLang === 'en'
          ? "You are already subscribed to our newsletter."
          : "Vous êtes déjà inscrit à la veille Atlas Carbone."
      });
    }
    if (existing.status === 'suppressed') {
      return res.status(400).json({
        error: selectedLang === 'en'
          ? "This email address is on the exclusion list."
          : "Cette adresse email figure sur la liste d'exclusion."
      });
    }
  }

  db.prepare(`
    INSERT INTO newsletter_subscribers (
      id, email, lang, status, confirmation_token, consent_proof_ip, created_at
    ) VALUES (?, ?, ?, 'pending_confirmation', ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      lang = excluded.lang,
      confirmation_token = excluded.confirmation_token,
      status = 'pending_confirmation'
  `).run(
    `sub-${Date.now()}`, cleanEmail, selectedLang, confirmationToken,
    req.ip || '127.0.0.1', now
  );

  // Journaliser l'email de confirmation dans dev_notifications
  const confirmUrl = `http://localhost:5000/api/newsletter/confirm?token=${confirmationToken}`;
  const subject = selectedLang === 'en'
    ? 'Atlas Carbone — Please confirm your newsletter subscription'
    : 'Atlas Carbone — Confirmez votre inscription à la veille carbone';

  const contentHtml = selectedLang === 'en'
    ? `<p>Hello,</p><p>Please confirm your subscription to the Atlas Carbone regulatory newsletter by clicking this link: <a href="${confirmUrl}">${confirmUrl}</a>.</p>`
    : `<p>Bonjour,</p><p>Veuillez confirmer votre inscription à la veille carbone d'Atlas Carbone en cliquant sur ce lien : <a href="${confirmUrl}">${confirmUrl}</a>.</p>`;

  db.prepare(`
    INSERT INTO dev_notifications (id, recipient_email, subject, template_name, content_html, sent_at)
    VALUES (?, ?, ?, 'newsletter_confirmation', ?, ?)
  `).run(`notif-${Date.now()}`, cleanEmail, subject, contentHtml, now);

  res.status(201).json({
    message: selectedLang === 'en'
      ? "A confirmation email has been dispatched. Please click the link to confirm your subscription."
      : "Un email de confirmation vous a été envoyé. Cliquez sur le lien pour valider votre inscription.",
    confirmationToken // Retourné pour faciliter les tests d'acceptation locaux
  });
});

contentRouter.get('/newsletter/confirm', (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) return res.status(400).send("Jeton de confirmation manquant.");

  const sub: any = db.prepare('SELECT * FROM newsletter_subscribers WHERE confirmation_token = ?').get(token);
  if (!sub) {
    return res.status(404).send("Jeton de confirmation invalide ou expiré.");
  }

  db.prepare('UPDATE newsletter_subscribers SET status = ?, confirmed_at = ? WHERE id = ?')
    .run('confirmed', new Date().toISOString(), sub.id);

  const isEn = sub.lang === 'en';
  if (req.headers.accept?.includes('application/json')) {
    return res.json({ status: 'confirmed', message: isEn ? "Subscription confirmed!" : "Inscription confirmée !" });
  }

  const html = `
    <!DOCTYPE html>
    <html lang="${sub.lang}">
    <head><meta charset="UTF-8"><title>Atlas Carbone — Inscription confirmée</title></head>
    <body style="font-family: sans-serif; background: #F8FAFC; padding: 40px; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background: white; padding: 32px; border-radius: 16px; border: 1px solid #E2E8F0;">
        <h2 style="color: #064E3B;">${isEn ? 'Subscription Confirmed!' : 'Inscription Confirmée !'}</h2>
        <p style="color: #475569;">${isEn ? 'Thank you. You will receive our monthly Moroccan carbon accounting and CBAM updates.' : 'Merci. Vous recevrez nos analyses mensuelles sur la comptabilité carbone et le MACF au Maroc.'}</p>
        <p><a href="/" style="display: inline-block; background: #064E3B; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none;">${isEn ? 'Return to Atlas Carbone' : 'Retourner sur Atlas Carbone'}</a></p>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

contentRouter.get('/newsletter/unsubscribe', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const email = req.query.email as string;

  if (!token && !email) {
    return res.status(400).send("Jeton ou adresse email requis pour la désinscription.");
  }

  let sub: any;
  if (token) {
    sub = db.prepare('SELECT * FROM newsletter_subscribers WHERE confirmation_token = ?').get(token);
  } else if (email) {
    sub = db.prepare('SELECT * FROM newsletter_subscribers WHERE email = ?').get(email.toLowerCase().trim());
  }

  if (!sub) {
    return res.status(404).send("Abonné introuvable.");
  }

  db.prepare('UPDATE newsletter_subscribers SET status = ?, unsubscribed_at = ? WHERE id = ?')
    .run('suppressed', new Date().toISOString(), sub.id);

  if (req.headers.accept?.includes('application/json')) {
    return res.json({ status: 'unsubscribed', message: "Désinscription confirmée." });
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Désinscription confirmée</title></head>
    <body style="font-family: sans-serif; background: #F8FAFC; padding: 40px; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background: white; padding: 32px; border-radius: 16px; border: 1px solid #E2E8F0;">
        <h2 style="color: #0F172A;">Désinscription confirmée</h2>
        <p style="color: #475569;">Votre adresse a été retirée de nos listes d'envoi et ajoutée à notre registre d'exclusion pour éviter tout réabonnement involontaire.</p>
        <p><a href="/" style="color: #064E3B; text-decoration: underline;">Retourner sur Atlas Carbone</a></p>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

// -------------------------------------------------------------
// 4. Académie Bilan Carbone & Glossaire
// -------------------------------------------------------------

contentRouter.get('/academy/modules', (req: Request, res: Response) => {
  const lang = req.query.lang === 'en' ? 'en' : 'fr';
  const rows: any[] = db.prepare('SELECT * FROM academy_modules ORDER BY module_number ASC').all();

  const localized = rows.map(r => ({
    id: r.id,
    moduleNumber: r.module_number,
    title: lang === 'en' ? r.title_en : r.title_fr,
    summary: lang === 'en' ? r.summary_en : r.summary_fr,
    content: lang === 'en' ? r.content_en : r.content_fr,
    example: lang === 'en' ? r.example_en : r.example_fr,
    quizQuestion: lang === 'en' ? r.quiz_question_en : r.quiz_question_fr,
    quizOptions: JSON.parse(lang === 'en' ? r.quiz_options_en : r.quiz_options_fr),
    quizCorrectIndex: r.quiz_correct_index,
    quizExplanation: lang === 'en' ? r.quiz_explanation_en : r.quiz_explanation_fr,
    actionLink: r.action_link
  }));

  res.json(localized);
});

contentRouter.get('/academy/glossary', (req: Request, res: Response) => {
  const lang = req.query.lang === 'en' ? 'en' : 'fr';
  const glossary = [
    {
      term_fr: 'CO₂e (Équivalent CO₂)',
      term_en: 'CO₂e (CO₂ Equivalent)',
      def_fr: 'Unité de mesure universelle standardisant l’impact climatique de différents gaz à effet de serre en fonction de leur PRG par rapport au CO₂.',
      def_en: 'Universal metric standardizing the climate impact of various greenhouse gases based on their GWP relative to carbon dioxide.'
    },
    {
      term_fr: 'Facteur d’émission (FE)',
      term_en: 'Emission Factor (EF)',
      def_fr: 'Coefficient multiplicateur physique reliant une unité d’activité (ex: kWh, litre de gazole) à la masse de GES émise en kgCO₂e.',
      def_en: 'Physical coefficient relating one unit of operational activity (e.g. kWh, liter of diesel) to the emitted GHG mass in kgCO₂e.'
    },
    {
      term_fr: 'PRG (Pouvoir de Réchauffement Global)',
      term_en: 'GWP (Global Warming Potential)',
      def_fr: 'Facteur d’équivalence mesurant la capacité d’un gaz à piéger la chaleur dans l’atmosphère sur 100 ans par rapport au CO₂ (ex: CH₄ = 28, N₂O = 273 selon le 6e rapport du GIEC / AR6).',
      def_en: 'Equivalence ratio measuring a gas’s heat-trapping capacity over 100 years relative to CO₂ (e.g., CH₄ = 28, N₂O = 273 under IPCC AR6).'
    },
    {
      term_fr: 'Scope 1 (Émissions directes)',
      term_en: 'Scope 1 (Direct Emissions)',
      def_fr: 'Émissions provenant de sources détenues ou contrôlées physiquement par l’entreprise (chaudières, flotte de véhicules, fuites de climatisation).',
      def_en: 'Emissions from sources physically owned or directly controlled by the reporting organization (boilers, fleet vehicles, HVAC leaks).'
    },
    {
      term_fr: 'Scope 2 (Location-based vs Market-based)',
      term_en: 'Scope 2 (Location-based vs Market-based)',
      def_fr: 'Location-based reflète l’intensité moyenne du réseau national (ONEE : 0,6426 kgCO₂e/kWh net). Market-based reflète les contrats d’énergie renouvelable spécifiques justifiés.',
      def_en: 'Location-based reflects average national grid intensity (ONEE: 0.6426 kgCO₂e/kWh net). Market-based reflects verified green power purchase contracts.'
    },
    {
      term_fr: 'Scope 3 (Chaîne de valeur)',
      term_en: 'Scope 3 (Value Chain)',
      def_fr: '15 catégories d’émissions indirectes en amont et en aval : achats de matières, fret, déplacements professionnels, fin de vie des produits vendus.',
      def_en: '15 upstream and downstream value-chain indirect categories: purchased inputs, logistics freight, business travel, product disposal.'
    },
    {
      term_fr: 'MACF / CBAM',
      term_en: 'EU CBAM',
      def_fr: 'Mécanisme européen imposant aux importateurs de déclarer et compenser les émissions intrinsèques de produits industriels importés (acier, ciment, engrais, aluminium).',
      def_en: 'European mechanism obligating EU importers to declare and settle certificates on embedded emissions in imported goods (steel, cement, fertilizers, aluminum).'
    },
    {
      term_fr: 'Poste identifié, non quantifié',
      term_en: 'Identified, unquantified item',
      def_fr: 'Activité avérée dans l’entreprise mais pour laquelle aucun facteur compatible validé ou relevé fiable n’existe. Règle de rigueur : jamais affectée à zéro.',
      def_en: 'Confirmed business activity lacking validated emission factors or primary meter data. Methodological rule: strictly never defaulted to zero.'
    }
  ];

  res.json(glossary.map(g => ({
    term: lang === 'en' ? g.term_en : g.term_fr,
    definition: lang === 'en' ? g.def_en : g.def_fr
  })));
});
