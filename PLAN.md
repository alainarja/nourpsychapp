# Shift & Thrive — Product & Technical Plan

Mental-health marketplace connecting **clients**, **psychologists / psychiatrists**, **organizations** (employers) and platform **admins**.

- **Phase 1 (this repo):** Expo (JavaScript) + Expo Router. Every feature has working UI on an offline AsyncStorage database. Anything that needs a server (emails, SMS, payments, video, AI, file uploads) is **simulated** and labelled in the app.
- **Phase 2:** backend with MongoDB (section 5).

## Running it

```bash
npm install
npx expo start        # press w for web, or scan the QR code with Expo Go
```

| Demo account (password `demo123`) | Role |
|---|---|
| `bella@demo.com` | Client (her sessions with Acme's providers are employer-covered) |
| `nour@demo.com` | Psychologist |
| `karim.h@demo.com` | Psychiatrist (medications + e-prescriptions) |
| `hr@acme.demo` | Organization (Acme Corp) |
| `admin@demo.com` | Platform admin |

Verification, password-reset and 2FA codes are always **`123456`** in offline mode. Promo code: **`THRIVE10`**.
"Reset demo data" is under Profile / More.

---

## 1. Architecture

```
src/
  app/                        Expo Router — every file is a screen
    _layout.js                Providers: SafeArea → I18n → Auth (seeds DB, restores session)
    index.js                  Redirects to homeFor(user)
    (auth)/                   welcome, pro-welcome, sign-up (?role=client|pro|org), sign-in,
                              verify-email, consent, two-factor, forgot-password
    client/  pro/  org/  admin/   One area per role; each _layout is a RoleStack guard
    messages/  call/  checkout.js  receipts/  notifications.js  settings/
    crisis.js  assessment/[type].js     Shared across roles
  components/                 ui.js (design system), RoleStack, NotificationBell, Calendar, …
  context/AuthContext.js      Sign up/in, 2FA, email verification, consent, reset, delete account
  i18n/                       en.js / ar.js dictionaries, RTL switching
  db/
    db.js                     AsyncStorage collections + live useCollection() hook
    actions.js                Domain operations (booking, cancellations, messaging, reviews,
                              purchases, notifications) — the future API surface
    seed.js                   Loads seed-data/ and resolves relative-date tokens
    seed-data/*.json          Demo data, one file per collection (see its README)
  data/                       Static content (assessments, Mirror replies, note templates, consents)
  utils/                      Dates, alerts, card/IBAN validation, placeholder hashing
```

**Onboarding gate:** `onboardingRoute(user)` sends a new account through **verify email → consent**. Only then does `RoleStack` let it into its role area.

## 2. Feature status

✅ = working UI on offline data · 🔌 = simulated, needs backend/integration

| Area | Feature | Status |
|---|---|---|
| Auth | Sign up (client / pro / org), sign in, sign out | ✅ (🔌 real auth) |
| | Email verification, password reset, 2FA | ✅ UI · 🔌 email/SMS delivery |
| | Consent & onboarding (role-aware, required items) | ✅ |
| Client | Home + mood check-in, Find My Match, match quiz, therapist profile + reviews | ✅ |
| | Booking → checkout (cards, promo, employer coverage) → receipt | ✅ · 🔌 payment provider |
| | Therapy tab: join call, cancel (late-cancel warning), reschedule, review | ✅ |
| | Mirror AI (offline rules + crisis detection) | ✅ · 🔌 real LLM |
| | Marketplace, workshops, journey, assessments, medications + adherence | ✅ · 🔌 file/video delivery |
| Shared | Secure messaging (crisis check on client messages) | ✅ · 🔌 realtime + encryption |
| | Video call (waiting room, in-call controls) | ✅ UI · 🔌 video SDK |
| | Notification center + preferences | ✅ in-app · 🔌 push/email/SMS |
| | Settings: account, security, privacy (export / delete data), language, payment methods | ✅ |
| | Arabic + RTL | ✅ auth, settings, tabs · ⏳ other screens still English |
| Pro | Home stats, clients, client record (notes, assessments), calendar, availability + cancellation policy | ✅ |
| | License verification (documents → admin review) | ✅ · 🔌 file uploads |
| | Psychiatrist: medications, e-prescriptions, allergies/conditions | ✅ · 🔌 licensed e-Rx integration |
| | Marketplace, earnings, payouts (IBAN), reviews (reply / report), workshops, AI assistant, growth | ✅ · 🔌 payouts, AI |
| Admin | Dashboard, verifications (approve/reject), users (suspend), moderation reports | ✅ |
| Org | Dashboard (aggregated + anonymised), members (invite), providers, plan & seats | ✅ · 🔌 invites, billing |

## 3. Data model (one AsyncStorage key per collection → one MongoDB collection)

| Collection | Key fields |
|---|---|
| users | role `client/pro/org/admin`, name, email, password, emailVerified, consentedAt, consents, twoFactor, suspended, notificationPrefs, privacy · **pro:** proType, title, license, verified, verificationStatus, verificationDocs[], about, specialties[], languages[], sessionTypes[], price, sessionLength, cancellationHours, availability, blockedDates[], rating, reviews, payoutMethod · **client:** orgId, matchPrefs · **org:** plan, seats, sessionsPerMember, proIds[] |
| appointments | proId, clientId, date, time, mode, status, price, type, payment{…}, paymentStatus, reviewed |
| messages | threadId, fromId, toId, text, read |
| notifications | userId, title, body, type, link, read |
| reviews | proId, clientId, appointmentId, rating, text, anonymous, reply |
| notes · assessments · moods · goals · chats · favorites | clinical and wellbeing records |
| medications · prescriptions · medLogs · medReminders · clinicalProfiles | psychiatry and medication tracking |
| products · orders · workshops · registrations | marketplace |
| paymentMethods · payouts | billing (cards keep brand / last4 / expiry only) |
| orgMembers | orgId, userId?, email, department, status, sessionsUsed |
| reports | type, targetId, reason, status, reporterId |

## 4. Still to decide / do

1. **Launch market and compliance framework.** HIPAA, GDPR or local law (e.g. Lebanon). This decides hosting, encryption and data retention. Crisis numbers in `src/app/crisis.js` assume Lebanon (112 / Embrace 1564).
2. **Finish translations.** The client, pro, admin and org feature screens are still English.
3. **Accessibility pass** (screen-reader labels, dynamic type) and **dark mode**.

## 5. Backend plan (MongoDB)

**Stack suggestion:** Node.js (Express or NestJS) + MongoDB Atlas (encryption at rest; HIPAA-eligible tier if needed) + Mongoose.

**Migration steps**
1. **Collections:** each `src/db/seed-data/<name>.json` becomes a collection. Keep string ids as `_id` (or `id` with a unique index). References are already plain id strings.
2. **Seed script:** reuse the same JSON files with the same token rules as `resolveTokens()` in `src/db/seed.js`. Replace the placeholder hash with bcrypt/argon2.
3. **API:** `src/db/actions.js` + `AuthContext.js` define the API surface. Make each function an endpoint, e.g.:
   - `POST /appointments`
   - `POST /appointments/:id/cancel`
   - `POST /messages`
   - `POST /reviews`
   - `POST /auth/verify-email`
4. **Client swap:** replace the internals of `db.js` / `useCollection` with fetch + React Query. Screens stay unchanged.
5. **Move these to the server:**
   - auth (JWT/refresh tokens, 2FA via TOTP/SMS)
   - booking-clash checks
   - rating recalculation
   - organization coverage counting
   - notification fan-out
   - promo codes
6. **Indexes:**
   - `users.email` (unique)
   - `appointments {proId, date, time}` (unique, partial: status ≠ cancelled)
   - `messages.threadId`
   - `notifications {userId, read}`

| Integration | Suggested |
|---|---|
| Payments + payouts | Stripe Connect or a local gateway |
| Video | Daily / Twilio / Agora |
| Realtime messaging | Socket.IO or MongoDB change streams |
| Push / email / SMS | Expo Notifications, SendGrid/Resend, Twilio |
| File storage (licenses, products, recordings) | S3-compatible storage with signed URLs |
| AI (Mirror, AI Assistant) | Claude API called from the server only, with safety layer and audit logs |
| E-prescriptions | Licensed regional e-Rx provider (regulated) |
