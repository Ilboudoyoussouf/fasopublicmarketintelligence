// Architecture de paiement abstraite (section 51) — permet de changer de
// fournisseur (mobile money, carte) sans modifier les appelants.
import type { PaymentProvider } from "@prisma/client";

export type PaymentIntent = { externalRef: string; amount: number; currency: string; status: "SUCCEEDED" | "PENDING" | "FAILED" };

export interface PaymentGateway {
  charge(input: { amount: number; currency: string; provider: PaymentProvider }): Promise<PaymentIntent>;
}

class MockGateway implements PaymentGateway {
  async charge(input: { amount: number; currency: string; provider: PaymentProvider }): Promise<PaymentIntent> {
    // Aucun fournisseur réel n'est configuré dans cet environnement de
    // démonstration : le paiement est simulé mais suit le même contrat
    // qu'une intégration réelle (Orange Money, Moov Money, carte bancaire).
    return {
      externalRef: `MOCK-${Date.now()}`,
      amount: input.amount,
      currency: input.currency,
      status: "SUCCEEDED",
    };
  }
}

export function getPaymentGateway(): PaymentGateway {
  return new MockGateway();
}
