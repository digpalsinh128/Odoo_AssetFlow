import { requireRole } from "@/lib/session";
import OrgSetupClient from "./OrgSetupClient";

export default async function OrgSetupPage() {
  // Enforce ADMIN role security check server-side
  await requireRole(["ADMIN"]);

  return <OrgSetupClient />;
}
