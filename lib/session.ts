import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getSession();
  if (!session || !session.user) {
    redirect("/login");
  }
  return session.user as {
    id: string;
    name: string;
    email: string;
    role: string;
    departmentId: string | null;
    status: string;
  };
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    redirect("/dashboard?error=unauthorized");
  }
  return user;
}
