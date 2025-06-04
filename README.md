
```
Accesum-SENA
├─ backend
│  ├─ .prettierrc
│  ├─ eslint.config.mjs
│  ├─ nest-cli.json
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ README.md
│  ├─ src
│  │  ├─ access
│  │  │  ├─ access.controller.ts
│  │  │  ├─ access.module.ts
│  │  │  ├─ access.service.ts
│  │  │  └─ entities
│  │  │     └─ access-record.entity.ts
│  │  ├─ app.controller.spec.ts
│  │  ├─ app.controller.ts
│  │  ├─ app.module.ts
│  │  ├─ app.service.ts
│  │  ├─ auth
│  │  │  ├─ auth.controller.ts
│  │  │  ├─ auth.module.ts
│  │  │  ├─ auth.service.ts
│  │  │  ├─ decorators
│  │  │  │  └─ roles.decorator.ts
│  │  │  ├─ dto
│  │  │  │  └─ login.dto.ts
│  │  │  ├─ guards
│  │  │  │  ├─ jwt-auth.guard.ts
│  │  │  │  └─ roles.guard.ts
│  │  │  ├─ jwt.config.ts
│  │  │  └─ strategies
│  │  │     └─ jwt.strategy.ts
│  │  ├─ config
│  │  │  ├─ config.controller.ts
│  │  │  ├─ config.module.ts
│  │  │  ├─ database.config.ts
│  │  │  └─ entities
│  │  │     ├─ center.entity.ts
│  │  │     ├─ coordination.entity.ts
│  │  │     ├─ ficha.entity.ts
│  │  │     ├─ personnel-type.entity.ts
│  │  │     ├─ program.entity.ts
│  │  │     └─ regional.entity.ts
│  │  ├─ dashboard
│  │  │  ├─ dashboard.controller.spec.ts
│  │  │  ├─ dashboard.controller.ts
│  │  │  ├─ dashboard.module.ts
│  │  │  ├─ dashboard.service.spec.ts
│  │  │  └─ dashboard.service.ts
│  │  ├─ database
│  │  │  └─ seeders
│  │  │     ├─ initial-data.seeder.ts
│  │  │     └─ seed.command.ts
│  │  ├─ import
│  │  │  ├─ import-excel.dto.ts
│  │  │  ├─ import-learners.dto.ts
│  │  │  ├─ import.controller.ts
│  │  │  ├─ import.module.ts
│  │  │  └─ import.service.ts
│  │  ├─ learner
│  │  │  ├─ learner.controller.ts
│  │  │  ├─ learner.module.ts
│  │  │  └─ learner.service.ts
│  │  ├─ main.ts
│  │  ├─ profiles
│  │  │  ├─ entities
│  │  │  │  └─ profile.entity.ts
│  │  │  ├─ profiles.controller.ts
│  │  │  ├─ profiles.module.ts
│  │  │  └─ profiles.service.ts
│  │  ├─ types
│  │  │  └─ multer.d.ts
│  │  └─ users
│  │     ├─ entities
│  │     │  ├─ role.entity.ts
│  │     │  └─ user.entity.ts
│  │     ├─ users.controller.ts
│  │     ├─ users.module.ts
│  │     └─ users.service.ts
│  ├─ test
│  │  ├─ app.e2e-spec.ts
│  │  └─ jest-e2e.json
│  ├─ test-connection.js
│  ├─ tsconfig.build.json
│  └─ tsconfig.json
└─ frontend
   ├─ eslint.config.js
   ├─ index.html
   ├─ package-lock.json
   ├─ package.json
   ├─ postcss.config.js
   ├─ public
   │  └─ vite.svg
   ├─ README.md
   ├─ src
   │  ├─ App.css
   │  ├─ App.tsx
   │  ├─ assets
   │  │  └─ react.svg
   │  ├─ components
   │  │  ├─ access
   │  │  │  ├─ AccessHistory.tsx
   │  │  │  ├─ CurrentOccupancy.tsx
   │  │  │  └─ QRScanner.tsx
   │  │  ├─ auth
   │  │  │  └─ PrivateRoute.tsx
   │  │  ├─ import
   │  │  │  ├─ ExcelImport.tsx
   │  │  │  └─ ImportLearners.tsx
   │  │  ├─ layout
   │  │  │  ├─ Header.tsx
   │  │  │  ├─ Layout.tsx
   │  │  │  └─ Sidebar.tsx
   │  │  ├─ profiles
   │  │  │  ├─ ProfileList.tsx
   │  │  │  └─ ProfileView.tsx
   │  │  └─ users
   │  │     ├─ UserForm.tsx
   │  │     ├─ UserList.tsx
   │  │     └─ UserView.tsx
   │  ├─ context
   │  │  └─ AuthContext.tsx
   │  ├─ index.css
   │  ├─ main.tsx
   │  ├─ pages
   │  │  ├─ AccessControl.tsx
   │  │  ├─ Configuration.tsx
   │  │  ├─ Dashboard.tsx
   │  │  ├─ ImportPage.tsx
   │  │  ├─ LearnerProfile.tsx
   │  │  ├─ Login.tsx
   │  │  ├─ ProfileManagement.tsx
   │  │  └─ UserManagement.tsx
   │  ├─ services
   │  │  ├─ accessService.ts
   │  │  ├─ api.ts
   │  │  ├─ authService.ts
   │  │  ├─ configService.ts
   │  │  ├─ dashboardService.ts
   │  │  ├─ importService.ts
   │  │  ├─ learnerService.ts
   │  │  ├─ profileService.ts
   │  │  └─ userService.ts
   │  ├─ utils
   │  │  ├─ carnetGenerator.ts
   │  │  └─ sweetAlertUtils.ts
   │  └─ vite-env.d.ts
   ├─ tailwind.config.js
   ├─ tsconfig.app.json
   ├─ tsconfig.json
   ├─ tsconfig.node.json
   └─ vite.config.ts

```