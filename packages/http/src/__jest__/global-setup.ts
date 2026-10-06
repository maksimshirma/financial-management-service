import { resetTestDatabase } from "@fms/fixtures";

export default async function globalSetup() {
  await resetTestDatabase();
}
