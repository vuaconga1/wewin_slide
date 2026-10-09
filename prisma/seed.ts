import { ensureDevUsers } from "../src/services/auth/dev-accounts";

ensureDevUsers()
  .then(() => {
    console.log("Dev accounts are ready.");
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Seed failed.";
    if (/postgres:\/\/|OPENAI|API_KEY|\bsk-/i.test(message)) {
      console.error("Database is unavailable. Check DATABASE_URL, then run npm run db:push.");
    } else {
      console.error(message);
    }
    process.exit(1);
  });
