import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";

async function main() {
  console.log("Seeding started...");

  // Clear existing data (in reverse dependency order)
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditItem.deleteMany({});
  await prisma.auditCycle.deleteMany({});
  await prisma.maintenanceRequest.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.transferRequest.deleteMany({});
  await prisma.allocation.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.assetCategory.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Users
  const adminPasswordHash = bcrypt.hashSync("admin123", 10);
  const employeePasswordHash = bcrypt.hashSync("employee123", 10);
  const deptHeadPasswordHash = bcrypt.hashSync("depthead123", 10);
  const managerPasswordHash = bcrypt.hashSync("manager123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@assetflow.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const employee = await prisma.user.create({
    data: {
      name: "Jane Employee",
      email: "employee@assetflow.com",
      passwordHash: employeePasswordHash,
      role: "EMPLOYEE",
      status: "ACTIVE",
    },
  });

  const deptHead = await prisma.user.create({
    data: {
      name: "John DeptHead",
      email: "depthead@assetflow.com",
      passwordHash: deptHeadPasswordHash,
      role: "DEPARTMENT_HEAD",
      status: "ACTIVE",
    },
  });

  const assetManager = await prisma.user.create({
    data: {
      name: "Mary Manager",
      email: "manager@assetflow.com",
      passwordHash: managerPasswordHash,
      role: "ASSET_MANAGER",
      status: "ACTIVE",
    },
  });

  console.log("Created users:", { admin: admin.email, employee: employee.email, deptHead: deptHead.email, assetManager: assetManager.email });

  // 2. Create Departments
  const itDept = await prisma.department.create({
    data: {
      name: "IT Support",
      status: "ACTIVE",
      managerId: deptHead.id,
    },
  });

  const hrDept = await prisma.department.create({
    data: {
      name: "HR Operations",
      status: "ACTIVE",
    },
  });

  const salesDept = await prisma.department.create({
    data: {
      name: "Sales & Marketing",
      status: "ACTIVE",
    },
  });

  // Link employee to IT department
  await prisma.user.update({
    where: { id: employee.id },
    data: { departmentId: itDept.id },
  });

  console.log("Created departments and linked employees");

  // 3. Create Categories
  const laptopFields = JSON.stringify([
    { name: "CPU", type: "text", required: true },
    { name: "RAM", type: "text", required: true },
    { name: "Storage", type: "text", required: true },
    { name: "OS", type: "text", required: false },
  ]);

  const monitorFields = JSON.stringify([
    { name: "Screen Size", type: "text", required: true },
    { name: "Resolution", type: "text", required: true },
  ]);

  const laptopCategory = await prisma.assetCategory.create({
    data: {
      name: "Laptops",
      fields: laptopFields,
    },
  });

  const monitorCategory = await prisma.assetCategory.create({
    data: {
      name: "Monitors",
      fields: monitorFields,
    },
  });

  console.log("Created asset categories");

  // 4. Create Assets
  const asset1 = await prisma.asset.create({
    data: {
      name: "MacBook Pro 16",
      serialNumber: "SN-MBP-2026",
      model: "Apple M3 Pro",
      status: "AVAILABLE",
      categoryId: laptopCategory.id,
      customFields: JSON.stringify({
        CPU: "M3 Pro",
        RAM: "18GB",
        Storage: "512GB SSD",
        OS: "macOS Sonoma",
      }),
    },
  });

  const asset2 = await prisma.asset.create({
    data: {
      name: "Dell XPS 15",
      serialNumber: "SN-DELL-5520",
      model: "Intel i7",
      status: "AVAILABLE",
      categoryId: laptopCategory.id,
      customFields: JSON.stringify({
        CPU: "Intel Core i7-12700H",
        RAM: "16GB",
        Storage: "1TB SSD",
        OS: "Windows 11 Pro",
      }),
    },
  });

  const asset3 = await prisma.asset.create({
    data: {
      name: "LG UltraFine 27",
      serialNumber: "SN-LG-27",
      model: "27UP850-W",
      status: "AVAILABLE",
      categoryId: monitorCategory.id,
      customFields: JSON.stringify({
        "Screen Size": "27 inch",
        Resolution: "3840 x 2160 (4K)",
      }),
    },
  });

  console.log("Created initial assets:", [asset1.name, asset2.name, asset3.name]);

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
