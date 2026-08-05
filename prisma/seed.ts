import "dotenv/config";
import { PrismaClient, Role, FeeFrequency } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "node:crypto";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

/**
 * Hash password using the same algorithm as Better Auth:
 * @noble/hashes scrypt with N=16384, r=16, p=1, dkLen=64
 * Format: salt_hex:key_hex
 */
async function hashPassword(password: string): Promise<string> {
  // Import Better Auth's password hasher to guarantee compatibility
  const { hashPassword: betterAuthHash } = await import("@better-auth/utils/password");
  return betterAuthHash(password);
}

async function main() {
  console.log("🌱 Seeding database for testing...\n");

  // ─── 1. Create School ──────────────────────────────────────
  let school = await prisma.school.findFirst({ where: { name: "Springfield High School" } });

  if (!school) {
    school = await prisma.school.create({
      data: {
        name: "Springfield High School",
        address: "123 Evergreen Terrace, Springfield",
      },
    });
  }
  console.log(`✅ School: ${school.name} (${school.id})`);

  // ─── 2. Create Users (Principal, Accountant, Teacher, Parent) ──────
  const passwordHash = await hashPassword("Test@1234");

  const principal = await prisma.user.upsert({
    where: { email: "principal@springfield.edu" },
    update: {},
    create: {
      email: "principal@springfield.edu",
      name: "Seymour Skinner",
      role: Role.PRINCIPAL,
      schoolId: school.id,
      emailVerified: true,
    },
  });

  const accountant = await prisma.user.upsert({
    where: { email: "accountant@springfield.edu" },
    update: {},
    create: {
      email: "accountant@springfield.edu",
      name: "Gary Chalmers",
      role: Role.ACCOUNTANT,
      schoolId: school.id,
      emailVerified: true,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@springfield.edu" },
    update: {},
    create: {
      email: "teacher@springfield.edu",
      name: "Edna Krabappel",
      role: Role.TEACHER,
      schoolId: school.id,
      emailVerified: true,
    },
  });

  const parent = await prisma.user.upsert({
    where: { email: "parent@springfield.edu" },
    update: {},
    create: {
      email: "parent@springfield.edu",
      name: "Homer Simpson",
      role: Role.PARENT,
      schoolId: school.id,
      emailVerified: true,
    },
  });

  // Create credential accounts for all users so they can log in
  // Delete old accounts first to ensure the password hash is correct
  for (const user of [principal, accountant, teacher, parent]) {
    await prisma.account.deleteMany({
      where: { userId: user.id, providerId: "credential" },
    });
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  console.log("✅ Users created:");
  console.log("   Principal: principal@springfield.edu / Test@1234");
  console.log("   Accountant: accountant@springfield.edu / Test@1234");
  console.log("   Teacher: teacher@springfield.edu / Test@1234");
  console.log("   Parent: parent@springfield.edu / Test@1234");

  // ─── 3. Academic Session ──────────────────────────────────
  const session = await prisma.academicSession.upsert({
    where: {
      schoolId_name: { schoolId: school.id, name: "2026-27" },
    },
    update: {},
    create: {
      schoolId: school.id,
      name: "2026-27",
      startDate: new Date("2026-04-01T00:00:00Z"),
      endDate: new Date("2027-03-31T23:59:59Z"),
      isActive: true,
    },
  });
  console.log(`✅ Session: ${session.name}`);

  // ─── 4. Classes ──────────────────────────────────────────
  const classData = [
    { name: "Class 5", section: "A" },
    { name: "Class 6", section: "A" },
    { name: "Class 7", section: "A" },
  ];

  const classes = [];
  for (const c of classData) {
    const cls = await prisma.class.upsert({
      where: {
        schoolId_name_section: { schoolId: school.id, name: c.name, section: c.section },
      },
      update: {},
      create: {
        schoolId: school.id,
        name: c.name,
        section: c.section,
        teacherId: teacher.id,
      },
    });
    classes.push(cls);
  }
  console.log(`✅ Classes: ${classes.map(c => `${c.name}-${c.section}`).join(", ")}`);

  // ─── 5. Students ──────────────────────────────────────────
  const studentData = [
    { name: "Bart Simpson", admissionNumber: "SPR-001", classIdx: 0 },
    { name: "Lisa Simpson", admissionNumber: "SPR-002", classIdx: 1 },
    { name: "Nelson Muntz", admissionNumber: "SPR-003", classIdx: 0 },
    { name: "Ralph Wiggum", admissionNumber: "SPR-004", classIdx: 2 },
    { name: "Milhouse Van Houten", admissionNumber: "SPR-005", classIdx: 1 },
  ];

  const students = [];
  for (const s of studentData) {
    const student = await prisma.student.upsert({
      where: {
        schoolId_admissionNumber: { schoolId: school.id, admissionNumber: s.admissionNumber },
      },
      update: {},
      create: {
        schoolId: school.id,
        name: s.name,
        admissionNumber: s.admissionNumber,
        dateOfBirth: new Date("2015-01-15"),
      },
    });
    students.push(student);

    // Enrollment
    await prisma.studentEnrollment.upsert({
      where: {
        academicSessionId_studentId: { academicSessionId: session.id, studentId: student.id },
      },
      update: {},
      create: {
        studentId: student.id,
        academicSessionId: session.id,
        classId: classes[s.classIdx].id,
        rollNumber: String(students.length),
      },
    });
  }
  console.log(`✅ Students: ${students.map(s => s.name).join(", ")}`);

  // ─── 6. Link Parent to Students (Bart and Lisa) ─────────
  for (const studentIdx of [0, 1]) {
    await prisma.parentStudentLink.upsert({
      where: {
        parentId_studentId: { parentId: parent.id, studentId: students[studentIdx].id },
      },
      update: {},
      create: {
        parentId: parent.id,
        studentId: students[studentIdx].id,
      },
    });
  }
  console.log("✅ Linked parent (Homer) to Bart & Lisa");

  // ─── 7. Fee Structures ─────────────────────────────────
  for (const cls of classes) {
    const existing = await prisma.feeStructure.findFirst({
      where: { academicSessionId: session.id, classId: cls.id, isActive: true },
    });
    if (!existing) {
      await prisma.feeStructure.create({
        data: {
          academicSessionId: session.id,
          classId: cls.id,
          frequency: FeeFrequency.MONTHLY,
          effectiveFrom: new Date("2026-04-01"),
          components: {
            create: [
              { name: "Tuition Fee", amount: 3000 },
              { name: "Library Fee", amount: 500 },
              { name: "Activity Fee", amount: 1000 },
            ],
          },
        },
      });
    }
  }
  console.log("✅ Fee structures created (₹4,500/month per class)");

  // ─── 8. Sample Notice ─────────────────────────────────
  const existingNotice = await prisma.notice.findFirst({
    where: { schoolId: school.id, title: "Welcome to the New Academic Year!" },
  });
  if (!existingNotice) {
    await prisma.notice.create({
      data: {
        schoolId: school.id,
        title: "Welcome to the New Academic Year!",
        content: "Dear Parents and Students,\n\nWe are excited to welcome everyone back for the 2026-27 academic session. The first day of classes will be April 1st, 2026.\n\nPlease ensure all fee payments are up to date.\n\nRegards,\nSpringfield High School Administration",
        targetAudience: "ALL",
        authorId: principal.id,
      },
    });
  }
  console.log("✅ Sample notice created");

  // ─── 9. Sample Event ─────────────────────────────────
  const existingEvent = await prisma.event.findFirst({
    where: { schoolId: school.id, title: "Parent-Teacher Meeting" },
  });
  if (!existingEvent) {
    await prisma.event.create({
      data: {
        schoolId: school.id,
        title: "Parent-Teacher Meeting",
        description: "Annual parent-teacher meeting to discuss student progress and upcoming activities.",
        startTime: new Date("2026-08-15T10:00:00Z"),
        endTime: new Date("2026-08-15T13:00:00Z"),
      },
    });
  }
  console.log("✅ Sample event created");

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Test Login Credentials:");
  console.log("┌───────────────────────────────────────────────────────┐");
  console.log("│ Role        │ Email                       │ Password │");
  console.log("├───────────────────────────────────────────────────────┤");
  console.log("│ PRINCIPAL   │ principal@springfield.edu    │ Test@1234│");
  console.log("│ ACCOUNTANT  │ accountant@springfield.edu   │ Test@1234│");
  console.log("│ TEACHER     │ teacher@springfield.edu      │ Test@1234│");
  console.log("│ PARENT      │ parent@springfield.edu       │ Test@1234│");
  console.log("└───────────────────────────────────────────────────────┘");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
