
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
│  │  ├─ attendance
│  │  │  ├─ attendance-notifications.controller.ts
│  │  │  ├─ attendance-notifications.service.ts
│  │  │  ├─ attendance.controller.ts
│  │  │  ├─ attendance.module.ts
│  │  │  ├─ attendance.service.ts
│  │  │  ├─ class-schedule.controller.ts
│  │  │  ├─ dto
│  │  │  │  ├─ create-assignment.dto.ts
│  │  │  │  ├─ create-schedule.dto.ts
│  │  │  │  ├─ mark-attendance.dto.ts
│  │  │  │  └─ update-instructor-profile.dto.ts
│  │  │  ├─ entities
│  │  │  │  ├─ attendance-record.entity.ts
│  │  │  │  ├─ class-schedule.entity.ts
│  │  │  │  ├─ instructor-assignment.entity.ts
│  │  │  │  └─ trimester-schedule.entity.ts
│  │  │  ├─ instructor-assignment.controller.ts
│  │  │  ├─ instructor-profile.controller.ts
│  │  │  └─ TrimesterScheduleController.ts
│  │  ├─ auth
│  │  │  ├─ auth.controller.ts
│  │  │  ├─ auth.module.ts
│  │  │  ├─ auth.service.ts
│  │  │  ├─ constants
│  │  │  │  └─ roles.constant.ts
│  │  │  ├─ decorators
│  │  │  │  └─ roles.decorator.ts
│  │  │  ├─ dto
│  │  │  │  └─ login.dto.ts
│  │  │  ├─ guards
│  │  │  │  ├─ jwt-auth.guard.ts
│  │  │  │  └─ roles.guard.ts
│  │  │  ├─ jwt.config.ts
│  │  │  ├─ strategies
│  │  │  │  └─ jwt.strategy.ts
│  │  │  └─ types
│  │  │     └─ user-role.type.ts
│  │  ├─ config
│  │  │  ├─ competence.controller.ts
│  │  │  ├─ competence.service.ts
│  │  │  ├─ config.controller.ts
│  │  │  ├─ config.module.ts
│  │  │  ├─ config.service.ts
│  │  │  ├─ database.config.ts
│  │  │  ├─ datasource.config.ts
│  │  │  ├─ entities
│  │  │  │  ├─ center.entity.ts
│  │  │  │  ├─ competence.entity.ts
│  │  │  │  ├─ coordination.entity.ts
│  │  │  │  ├─ ficha-competence.entity.ts
│  │  │  │  ├─ ficha.entity.ts
│  │  │  │  ├─ personnel-type.entity.ts
│  │  │  │  ├─ program.entity.ts
│  │  │  │  └─ regional.entity.ts
│  │  │  ├─ ficha-competence.controller.ts
│  │  │  ├─ ficha-competence.service.ts
│  │  │  ├─ timezone.controller.ts
│  │  │  ├─ timezone.module.ts
│  │  │  └─ timezone.service.ts
│  │  ├─ dashboard
│  │  │  ├─ dashboard.controller.spec.ts
│  │  │  ├─ dashboard.controller.ts
│  │  │  ├─ dashboard.module.ts
│  │  │  ├─ dashboard.service.spec.ts
│  │  │  └─ dashboard.service.ts
│  │  ├─ database
│  │  │  └─ seeders
│  │  │     ├─ seed-simple.command.ts
│  │  │     ├─ seed.command.ts
│  │  │     └─ simple-seed.ts
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
├─ frontend
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ public
│  │  └─ vite.svg
│  ├─ README.md
│  ├─ src
│  │  ├─ App.css
│  │  ├─ App.tsx
│  │  ├─ assets
│  │  │  └─ react.svg
│  │  ├─ components
│  │  │  ├─ access
│  │  │  │  ├─ AccessHistory.tsx
│  │  │  │  ├─ CurrentOccupancy.tsx
│  │  │  │  └─ QRScanner.tsx
│  │  │  ├─ attendance
│  │  │  │  └─ AttendanceNotifications.tsx
│  │  │  ├─ auth
│  │  │  │  └─ PrivateRoute.tsx
│  │  │  ├─ ficha
│  │  │  │  └─ FichaCompetenceManagement.tsx
│  │  │  ├─ import
│  │  │  │  ├─ ExcelImport.tsx
│  │  │  │  └─ ImportLearners.tsx
│  │  │  ├─ layout
│  │  │  │  ├─ Header.tsx
│  │  │  │  ├─ Layout.tsx
│  │  │  │  └─ Sidebar.tsx
│  │  │  ├─ profiles
│  │  │  │  ├─ ProfileList.tsx
│  │  │  │  └─ ProfileView.tsx
│  │  │  └─ users
│  │  │     ├─ UserForm.tsx
│  │  │     ├─ UserList.tsx
│  │  │     └─ UserView.tsx
│  │  ├─ context
│  │  │  └─ AuthContext.tsx
│  │  ├─ hooks
│  │  │  ├─ useAttendanceRealtime.ts
│  │  │  └─ useDateSync.ts
│  │  ├─ index.css
│  │  ├─ main.tsx
│  │  ├─ pages
│  │  │  ├─ AccessControl.tsx
│  │  │  ├─ Configuration.tsx
│  │  │  ├─ Dashboard.tsx
│  │  │  ├─ ImportPage.tsx
│  │  │  ├─ InstructorAttendance.tsx
│  │  │  ├─ InstructorDashboard.tsx
│  │  │  ├─ InstructorManagement.tsx
│  │  │  ├─ InstructorProfile.tsx
│  │  │  ├─ LearnerProfile.tsx
│  │  │  ├─ Login.tsx
│  │  │  ├─ MyClasses.tsx
│  │  │  ├─ ProfileManagement.tsx
│  │  │  ├─ TrimesterScheduleManagement.tsx
│  │  │  └─ UserManagement.tsx
│  │  ├─ services
│  │  │  ├─ accessService.ts
│  │  │  ├─ api.ts
│  │  │  ├─ attendanceService.ts
│  │  │  ├─ authService.ts
│  │  │  ├─ configService.ts
│  │  │  ├─ dashboardService.ts
│  │  │  ├─ fichaCompetenceService.ts
│  │  │  ├─ importService.ts
│  │  │  ├─ instructorAssignmentService.ts
│  │  │  ├─ instructorService.ts
│  │  │  ├─ learnerService.ts
│  │  │  ├─ profileService.ts
│  │  │  ├─ scheduleService.ts
│  │  │  ├─ timezoneService.ts
│  │  │  └─ userService.ts
│  │  ├─ styles
│  │  │  └─ enhanced-userlist.css
│  │  ├─ types
│  │  │  └─ user.types.ts
│  │  ├─ utils
│  │  │  ├─ carnetGenerator.ts
│  │  │  └─ sweetAlertUtils.ts
│  │  └─ vite-env.d.ts
│  ├─ tailwind.config.js
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  └─ vite.config.ts
├─ package-lock.json
├─ package.json
└─ README.md

```