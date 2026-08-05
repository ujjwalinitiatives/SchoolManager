"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccessDeniedError, validateRole } from "@/lib/access-control";

export async function updateSchoolAddress(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new AccessDeniedError("Not authenticated");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true }
  });

  if (!user || !user.schoolId) throw new AccessDeniedError("User not found or no school linked");
  validateRole(user.role, ["PRINCIPAL"]);

  const address = formData.get("address") as string;

  await prisma.school.update({
    where: { id: user.schoolId },
    data: { address }
  });

  revalidatePath("/settings/profile");
  return { success: true };
}
