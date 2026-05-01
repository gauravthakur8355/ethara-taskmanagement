import { PrismaClient, Role, ProjectRole, TaskStatus, Priority } from "@prisma/client";

// ══════════════════════════════════════════════════════════════
// Seed Script — populates the DB with realistic dummy data
//
// Creates:
// - 1 admin user (admin@gmail.com) — the project owner
// - 2 employee users (testuser1@gmail.com, testuser2@gmail.com)
// - 2 Ethara-themed projects with tasks + assignments
//
// Run with: npx tsx prisma/seed.ts
//
// this will wipe existing data first (in the correct order
// to avoid foreign key constraint voilations), then recreate
// everything fresh. safe to run multiple times.
// ══════════════════════════════════════════════════════════════

const prisma = new PrismaClient();

// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = "Password@123"; // same for all users — its seed data relax

async function main() {
  console.log("🌱 Starting seed...\n");

  // ─── Clean existing data (order matters for FK constraints) ───
  console.log("🧹 Cleaning existing data...");
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  console.log("   ✓ Database wiped clean\n");

  // ─── Create Users ───
  console.log("👤 Creating users...");
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      name: "Gaurav Thakur",
      email: "admin@gmail.com",
      password: hashedPassword,
      role: Role.ADMIN,
      avatar: null,
    },
  });
  console.log(`   ✓ Admin: ${admin.email} (${admin.id})`);

  const user1 = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "testuser1@gmail.com",
      password: hashedPassword,
      role: Role.MEMBER,
      avatar: null,
    },
  });
  console.log(`   ✓ Member: ${user1.email} (${user1.id})`);

  const user2 = await prisma.user.create({
    data: {
      name: "Rahul Verma",
      email: "testuser2@gmail.com",
      password: hashedPassword,
      role: Role.MEMBER,
      avatar: null,
    },
  });
  console.log(`   ✓ Member: ${user2.email} (${user2.id})\n`);

  // ─── Create Projects ───
  console.log("📁 Creating projects...");

  const project1 = await prisma.project.create({
    data: {
      name: "Ethara Platform Redesign",
      description:
        "Complete overhaul of the Ethara web platform — new UI/UX, improved performance, and mobile-first responsive design. Targeting Q3 launch.",
      slug: "ethara-platform-redesign",
      createdById: admin.id,
    },
  });
  console.log(`   ✓ Project: ${project1.name}`);

  const project2 = await prisma.project.create({
    data: {
      name: "Ethara Mobile App v2",
      description:
        "Native mobile app for Ethara using React Native. Features include task management, push notifications, and offline sync.",
      slug: "ethara-mobile-app-v2",
      createdById: admin.id,
    },
  });
  console.log(`   ✓ Project: ${project2.name}\n`);

  // ─── Add Members to Projects ───
  console.log("👥 Adding members to projects...");

  // Project 1: all 3 users (admin + both employees)
  await prisma.projectMember.createMany({
    data: [
      { userId: admin.id, projectId: project1.id, role: ProjectRole.ADMIN },
      { userId: user1.id, projectId: project1.id, role: ProjectRole.MEMBER },
      { userId: user2.id, projectId: project1.id, role: ProjectRole.MEMBER },
    ],
  });
  console.log(`   ✓ ${project1.name}: Admin + Priya + Rahul`);

  // Project 2: admin + user1 only (user2 not in this project)
  await prisma.projectMember.createMany({
    data: [
      { userId: admin.id, projectId: project2.id, role: ProjectRole.ADMIN },
      { userId: user1.id, projectId: project2.id, role: ProjectRole.MEMBER },
    ],
  });
  console.log(`   ✓ ${project2.name}: Admin + Priya\n`);

  // ─── Create Tasks for Project 1 (Ethara Platform Redesign) ───
  console.log("📋 Creating tasks for Ethara Platform Redesign...");

  const project1Tasks = [
    {
      title: "Design new landing page mockups",
      description: "Create high-fidelity mockups for the new Ethara landing page. Should include hero section, features grid, testimonials, and pricing table. Use Figma.",
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      dueDate: new Date("2026-04-20"),
      assignedToId: user1.id,
      position: 0,
    },
    {
      title: "Implement dark mode theme",
      description: "Add a system-wide dark mode toggle. Use CSS custom properties for theming. Should respect user's OS preference by default.",
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.MEDIUM,
      dueDate: new Date("2026-05-10"),
      assignedToId: user2.id,
      position: 0,
    },
    {
      title: "Set up CI/CD pipeline",
      description: "Configure GitHub Actions for automated testing, building, and deployment to Railway. Include staging and production environments.",
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      dueDate: new Date("2026-05-15"),
      assignedToId: admin.id,
      position: 0,
    },
    {
      title: "Migrate database to connection pooling",
      description: "Switch from direct Neon connection to pooled connection string. This should reduce cold start times and improve performance under load.",
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      dueDate: new Date("2026-05-20"),
      assignedToId: null,
      position: 1,
    },
    {
      title: "Write API documentation",
      description: "Document all REST endpoints using Swagger/OpenAPI spec. Include request/response examples, auth headers, and error codes.",
      status: TaskStatus.IN_REVIEW,
      priority: Priority.LOW,
      dueDate: new Date("2026-05-08"),
      assignedToId: user1.id,
      position: 0,
    },
    {
      title: "Fix user avatar upload bug",
      description: "Users report that avatar uploads fail silently when the image is larger than 2MB. Need to add proper validation and error messages.",
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.URGENT,
      dueDate: new Date("2026-04-28"), // overdue!
      assignedToId: user2.id,
      position: 1,
    },
    {
      title: "Add email notification system",
      description: "Send email notifications when: task assigned, task due soon (24h), task overdue, and when someone comments. Use Resend or Nodemailer.",
      status: TaskStatus.TODO,
      priority: Priority.LOW,
      dueDate: new Date("2026-06-01"),
      assignedToId: user1.id,
      position: 2,
    },
    {
      title: "Performance audit and optimization",
      description: "Run Lighthouse audits on all pages. Target: Performance > 90, Accessibility > 95. Fix any critical issues found.",
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      dueDate: new Date("2026-05-25"),
      assignedToId: admin.id,
      position: 3,
    },
  ];

  for (const task of project1Tasks) {
    await prisma.task.create({
      data: {
        ...task,
        projectId: project1.id,
        createdById: admin.id,
      },
    });
  }
  console.log(`   ✓ Created ${project1Tasks.length} tasks\n`);

  // ─── Create Tasks for Project 2 (Ethara Mobile App v2) ───
  console.log("📋 Creating tasks for Ethara Mobile App v2...");

  const project2Tasks = [
    {
      title: "Set up React Native project with Expo",
      description: "Initialize the mobile app project with Expo. Configure TypeScript, navigation (React Navigation), and state management (Zustand).",
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      dueDate: new Date("2026-04-15"),
      assignedToId: user1.id,
      position: 0,
    },
    {
      title: "Build login and signup screens",
      description: "Create authentication screens matching the web app design. Include biometric login support (Face ID / fingerprint) for returning users.",
      status: TaskStatus.DONE,
      priority: Priority.HIGH,
      dueDate: new Date("2026-04-25"),
      assignedToId: user1.id,
      position: 1,
    },
    {
      title: "Implement push notifications",
      description: "Set up Firebase Cloud Messaging for push notifications. Handle notification taps to deep-link into the relevant task/project.",
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: new Date("2026-05-12"),
      assignedToId: admin.id,
      position: 0,
    },
    {
      title: "Design task detail bottom sheet",
      description: "Create a swipeable bottom sheet for viewing and editing task details. Should include status toggle, priority picker, and comment thread.",
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      dueDate: new Date("2026-05-18"),
      assignedToId: user1.id,
      position: 0,
    },
    {
      title: "Offline sync with local SQLite",
      description: "Implement offline-first architecture using WatermelonDB or local SQLite. Queue changes when offline and sync when connection returns.",
      status: TaskStatus.TODO,
      priority: Priority.URGENT,
      dueDate: new Date("2026-04-30"), // overdue!
      assignedToId: admin.id,
      position: 1,
    },
    {
      title: "App Store submission prep",
      description: "Prepare app store listing: screenshots, description, privacy policy, and app icons for both iOS App Store and Google Play Store.",
      status: TaskStatus.TODO,
      priority: Priority.LOW,
      dueDate: new Date("2026-06-15"),
      assignedToId: null,
      position: 2,
    },
  ];

  for (const task of project2Tasks) {
    await prisma.task.create({
      data: {
        ...task,
        projectId: project2.id,
        createdById: admin.id,
      },
    });
  }
  console.log(`   ✓ Created ${project2Tasks.length} tasks\n`);

  // ─── Create some Comments ───
  console.log("💬 Adding comments...");

  const allTasks = await prisma.task.findMany({ take: 4 });

  const comments = [
    {
      content: "Mockups look great! Just one thing — can we make the CTA button more prominent? Maybe use a gradient instead of solid color.",
      taskId: allTasks[0]?.id,
      authorId: admin.id,
    },
    {
      content: "Updated the mockups with the gradient CTA. Also added a subtle animation on scroll. Check the Figma link!",
      taskId: allTasks[0]?.id,
      authorId: user1.id,
    },
    {
      content: "I've started on the dark mode implementation. Using CSS custom properties so it's easy to swap themes. Should be done by Thursday.",
      taskId: allTasks[1]?.id,
      authorId: user2.id,
    },
    {
      content: "Nice approach! Make sure to test with the dashboard charts — those SVG colors can be tricky in dark mode.",
      taskId: allTasks[1]?.id,
      authorId: admin.id,
    },
  ];

  for (const comment of comments) {
    if (comment.taskId) {
      await prisma.comment.create({ data: comment });
    }
  }
  console.log(`   ✓ Created ${comments.length} comments\n`);

  // ─── Summary ───
  console.log("═══════════════════════════════════════");
  console.log("🎉 Seed completed successfully!\n");
  console.log("📊 Summary:");
  console.log(`   Users:    3 (1 admin + 2 members)`);
  console.log(`   Projects: 2`);
  console.log(`   Tasks:    ${project1Tasks.length + project2Tasks.length}`);
  console.log(`   Comments: ${comments.length}\n`);
  console.log("🔑 Login credentials (all same password):");
  console.log(`   Admin:  admin@gmail.com / ${DEFAULT_PASSWORD}`);
  console.log(`   User 1: testuser1@gmail.com / ${DEFAULT_PASSWORD}`);
  console.log(`   User 2: testuser2@gmail.com / ${DEFAULT_PASSWORD}`);
  console.log("═══════════════════════════════════════");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
