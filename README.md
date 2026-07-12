# AssetFlow 🚀

AssetFlow is a modern, enterprise-grade Asset Management System built with Next.js 14, Prisma, and Tailwind CSS. It is designed to provide end-to-end tracking, allocation, and maintenance of corporate assets while maintaining an elegant, user-friendly interface.

## 🌟 Key Features

The platform encompasses **10 core modules** engineered for comprehensive asset lifecycle management:

1. **Secure Authentication**: Role-based access control (Admin, Asset Manager, Department Head, Employee) using NextAuth.
2. **Interactive Dashboard**: Real-time KPI statistics, overdue alerts, and quick-action widgets.
3. **Organization Setup**: Dynamic corporate hierarchy mapping, employee directory, and custom asset category schema generation.
4. **Asset Registration**: Advanced inventory tracking with support for custom dynamic fields and attributes based on asset category.
5. **Allocations & Transfers**: Securely check-out equipment to employees or departments, complete with approval workflows for transferring assets.
6. **Resource Bookings**: Calendar-based reservation system for shared assets with automatic overlap and conflict validation.
7. **Maintenance Workflows**: Ticketing system to report damages, schedule repairs, and track maintenance costs and resolution times.
8. **Compliance Audits**: Automated physical audit cycle generation that defines a scope (e.g., specific department/location) and assigns auditors to verify asset presence.
9. **Analytics & Reports**: Visual data aggregation for asset utilization rates and maintenance frequencies to drive better purchasing decisions.
10. **Immutable Activity Logs**: A transparent, system-wide audit trail capturing every creation, update, and transfer.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router & Server Actions)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: SQLite (Ready for PostgreSQL migration in production)
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (v18+) installed.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/digpalsinh128/Odoo_AssetFlow.git
   cd Odoo_AssetFlow
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up the database:**
   The project uses SQLite for local development out of the box. Initialize the schema and seed the database with initial data:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 👥 Contributors
Developed as part of a comprehensive AI Internship Project Evaluation.

---
*AssetFlow - Empowering teams with seamless asset intelligence.*
