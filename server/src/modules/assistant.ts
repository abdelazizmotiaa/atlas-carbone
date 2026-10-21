/**
 * Atlas Carbone - Assistant Pédagogique Facultatif Gemini
 * Conforme à la Section 18 du Prompt Maître
 * Rôle purement consultatif : zéro accès direct à la base de données, zéro calcul inventé,
 * repli gracieux automatique si la clé API n'est pas configurée.
 */

import { Router, Request, Response } from 'express';

export const assistantRouter = Router();

// Suivi de consommation en mémoire pour éviter tout abus
let requestCount = 0;
const MAX_REQUESTS_PER_HOUR = 100;
let lastReset = Date.now();

assistantRouter.post('/chat', async (req: Request, res: Response) => {
  const { question, context } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: "Une question textuelle est requise." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Repli gracieux si aucune clé API n'est configurée
  if (!apiKey) {
    return res.json({
      isConfigured: false,
      source: 'fallback_rules',
      reply: "L'assistant IA Gemini est facultatif et n'est pas configuré sur ce serveur (clé GEMINI_API_KEY non définie). L'ensemble de la plateforme Atlas Carbone — questionnaire guidé, catalogue sécurisé, moteur de calcul déterministe et génération de rapports PDF — fonctionne à 100% de manière autonome sans aucune dépendance envers l'IA.",
      disclaimer: "Information méthodologique : les calculs de gaz à effet de serre d'Atlas Carbone sont strictement déterministes et n'utilisent aucune intelligence artificielle générative pour les valeurs chiffrées."
    });
  }

  // Vérification de quota
  const now = Date.now();
  if (now - lastReset > 3600000) {
    requestCount = 0;
    lastReset = now;
  }
  if (requestCount >= MAX_REQUESTS_PER_HOUR) {
    return res.status(429).json({
      error: "Quota horaire de l'assistant atteint. Veuillez réessayer ultérieurement."
    });
  }
  requestCount++;

  const systemInstruction = `Tu es l'assistant pédagogique d'Atlas Carbone, plateforme marocaine de comptabilité des gaz à effet de serre (ISO 14064-1 et GHG Protocol).
Règles strictes :
1. Tu n'inventes AUCUN facteur d'émission chiffré.
2. Tu rappelles que tous les calculs mathématiques sont exécutés exclusivement par le moteur déterministe d'Atlas Carbone côté serveur.
3. Tu aides l'utilisateur à comprendre :
   - Où trouver la donnée demandée (ex: factures ONEE kWh, cartes carburant litres, fiches frigoristes).
   - Quelle unité physique renseigner (kWh, litres, tonnes, tonne-km).
   - Pourquoi une activité appartient au Scope 1, 2 ou 3.
   - Les risques de double comptage.
4. Tu réponds de manière sobre, concise et bienveillante en français ou en anglais selon la question.`;

  try {
    const promptPayload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: `Instructions système :\n${systemInstruction}\n\nContexte d'entreprise : ${context?.sector || 'Général'}, Site : ${context?.site || 'Maroc'}\n\nQuestion de l'utilisateur : ${question.slice(0, 500)}` }
          ]
        }
      ]
    };

    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promptPayload)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return res.json({
        isConfigured: true,
        source: 'fallback_error',
        reply: "Le service Gemini a renvoyé une indisponibilité temporaire. Veuillez consulter nos guides méthodologiques intégrés dans l'Académie.",
        errorDetails: errText.slice(0, 100)
      });
    }

    const json: any = await resp.json();
    const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;

    return res.json({
      isConfigured: true,
      source: 'gemini_api',
      reply: candidateText || "Réponse indisponible.",
      disclaimer: "Les suggestions de l'assistant sont à visée pédagogique et ne constituent pas un audit de conformité ISO 14065."
    });
  } catch (err: any) {
    return res.json({
      isConfigured: true,
      source: 'fallback_exception',
      reply: "Impossible de joindre l'API Gemini. Le moteur déterministe local reste pleinement opérationnel.",
      disclaimer: "Atlas Carbone fonctionne de façon autonome sans IA."
    });
  }
});
