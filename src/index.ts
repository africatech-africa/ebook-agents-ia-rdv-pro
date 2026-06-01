// src/index.ts — RDV-Pro entry point.

// A "service" is something the salon sells: a haircut, a manicure,
// braids... A `type` describes the shape every service object must
// have. It is a compile-time contract only — no runtime code.
type Service = {
  name: string;
  durationMinutes: number;
  priceFCFA: number;
};

const services: Service[] = [
  { name: "Coupe femme", durationMinutes: 45, priceFCFA: 8000 },
  { name: "Coupe homme", durationMinutes: 30, priceFCFA: 5000 },
  { name: "Tresses", durationMinutes: 180, priceFCFA: 25000 },
  { name: "Manucure", durationMinutes: 60, priceFCFA: 10000 },
  { name: "Soin du visage", durationMinutes: 75, priceFCFA: 15000 },
];

function formatService(service: Service): string {
  const { name, durationMinutes, priceFCFA } = service;
  const price = priceFCFA.toLocaleString("fr-FR");
  return `  - ${name} — ${durationMinutes} min — ${price} FCFA`;
}

console.log("Salon Élégance — prestations disponibles :\n");
for (const service of services) {
  console.log(formatService(service));
}
console.log(`\n${services.length} prestations au catalogue.`);
