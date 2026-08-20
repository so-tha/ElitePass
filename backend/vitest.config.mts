import { defineConfig } from "vitest/config";

// Segredos "fake" só para satisfazer a validação de env vars (Zod) em
// src/config/env.ts durante os testes — nenhum deles se conecta a um
// banco ou à Stripe de verdade.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://test:test@localhost:5432/elitepass_test",
      JWT_ACCESS_SECRET: "test-access-secret-not-for-production",
      JWT_REFRESH_SECRET: "test-refresh-secret-not-for-production",
      TICKET_HMAC_SECRET: "test-ticket-hmac-secret-not-for-prod",
      STRIPE_SECRET_KEY: "sk_test_dummy_key_for_unit_tests",
    },
  },
});
