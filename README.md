# TriggerGrain Framework Template

A sophisticated, duplicatable framework for creating interconnected web applications with dynamic navigation driven by Supabase and shared authentication, designed for systematic consolidation into a unified platform.

## 🎯 Overview

The **TriggerGrain Framework Template** is the foundational codebase for the TriggerGrain ecosystem, a comprehensive suite of web applications designed to empower modern agriculture businesses. This template provides a robust starting point for developing interconnected applications that share a common design language, a unified authentication system, and dynamic navigation driven by Supabase.

Our strategic vision involves initially deploying these applications as independent services on distinct subdomains, allowing for agile development and focused feature delivery. Ultimately, these individual applications will be systematically combined into a single, massive, unified platform, offering a seamless and integrated experience for our users.

## 🚀 Vision & Strategic Evolution

Our development strategy for the TriggerGrain ecosystem is designed for both immediate agility and long-term scalability:

1.  **Phase 1: Independent Subdomain Applications**: Each core functional area (e.g., Dashboard, Grain Management, Client Portal) will initially be developed and deployed as a standalone application, leveraging this template. This allows for rapid iteration, independent deployment cycles, and focused development teams for each specific domain.
2.  **Phase 2: Systematic Platform Consolidation**: Once individual applications mature, they will be systematically integrated into a single, unified 'super-app.' This is not a simple code merge, but a planned architectural evolution where each standalone application transforms into a modular feature within a larger, cohesive platform. This approach ensures a seamless user experience, centralized data management, and streamlined maintenance for the entire TriggerGrain suite.

## 🏗️ Architecture

### Framework Concept
- **Single Template**: This codebase serves as the master template for all applications within the TriggerGrain ecosystem.
- **Multiple Deployments**: Each navigation item (representing a core functional area) becomes its own independently deployed application in Phase 1.
- **Dynamic Navigation**: Navigation items are stored in Supabase and automatically sync across all applications, providing a consistent user experience.
- **Subdomain Routing**: In Phase 1, navigation items redirect to their respective subdomains.
- **Unified Auth**: Shared Supabase authentication across all applications ensures a single sign-on experience.
- **Real-time Updates**: Navigation changes are reflected immediately across all deployed applications.

### Dynamic Navigation System
Navigation items are stored in the `navigation_items` table in Supabase with the following structure:
- **title**: Display name (e.g., "Dashboard")
- **icon_name**: Lucide icon name (e.g., "BarChart3")
- **subdomain**: Full URL for redirection (e.g., "dashboard.triggergrain.ca")
- **color**: Theme color (e.g., "tg-primary")
- **sort_order**: Display order in navigation
- **is_active**: Whether to show the item
- **redirect_active**: Whether clicking the item should redirect to subdomain (true) or show local content (false)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase account
- Google Cloud Console account (for OAuth)

### Initial Setup
1. Clone this repository
2. Install dependencies: `npm install`
3. Set up environment variables (see Environment Setup)
4. Start development server: `npm run dev`

### Environment Setup
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Database Setup
The navigation system requires a Supabase database. Run the migration to set up the navigation table:

1.  **Connect to Supabase** using the button in the top right
2.  **Migration will run automatically** to create the `navigation_items` table
3.  **Default navigation items** will be inserted automatically

The migration creates:
- `navigation_items` table with all necessary columns
- Row Level Security (RLS) policies
- Default navigation items for all TriggerGrain apps
- Real-time subscription setup

## 🔄 Duplication Process (Phase 1: Independent Applications)

For each new application that will form part of the TriggerGrain ecosystem:

1.  **Duplicate the Template**
    ```bash
    # Create new directory for specific app
    cp -r triggergrain-framework triggergrain-[app-name]
    cd triggergrain-[app-name]
    ```

2.  **Update Application-Specific Content**
    -   Replace placeholder content in `src/components/Core/MainContent.tsx` (or the specific page component it renders).
    -   Add app-specific components and pages within the `src/pages/[app-name]` directory.
    -   Update the active navigation item logic in `src/App.tsx` if necessary to default to this app's specific page.
    -   Customize any app-specific styling.

3.  **Configure for Subdomain**
    -   Update `package.json` name.
    -   Configure deployment for a specific subdomain.
    -   Ensure Supabase auth redirects work with the subdomain.

4.  **Deploy to Subdomain**
    -   Deploy to respective subdomain (e.g., `dashboard.triggergrain.ca`).
    -   Configure DNS and SSL certificates.
    -   Test cross-subdomain authentication.

## 🧩 Modular Development for Future Integration (Phase 2 Preparation)

To ensure a smooth transition from independent subdomain applications to a unified platform, adhere to the following modular development principles when building out each application based on this template:

*   **Self-Contained Feature Modules**: Organize the unique functionality of each application (e.g., 'Dashboard features', 'Grain Entries features') into distinct, self-contained modules. Each module should encapsulate its own components, specific hooks, local state management, and data fetching logic. This ensures that when the time comes for consolidation, these modules can be easily 'plugged in' to the larger application shell.
*   **Centralized Shared UI Components**: Identify and extract common UI patterns (e.g., custom buttons, input fields, cards, data tables) into a dedicated `src/components/Shared` or `src/components/UI` folder within this template. This prevents duplication and ensures visual and functional consistency across all applications, simplifying future integration.
*   **Standardized Data Handling**: Maintain consistent patterns for data fetching and state management across all applications. Leverage Supabase consistently and consider using established patterns (e.g., React Query hooks) for data synchronization. This uniformity will be critical when consolidating data flows in the unified platform.
*   **Anticipate Internal Routing**: While currently using subdomain redirects, design your application's internal navigation with the future in mind. Consider how each subdomain's content will map to internal routes (e.g., `/dashboard`, `/grain-entries`) within the single application. This foresight will simplify the transition to a unified routing system.

### 🔗 Dynamic Internal Routing System

The TriggerGrain Framework is built with `react-router-dom` to support dynamic, nested URLs within each application. This enables deep linking to specific entities and sub-pages, creating a rich navigation experience.

#### Routing Architecture
When a navigation item has `redirect_active` set to `false`, the application renders local content that can leverage React Router's nested routing capabilities. This allows for dynamic URLs such as:

- `/clients` - Main clients page
- `/clients/scott-farms` - Specific client detail page
- `/clients/scott-farms/contracts` - Client's contracts sub-page
- `/grain-entries/2024/wheat` - Specific grain entry by year and type
- `/analytics/reports/:reportId` - Dynamic report viewing

#### Implementation Pattern
Each feature module should implement its own routing structure:

```typescript
// Example: src/pages/clients/ClientsRouter.tsx
import { Routes, Route } from 'react-router-dom';
import { ClientsList } from './ClientsList';
import { ClientDetail } from './ClientDetail';
import { ClientContracts } from './ClientContracts';

export const ClientsRouter = () => (
  <Routes>
    <Route index element={<ClientsList />} />
    <Route path=":clientId" element={<ClientDetail />} />
    <Route path=":clientId/contracts" element={<ClientContracts />} />
  </Routes>
);
```

#### Benefits for Phase 2 Integration
- **SEO-Friendly URLs**: Each entity has a unique, bookmarkable URL
- **Deep Linking**: Users can share direct links to specific clients, reports, or data
- **Navigation State**: Browser back/forward buttons work naturally
- **Future-Proof**: Internal routes easily map to unified platform routes during consolidation

#### URL Structure Guidelines
- Use **kebab-case** for URL segments: `/grain-entries` not `/grainEntries`
- Include **entity identifiers**: `/clients/scott-farms` not `/clients/1`
- Maintain **logical hierarchy**: `/clients/:clientId/contracts/:contractId`
- Support **query parameters** for filtering: `/analytics?year=2024&crop=wheat`

## 🎨 Design System

### Color Palette
```css
--tg-primary: #acdfeb    /* Light blue - primary actions */
--tg-grey: #dfdfdf       /* Light grey - neutral elements */
--tg-coral: #f4c7c3      /* Light coral - secondary actions */
--tg-green: #b7e1cd      /* Light green - success states */
```

### Typography
- **Font Family**: Raleway (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700

### Component Standards
- Consistent spacing using Tailwind's spacing scale
- Rounded corners: `rounded-xl` (12px) for cards, `rounded-lg` (8px) for buttons
- Shadows: `shadow-lg` for elevated elements
- Transitions: 200ms duration for hover states

## 🔧 Adding New Navigation Items

### Method 1: Direct Database Insert
Add new navigation items directly in Supabase:

1.  **Go to Supabase Dashboard** → Table Editor → `navigation_items`
2.  **Insert new row** with:
    ```sql
    INSERT INTO navigation_items (title, icon_name, subdomain, color, sort_order, is_active, redirect_active) 
    VALUES ('New Feature', 'Star', 'newfeature.triggergrain.ca', 'tg-primary', 9, true, true);
    ```
3.  **Changes appear immediately** in all deployed applications

### Method 2: Programmatic Insert
Use the Supabase client to add items:

```typescript
const { data, error } = await supabase
  .from('navigation_items')
  .insert({
    title: 'New Feature',
    icon_name: 'Star',
    subdomain: 'newfeature.triggergrain.ca',
    color: 'tg-primary',
    sort_order: 9,
    is_active: true,
    redirect_active: true
  });
```

### Available Icons
The system supports these Lucide icons out of the box:
- `BarChart3`, `Grain`, `TrendingUp`, `Workflow`, `Users`, `FileText`, `BookOpen`, `Settings`
- `Home`, `Database`, `Mail`, `Calendar`, `Map`, `Camera`, `Heart`, `Star`, `Shield`, `Zap`
- `Globe`, `Code`, `Briefcase`, `Target`, `Award`, `Clock`, `Circle` (default)

To add more icons, update `src/utils/iconMapper.ts`.

### Step 3: Create Dedicated Application (Same as Before)
Follow the duplication process to create the standalone application for the new feature.

## 📊 Navigation Management

### Real-time Updates
- **Automatic Sync**: All applications automatically receive navigation updates
- **No Deployment Required**: Changes appear immediately across all subdomains
- **Fallback System**: If database is unavailable, apps use default navigation items

### Managing Navigation Items
```sql
-- Enable/disable navigation items
UPDATE navigation_items SET is_active = false WHERE title = 'Old Feature';

-- Reorder navigation items
UPDATE navigation_items SET sort_order = 5 WHERE title = 'Important Feature';

-- Update colors and styling
UPDATE navigation_items SET color = 'tg-coral' WHERE title = 'Analytics';

-- Change redirect URLs
UPDATE navigation_items SET subdomain = 'newdomain.triggergrain.ca' WHERE title = 'Dashboard';
```

## 🔐 Authentication System

### Supabase Configuration
- **Provider**: Supabase Auth
- **Methods**: Email/Password
- **Features**: 
  - User registration and login
  - Password reset functionality
  - Cross-subdomain session sharing
  - Secure token management

## 📁 Project Structure

```
src/
├── components/
│   ├── Core/                # Core framework components (LoadingSpinner, LoginPage, MainContent, Sidebar)
│   └── Shared/              # Reusable UI components shared across applications
│       └── SharedComponents.tsx  # Consolidated UI components (Button, Input, Card, Modal)
├── contexts/
│   ├── AuthContext.tsx      # Authentication state management
│   └── NotificationContext.tsx   # Centralized notification system
├── hooks/
│   └── useNavigation.ts     # Navigation data fetching and real-time updates
├── lib/
│   └── supabase.ts         # Supabase client configuration
├── pages/                   # Application-specific pages, organized by feature/app
│   └── dashboard/           # Example: Dashboard application's pages
│       └── DashboardPage.tsx
├── types/
│   └── navigation.ts       # TypeScript interfaces for navigation
├── utils/
│   └── iconMapper.ts       # Icon mapping utilities
├── CodeExplorer.tsx        # Tool for exploring project code
└── App.tsx                 # Main application component
```

## 📋 File Structure Guidelines

To maintain consistency and organization across all applications built from this template, follow these file structure guidelines:

### 🗂️ Folder-First Organization
**Always organize files within folders, never add files directly to root directories.**

#### ✅ Correct Structure:
```
src/
├── pages/
│   ├── dashboard/
│   │   ├── DashboardPage.tsx
│   │   ├── components/
│   │   │   ├── StatsCard.tsx
│   │   │   └── ChartWidget.tsx
│   │   └── index.ts
│   └── analytics/
│       ├── AnalyticsPage.tsx
│       └── index.ts
├── utils/
│   ├── dateHelpers/
│   │   ├── formatDate.ts
│   │   └── index.ts
│   └── apiHelpers/
│       ├── fetchData.ts
│       └── index.ts
```

#### ❌ Incorrect Structure:
```
src/
├── pages/
│   ├── DashboardPage.tsx     # ❌ File directly in pages folder
│   └── AnalyticsPage.tsx     # ❌ File directly in pages folder
├── utils/
│   ├── formatDate.ts         # ❌ File directly in utils folder
│   └── fetchData.ts          # ❌ File directly in utils folder
```

### 🎯 Naming Conventions

#### Folders:
- Use **camelCase** for folder names
- Be descriptive and specific: `userManagement/` not `user/`
- Group related functionality: `authentication/`, `dataVisualization/`

#### Files:
- **Components**: Use **PascalCase** with descriptive names
  - `UserProfileCard.tsx`, `NavigationSidebar.tsx`
- **Utilities**: Use **camelCase** with action-oriented names
  - `formatCurrency.ts`, `validateEmail.ts`
- **Pages**: Use **PascalCase** ending with "Page"
  - `DashboardPage.tsx`, `UserSettingsPage.tsx`

### 📦 Module Organization

#### Feature-Based Grouping:
Each major feature should have its own folder with all related files:

```
src/pages/userManagement/
├── UserManagementPage.tsx    # Main page component
├── components/               # Feature-specific components
│   ├── UserList.tsx
│   ├── UserForm.tsx
│   └── UserCard.tsx
├── hooks/                    # Feature-specific hooks
│   ├── useUserData.ts
│   └── useUserValidation.ts
├── types/                    # Feature-specific types
│   └── userTypes.ts
└── index.ts                  # Clean exports
```

#### Index Files:
Always include an `index.ts` file in folders to provide clean imports:

```typescript
// src/pages/userManagement/index.ts
export { UserManagementPage } from './UserManagementPage';
export { UserList, UserForm, UserCard } from './components';
export type { User, UserFormData } from './types/userTypes';
```

### 🔄 Import Organization

#### Import Order:
1. External libraries (React, third-party packages)
2. Internal core components (`../components/Core/`)
3. Shared components (`../components/Shared/`)
4. Local components (relative imports)
5. Types and interfaces
6. Utilities and helpers

```typescript
// External libraries
import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Core components
import { LoadingSpinner } from '../components/Core/LoadingSpinner';

// Shared components
import { Button, Card } from '../components/Shared/SharedComponents';

// Local components
import { UserCard } from './components/UserCard';

// Types
import type { User } from './types/userTypes';

// Utilities
import { formatDate } from '../utils/dateHelpers';
```

### 🎨 Component Organization

#### Single Responsibility:
Each component file should focus on one specific piece of functionality:

```
src/pages/dashboard/components/
├── StatsCard.tsx           # Displays a single statistic
├── StatsGrid.tsx           # Arranges multiple StatsCards
├── ChartWidget.tsx         # Renders a specific chart
└── DashboardHeader.tsx     # Page header with title and actions
```

#### Component Size Guidelines:
- **Target**: 100-300 lines per component file
- **Maximum**: 500 lines (if exceeded, consider breaking into smaller components)
- **Minimum**: Extract reusable logic into custom hooks or utility functions

### 📝 Documentation Standards

#### Component Documentation:
```typescript
/**
 * UserCard - Displays user information in a card format
 * 
 * @param user - User object containing name, email, and avatar
 * @param onEdit - Callback function when edit button is clicked
 * @param onDelete - Callback function when delete button is clicked
 */
interface UserCardProps {
  user: User;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
}
```

#### Folder README Files:
For complex features, include a `README.md` in the feature folder:

```
src/pages/userManagement/README.md
```

### 🚀 Benefits of This Structure

1. **Scalability**: Easy to add new features without cluttering existing directories
2. **Maintainability**: Related files are grouped together, making them easier to find and modify
3. **Reusability**: Clear separation between shared and feature-specific components
4. **Team Collaboration**: Consistent structure reduces onboarding time for new developers
5. **Future Integration**: Well-organized modules can be easily combined during platform consolidation

### 🔍 Quick Reference

**Before adding any new file, ask:**
1. Does this belong in an existing feature folder?
2. Should I create a new feature folder for this?
3. Is this a shared component that multiple features will use?
4. Does this file have a clear, single responsibility?

**Remember**: It's better to have more folders with fewer files than fewer folders with many files.

## ⌨️ Hidden Developer Tools

The TriggerGrain Framework includes hidden developer tools accessible via keyboard shortcuts:

### Code Explorer
- **Shortcut**: `Ctrl+Shift+C` (Windows/Linux) or `Cmd+Shift+C` (Mac)
- **Purpose**: Browse and export the entire project file structure
- **Features**:
  - View all project files in a tree structure
  - Select multiple files for export
  - Copy selected files to clipboard with proper formatting
  - Download selected files as a text file
  - Search functionality to filter files
  - Syntax highlighting for code preview

### Schema Explorer
- **Shortcut**: `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (Mac)
- **Purpose**: Analyze database schema, relationships, and structure
- **Features**:
  - Execute predefined SQL queries for schema analysis
  - **Selective execution**: Choose which queries to run with checkboxes
  - **Query preview**: Click any query to view its SQL content before execution
  - **Real-time execution**: See queries execute one by one with progress indicators
  - View table structures, foreign keys, relationships, and RLS policies
  - Copy all results to clipboard for documentation
  - **Configurable queries**: Stored in `schema_queries` table with easy management
  - **Error handling**: Clear error messages for failed queries
  - **Performance metrics**: Execution time displayed for each query

### Adding Custom Schema Queries

To add new schema analysis queries, insert them into the `schema_queries` table:

```sql
INSERT INTO schema_queries (name, description, sql_query, sort_order) VALUES
('Table Structure', 'Get all table columns and types', 
 'SELECT t.table_name, c.column_name, c.data_type FROM information_schema.tables t...', 1),
('RLS Policies', 'List all Row Level Security policies', 
 'SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = ''public''', 2);
```

**Query Requirements**:
- Queries should return tabular data (SELECT statements)
- Avoid trailing semicolons in the SQL (they're handled automatically)
- Use single quotes for string literals within the query
- Results are automatically converted to JSON format for display
**Note**: These tools are designed for development and debugging purposes. They should not be exposed to end users in production applications.

## 🗄️ Database Schema

### navigation_items Table
```sql
CREATE TABLE navigation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  icon_name text NOT NULL DEFAULT 'Circle',
  subdomain text NOT NULL,
  color text NOT NULL DEFAULT 'tg-primary',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  redirect_active boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## 🚀 Deployment Strategy

### Development Workflow
1. Develop features in the main template.
2. Test navigation and authentication.
3. Duplicate template for specific applications (Phase 1).
4. Deploy each application to its subdomain.
5. Configure DNS and SSL for all subdomains.
6. (Future) Systematically combine applications into a single deployment (Phase 2).

### SPA Routing Configuration

The framework is configured as a Single Page Application (SPA) with client-side routing. To ensure proper routing on static hosting platforms like Netlify, the following configurations are included:

#### Netlify Configuration
The project includes both `netlify.toml` and `public/_redirects` files with the necessary redirect rules:

```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

```
# public/_redirects
/*    /index.html   200
```

#### Why This Is Needed
- **Client-Side Routing**: React Router handles navigation on the client side
- **Direct URL Access**: Users can bookmark and share deep links like `/clients/scott-farms`
- **Refresh Protection**: Prevents 404 errors when users refresh the page on any route
- **SEO Benefits**: Search engines can properly index all routes

#### Other Hosting Platforms
For other static hosting platforms, similar redirect rules are needed:

**Vercel** (`vercel.json`):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Apache** (`.htaccess`):
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

### Production Considerations
- **Database**: Single Supabase instance shared across all apps.
- **Authentication**: Cross-subdomain session sharing.
- **CDN**: Configure for multiple subdomains.
- **Monitoring**: Centralized logging and analytics.
- **SPA Routing**: Ensure redirect rules are configured for each deployment platform.

## 🔄 Maintenance

### Template Updates
When updating the core template:
1. Make changes to the master template.
2. Test thoroughly in development.
3. **Navigation changes are automatic** - no need to update each app.
4. Deploy updates to all subdomains.

### Adding Features
- **New navigation items are automatic** - just add to Supabase.
- Shared components should be updated in the template first.
- Authentication changes affect all applications.

### Navigation Management
- **Centralized Control**: Manage all navigation from one Supabase dashboard.
- **Instant Updates**: Changes reflect immediately across all applications.
- **A/B Testing**: Enable/disable features dynamically.
- **Maintenance Mode**: Temporarily hide applications during updates.

## 🎛️ Advanced Features

### Real-time Navigation Updates
The system uses Supabase's real-time features to instantly sync navigation changes:
- **WebSocket Connection**: Maintains live connection to database.
- **Automatic Refresh**: Navigation updates without page reload.
- **Fallback Handling**: Graceful degradation if real-time fails.

### Icon System
- **Extensible**: Easy to add new Lucide icons.
- **Type Safe**: TypeScript ensures icon names are valid.
- **Fallback**: Unknown icons default to Circle.

### Color Theming
- **Consistent**: Uses your defined color palette.
- **Dynamic**: Colors can be changed per navigation item.
- **Accessible**: Proper contrast ratios maintained.

## 🤝 Contributing

When contributing to this template:
1. Maintain design consistency.
2. Test authentication flows.
3. Ensure responsive design.
4. **Test navigation updates** in real-time.
5. Update documentation.
6. Consider impact on all deployed applications.

### Adding New Icons
To add new Lucide icons to the system:
1. Import the icon in `src/utils/iconMapper.ts`.
2. Add it to the `iconMap` object.
3. The icon becomes available immediately for navigation items.

## 📄 License

This template is proprietary to TriggerGrain and intended for internal use in creating the TriggerGrain application ecosystem.