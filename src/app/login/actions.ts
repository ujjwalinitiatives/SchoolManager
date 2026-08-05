"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function enforceRoleMatch(email: string, expectedRole: string) {
  try {
    const dbUser = await prisma.user.findUnique({ where: { email }});
    
    if (!dbUser) {
      return { success: false, error: "Account not found." };
    }

    if (dbUser.role !== expectedRole) {
      if (expectedRole === "PARENT" && dbUser.role === "STUDENT") {
        // Parents log in using their student's credentials
      } else {
        return { success: false, error: `Account email exists, but not as a ${expectedRole.toLowerCase()}.` };
      }
    }
    
    return { success: true };
  } catch (err: any) {
    console.error("Error in enforceRoleMatch:", err);
    return { success: false, error: "Failed to verify role." };
  }
}
