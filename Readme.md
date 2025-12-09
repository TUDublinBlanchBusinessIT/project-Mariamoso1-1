# Care Connect Guardian

Care Connect Guardian is a care-monitoring companion app for family members and legal guardians of domiciliary care recipients who need reliable, real-time visibility into visits, caregiver attendance, and welfare status. 

The app connects as a consented third-party layer to agency systems via cross-platform adapters, enforcing role-based access controls and explicit consent scopes. The primary benefit is dependable, explainable confirmation of who attended, when, and what occurred; the secondary benefit is proactive notifications for substitutions or delays with concise welfare summaries and a tamper-evident audit trail.

---

## Core Idea

Help users monitor ongoing care activities of their relatives, children, or ward by providing:
- **Real-time visibility** into caregiver visits and attendance
- **Proactive alerts** for substitutions, delays, or absences
- **Audit trail** of all care interactions with tamper-evident logging
- **Peace of mind** through transparent, explainable care monitoring

---

## Features Implemented (CA2 Scope)

- **Bottom-tab navigation** across all core screens
- **Responsive mobile UI** via Expo for cross-platform compatibility
- **Firebase Firestore integration** for real-time data synchronization
- **Secure storage** of visit logs, profile information, and profile pictures
- **Visit logging system** to track caregiver punctuality, attendance, and visit details
- **Alert system** for substitutions, delays, or caregiver absences
- **Real-time updates** on visit status and care activities
- **Profile management** with photo upload capability

---

## Screens

### Home (Dashboard)
- Overview of completed and upcoming visits
- Active alerts displayed prominently
- Today's scheduled visits at a glance
- Quick access to log new visits
- Real-time status updates

### Visit Logs
- Comprehensive visit history with timestamps
- Caregiver attendance records
- Visit duration and Punctuality tracking

### Add Log Entry
- Visit logging form with date/time picker
- Caregiver selection and visit details
- Notes field for additional observations
- Immediate Firestore sync upon submission

### Alerts
- Ongoing and resolved alerts
- Substitution notifications
- Delay warnings
- Absence alerts



---

## Tech Stack

- **React Native** — Cross-platform mobile development framework
- **Expo** — Development platform and toolchain
- **Expo Router** — File-based routing for navigation
- **TypeScript** — Type-safe development
- **React Native StyleSheet** — Component styling
- **Expo Vector Icons** — Icon library for UI elements
- **React Native Community Date/Time Picker** — Date and time selection
- **Firebase & Firestore** — Backend database and authentication
- **Firebase Storage** — Profile picture and document storage

---

## How to Run Locally

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI installed globally
- Firebase project configured with Firestore and Storage enabled

### Installation Steps

1. **Clone the repository:**
```bash
   git clone <repository-url>
   cd care-connect-guardian
```

2. **Install dependencies:**
```bash
   npm install
```

3. **Configure Firebase:**
   - Create a `firebaseConfig.js` file in the project root
   - Add your Firebase configuration:
```javascript
     export const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_AUTH_DOMAIN",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_STORAGE_BUCKET",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
     };
```

4. **Start the development server:**
```bash
   npx expo start
```

5. **Run the app:**
   - **iOS:** Press `i` in the terminal or scan QR code with Expo Go app
   - **Android:** Press `a` in the terminal or scan QR code with Expo Go app
   - **Web:** Press `w` in the terminal for web preview

---

## Project Structure
```
project-Mariamoso1-1/
├── app/                          # Main application screens (Expo Router)
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx            # Login screen
│   │   ├── signup.tsx           # Sign up with profile data
│   │   └── complete-profile.tsx # Profile completion for existing users
│   │
│   ├── (tabs)/                   # Bottom tab navigation screens
│   │   ├── _layout.tsx          # Tab navigation configuration (5 tabs)
│   │   ├── index.tsx            # Home/Dashboard screen
│   │   ├── visits.tsx           # Visit history & management
│   │   ├── add-visit.tsx        # Add new visit form
│   │   ├── alerts.tsx           # Alert notifications screen
│   │   └── profile.tsx          # User profile management
│   │
│   ├── _layout.tsx              # Root layout with auth protection
│   └── +not-found.tsx           # 404 error screen
│
├── assets/                       # Static assets
│   ├── fonts/                   # Custom fonts
│   └── images/                  # Images and icons
│       └── logo.png             # App logo
│
├── components/                   # Reusable UI components
│   ├── ui/                      # UI component library
│   │   ├── button.tsx           # Custom button component
│   │   ├── container.tsx        # Screen container wrapper
│   │   ├── haptic-tab.tsx       # Tab with haptic feedback
│   │   └── icon-symbol.tsx      # Icon symbol component
│   └── [other components]
│
├── constants/                    # App constants
│   └── theme.ts                 # Color theme definitions
│
├── Context/                      # React Context providers
│   └── Authcontext.tsx          # Authentication & user profile context
│
├── config/                       # Configuration files
│   └── firebaseConfig.ts        # Firebase initialization & exports
│
├── hooks/                        # Custom React hooks
│   └── use-color-scheme.ts      # Dark/light mode hook
│
├── lib/                          # Utility libraries & services
│   ├── imageUtils.ts            # Image picker & compression utilities
│   ├── userService.ts           # User profile CRUD operations
│   └── visitService.ts          # Visit CRUD & auto-flagging logic
│
├── scripts/                      # Build & utility scripts
│
├── .gitignore                   # Git ignore rules
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript configuration
└── README.md                    # Project documentation

```

---

## Key Functionalities

### Visit Logging
- Log caregiver arrivals and departures with precise timestamps
- Record visit duration and punctuality metrics
- Add notes and observations for each visit
- Attach photos or documents as evidence

### Alert System
- Real-time notifications for caregiver substitutions
- Delay warnings when caregivers are running late
- Absence alerts for missed visits
- Color-coded priority levels (Critical, Warning, Info)

---

## Future Enhancements (Post-CA2)

- Integration with care agency systems via API adapters
- Advanced analytics and reporting dashboard
- Multi-user access with role-based permissions
- Push notifications for mobile alerts
- Offline mode with sync capabilities
- Calendar integration for visit scheduling
- In-app messaging between guardians and care agencies

---

## Assignment Context (CA2)

This project was developed as part of a mobile app development assignment (CA2) focusing on:
- **Version control best practices** with structured Git commits
- **Firebase integration** for real-time data management
- **React Native development** with Expo Router
- **TypeScript implementation** for type safety
- **UI/UX design** for mobile-first experiences
- **Documentation** of development process and AI usage

---

## License

This project is developed for educational purposes as part of university coursework.

---

## Contact

For questions or feedback regarding this project, please contact the development team through the university assignment portal.