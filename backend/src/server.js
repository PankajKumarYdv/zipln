import "dotenv/config";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { User } from "./models/User.js";

const PORT = Number.parseInt(process.env.PORT, 10) || 5000;

async function migrateLegacyUsers() {
  await User.collection.updateMany(
    { plan: "paid" },
    { $set: { role: "pro" }, $unset: { plan: "" } },
  );
  await User.collection.updateMany(
    { plan: "free" },
    { $set: { role: "free" }, $unset: { plan: "" } },
  );
  await User.collection.updateMany(
    { role: { $exists: false } },
    { $set: { role: "free" } },
  );
}

async function main() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    console.warn(
      "[warn] JWT_SECRET should be set to a long random string (16+ chars) in production.",
    );
  }
  await connectDb();
  await migrateLegacyUsers();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
