# AuditShield Project Structure

Below is the directory mapping for the AuditShield multi-tenant SaaS codebase, highlighting core application routes, configuration files, and core abstractions.

```text
auditshield/
├── db/
│   └── schema.sql                 # Primary Database Defintion & Seed Layout
├── src/
│   ├── app/
│   │   ├── admin/                 # Manager Operational Routes
│   │   │   ├── dashboard/         # Compliance Metrics & Pagination view
│   │   │   │   └── page.tsx
│   │   │   ├── locations/
│   │   │   │   └── page.tsx
│   │   │   ├── reports/
│   │   │   │   └── page.tsx
│   │   │   ├── schedules/         # The Schedule Policy Generator Engine
│   │   │   │   └── page.tsx
│   │   │   ├── staff/
│   │   │   │   └── page.tsx
│   │   │   ├── stations/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx         # Shared Admin UI Navigator Wrapper
│   │   ├── auth/callback/         # Supabase OAuth & DB Handshake Interceptor
│   │   │   └── page.tsx
│   │   ├── login/                 
│   │   │   └── page.tsx
│   │   ├── onboard/               # Multi-Tenant Workspace Provisioning 
│   │   │   └── page.tsx
│   │   ├── [orgSlug]/[locSlug]/   # Frontend Kiosk Endpoint (Physical Logging UI)
│   │   │   └── page.tsx
│   │   ├── globals.css            # Global Theme Variables & Core Tailwind imports
│   │   └── layout.tsx             # Root Application Metadata Wrapper
│   ├── components/                # Reusable React UI Atoms
│   │   ├── PinPadModal.tsx        # Secure Identity Verification Engine
│   │   ├── PrintButton.tsx
│   │   ├── StaffManager.tsx
│   │   └── StationForm.tsx
│   ├── lib/                       # Utility & Logic Configs
│   │   ├── supabase.ts            # Client-side Database Instantiation
│   │   └── utils.ts
│   └── services/
│       └── alertService.ts        # Modular Webhook Notification Triggers
├── supabase/
│   └── functions/                 # Backend Deno Edge Functions
│       └── check-compliance-alerts/
│           └── index.ts
├── package.json                   # Node modules & Project Run Scripts
└── next.config.ts                 # Next JS Compiler Configurations
```

## Core Directory Roles

- **`src/app/admin/*`**: Houses the strictly protected `.tsx` views designed exclusively for authenticated manager roles. Responsible for dashboard insights, PDF exporting, and compliance rule management.
- **`src/app/[orgSlug]/[locSlug]/*`**: The ingestion endpoint. A highly localized, public-facing route acting as the physical, always-on "Kiosk" utilized continuously by frontline-staff.
- **`src/components/*`**: UI building blocks abstracted away from specific route layouts to maximize component reusability (such as dynamic modals and table forms).
- **`supabase/functions/*`**: Contains our active Edge Functions, enabling backend triggers (like Cron evaluations or system notifications) to execute securely outside the Next.js runtime payload.
