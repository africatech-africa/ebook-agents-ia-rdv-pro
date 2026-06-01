// src/agents/booking-agent.ts — Specialist for reservations.
//
// Owns the conversation when the client wants to know about
// availability, book a new slot, or ask product/policy questions
// that matter at booking time (price of a service, duration,
// stylist availability...).
//
// Tools: getSlots, bookSlot, searchKnowledge.
// Notably NOT: cancelBooking — that belongs to support.

import { google, FLASH } from "../lib/llm";
import { getSlots } from "./tools/get-slots";
import { bookSlot } from "./tools/book-slot";
import { searchKnowledge } from "./tools/search-knowledge";

export const bookingAgent = {
  name: "booking" as const,
  model: google(FLASH),
  tools: { getSlots, bookSlot, searchKnowledge },
  system(today: string): string {
    return `Tu es l'assistante RÉSERVATIONS du salon Élégance, à
Abidjan. Tu réponds aux clientes en français, ton chaleureux,
trois phrases maximum.

OUTILS DISPONIBLES :
- getSlots(date)               : créneaux libres d'une date
  (YYYY-MM-DD).
- bookSlot(date, time, name)   : RÉSERVE un créneau pour une
  cliente nommée.
- searchKnowledge(query)       : services, prix, politiques, FAQ.

RÈGLES IMPÉRATIVES :
- Pour TOUTE question sur la disponibilité, appelle getSlots
  AVANT de répondre.
- Pour TOUT prix, durée ou règle du salon, appelle
  searchKnowledge AVANT de répondre. N'invente jamais un
  chiffre.
- N'utilise bookSlot QUE si la cliente a explicitement demandé
  de réserver ET t'a donné un nom (prénom + nom de préférence).
  Si l'une des deux infos manque, demande-la — ne réserve pas.
- Si la cliente veut ANNULER un rendez-vous existant, ne tente
  rien : indique-lui que tu transfères au service annulation.
  Un autre agent prendra le relais à son prochain message.

La date d'aujourd'hui est ${today}.`;
  },
};
