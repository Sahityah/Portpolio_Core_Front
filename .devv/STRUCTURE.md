# This file is only for editing file nodes, do not break the structure

/src
├── assets/          # Static resources directory, storing static files like images and fonts
│
├── components/      # Components directory
│   ├── layout/     # Layout components
│   │   └── DashboardLayout.tsx  # Dashboard layout component used for authenticated pages
│   ├── ui/         # Pre-installed shadcn/ui components, avoid modifying or rewriting unless necessary
│   ├── SecuritiesSearch.tsx # Component for searching securities with auto-complete
│   └── ReportDownload.tsx  # Component for downloading PDF reports
│
├── hooks/          # Custom Hooks directory
│   ├── use-mobile.ts # Pre-installed mobile detection Hook from shadcn (import { useIsMobile } from '@/hooks/use-mobile')
│   └── use-toast.ts  # Toast notification system hook for displaying toast messages (import { useToast } from '@/hooks/use-toast')
│
├── lib/            # Utility library directory
│   ├── utils.ts    # Utility functions, including the cn function for merging Tailwind class names
│   ├── currency.ts # Currency formatting utilities for INR and Indian number system
│   └── report-generator.ts # PDF report generation utilities using jsPDF
│
├── pages/          # Page components directory, based on React Router structure
│   ├── HomePage.tsx       # Landing page component, main entry point of the application
│   ├── LoginPage.tsx      # Login page for user authentication with email and Google
│   ├── RegisterPage.tsx   # Registration page for new users with email and Google
│   ├── DashboardPage.tsx  # Main dashboard page showing portfolio overview with INR currency
│   ├── PositionsPage.tsx  # Page for viewing and managing portfolio positions with equity and F&O segments
│   ├── ChartPage.tsx      # Trading view chart page for technical analysis with multiple chart types
│   ├── ProfilePage.tsx    # User profile management page
│   └── NotFoundPage.tsx   # 404 error page component, displays when users access non-existent routes
│
├── store/          # State management directory
│   └── auth-store.ts  # Authentication state management using Zustand with Google auth support
│
├── App.tsx         # Root component, with React Router routing system configured
│                   # Contains all route configurations for the application
│
├── main.tsx        # Entry file, rendering the root component and mounting to the DOM
│
├── index.css       # Global styles file, containing Tailwind configuration and custom styles
│                   # Modified theme colors to light blue scheme
│
└── tailwind.config.js  # Tailwind CSS v3 configuration file
                      # Contains theme customization, plugins, and content paths
                      # Includes shadcn/ui theme configuration 
