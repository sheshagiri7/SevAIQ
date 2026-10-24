# SevAIQ Public Kiosk Mode Architecture & Security Guidelines

## 1. Overview & Purpose

SevAIQ is designed to serve citizens across India, many of whom access digital welfare services through shared public terminals, including:
- **Common Service Centres (CSCs)**
- **e-Seva / MeeSeva / MeeSeva kendras**
- **Gram Panchayat digital desks**
- **Public libraries and community cyber centers**

Public Kiosk Mode ensures that when citizens share a physical computer terminal to discover schemes, review eligibility criteria, assess document requirements, or track welfare applications, their Personally Identifiable Information (PII) and sensitive social records are **never stored on disk or leaked to subsequent terminal users**.

---

## 2. Application-Level Privacy Guarantees

When Public Kiosk Mode is enabled, SevAIQ enforces strict zero-persistence and ephemeral session guarantees:

### 2.1 Zero-Persistence Policy
- **No Disk Storage**: Demographic profiles, caste categories, income details, disability status, document checklist selections, tracked scheme IDs, personal application notes, status updates, and reminders are **never written** to `localStorage`, `sessionStorage`, `IndexedDB`, or cookies.
- **Immediate Purge on Activation**: Enabling Public Kiosk Mode immediately purges any previously stored citizen keys from both `localStorage` and `sessionStorage`.
- **Immediate Purge on Session Exit**: Exiting Public Kiosk Mode ends the active citizen session immediately, purges all in-memory React state, clears any lingering browser storage, and returns to a clean greeting screen.
- **Guarded Mode Cancellation**: If an operator or citizen opens the enable or disable confirmation dialog and clicks **Cancel** (or presses `Escape`), the existing mode and all existing data remain 100% untouched.

### 2.2 Purged Citizen Keys
The following storage keys are strictly purged and blocked from persistent writes during Kiosk Mode:
| Storage Key | Content Type | Protection Rule |
| :--- | :--- | :--- |
| `sevaiq_citizen_profile` | Age, gender, caste, income, disability, landholding | Never written in Kiosk Mode; memory only |
| `sevaiq_documents` | Citizen document ownership statuses (`have`/`need`) | Never written in Kiosk Mode; memory only |
| `sevaiq_selected_schemes` | Selected welfare schemes for comparison/planning | Never written in Kiosk Mode; memory only |
| `SEVAIQ_APPLICATION_PROGRESS` | Completed checklist steps per scheme | Never written in Kiosk Mode; memory only |
| `SEVAIQ_APPLICATION_NOTES` | Citizen application notes and reference numbers | Never written in Kiosk Mode; memory only |
| `SEVAIQ_APPLICATION_TRACKING` | Legacy tracking status | Blocked & purged |
| `SEVAIQ_APPLICATION_STATUS` | Official/user-reported application lifecycle states | Never written in Kiosk Mode; memory only |
| `SEVAIQ_APPLICATION_REMINDERS` | Citizen deadline reminders and scheduled alerts | Never written in Kiosk Mode; memory only |

### 2.3 Common In-Memory Tracker Architecture
In standard persistent mode, application tracking and chatbot actions sync via browser storage. In Public Kiosk Mode:
1. **Lifting State to Root**: Tracker state (`completedStepsMap`, `notesMap`, `statusMap`, `reminderMap`) is maintained centrally in `App.tsx` state.
2. **Synchronous Chatbot-to-Tracker Sync**: When the Gemini chatbot executes an action (`UPDATE_USER_REPORTED_APPLICATION_STATUS` or `SET_APPLICATION_REMINDER`), updates apply directly to root state and propagate instantly to both the conversation context and `ApplicationTracker`.
3. **Zero Leaks**: The tracker components and action handlers operate purely in RAM; no persistent writes occur.

### 2.4 Automatic Inactivity Timeout & Voice Protection
To protect citizens who leave a terminal without manually ending their session:
- **5-Minute Inactivity Timer**: After 4.5 minutes of inactivity, an accessible `InactivityWarningDialog` appears with a live 30-second countdown.
- **Activity Tracking**: Any user interaction (`keydown`, `pointerdown`, `input`, `scroll`, `touchstart`) resets the idle timer.
- **Voice Protection**: If the citizen is actively speaking into the microphone (`speechState === 'listening' || 'reviewing'`) or listening to speech playback (`ttsState.status === 'playing'`), timeout triggers are deferred until speech activity completes.
- **Automatic Purge on Timeout**: If no activity occurs before the countdown hits 0, the session is atomically reset:
  - All profile inputs, documents, schemes, tracker notes, and statuses are cleared.
  - Active screen resets to `'chat'`.
  - The `VoiceAssistant` component is remounted via key increment, resetting chat history.
  - Kiosk Mode remains active for the next citizen.
  - An accessible toast alerts the terminal operator: *"Session cleared due to inactivity."*

---

## 3. Realistic Security Boundaries & Threat Model

Public Kiosk Mode provides robust **application-level** privacy safeguards, but application software cannot override hardware or operating system vulnerabilities alone.

### What Public Kiosk Mode Protects Against:
- **Accidental Walkaways**: Subsequent citizens arriving at the terminal cannot view or resume the previous citizen's profile, document records, or chat questions.
- **Browser History & Session Leaks**: Cached profile data cannot be extracted from `localStorage` or `sessionStorage` after session end.
- **Accidental Data Leakage Across Modes**: Transitioning between personal and kiosk modes explicitly resets all state with user confirmation.

### What Public Kiosk Mode CANNOT Protect Against Alone:
- **Malicious Terminal Observers**: Third parties looking over a citizen's shoulder (shoulder surfing).
- **Physical Keyloggers or Hardware Interceptors**: Malicious hardware installed on untrusted cyber cafe computers.
- **Operating System Memory Scraping**: An unprivileged user opening DevTools or a background process dumping RAM during an ongoing active session.
- **Untrusted Wi-Fi Networks Without Strict TLS**: Unencrypted connections (mitigated by enforced HTTPS on Vercel).

### Why SevAIQ Uses Operator Confirmation Instead of Client PINs:
SevAIQ deliberately does **not** rely on a client-side JavaScript PIN (e.g., prompt dialog asking for "1234"). In client-rendered web applications, client-side PINs provide **false security** because:
1. The PIN or validation logic is exposed in plaintext in browser source code or memory.
2. Any user with DevTools can bypass the prompt or read the storage directly.
Instead, SevAIQ relies on **explicit confirmation dialogs** warning the operator/user of data destruction, paired with recommended OS-level account management.

---

## 4. Recommended Operator Deployment Profiles

For CSC, e-Seva, or municipal government deployment, kiosk hardware should pair SevAIQ with an OS-level locked-down browser profile.

### 4.1 Chromium / Google Chrome Kiosk Command
Deploy the kiosk shortcut with flags enforcing incognito, disabled developer tools, and fullscreen kiosk mode:

```bash
google-chrome \
  --kiosk \
  --incognito \
  --temp-profile \
  --disable-extensions \
  --disable-plugins \
  --disable-translate \
  --disable-sync \
  --disable-suggestions-ui \
  --disable-save-password-bubble \
  --no-first-run \
  --no-default-browser-check \
  --kiosk-printing \
  "https://sevaiq.vercel.app"
```

### 4.2 Windows Assigned Access (Edge Kiosk Mode)
1. In Windows 10/11 Enterprise/Pro, open **Settings > Accounts > Other users > Set up a kiosk**.
2. Select **Microsoft Edge** as the kiosk app.
3. Configure Edge as a **Digital Signage or Public Browsing (InPrivate)** kiosk with `https://sevaiq.vercel.app` as the URL.
4. Set the idle reset time to 5 minutes to mirror SevAIQ's internal inactivity reset.

### 4.3 Linux (Cage / Sway Minimal Wayland Kiosk)
Create a dedicated `kiosk` user without sudo privileges. Run a minimal Wayland compositor (`cage`) that launches Chromium:

```bash
# /home/kiosk/.profile or systemd service
exec cage -- chromium --kiosk --incognito --temp-profile https://sevaiq.vercel.app
```

---

## 5. Multilingual Accessibility & UI Specifications

The Public Kiosk Mode interface strictly adheres to Indian government accessibility norms and SevAIQ's trilingual design system:

- **Header Status Indicator**:
  - Inactive: Neutral monitor icon with `Public Kiosk: Off`.
  - Active: Animated emerald pulse badge with `Public Kiosk: Active (Zero Storage)`.
- **Top Warning Banner**:
  - Persistent, accessible banner: *"Public Kiosk Mode Active: No personal data, documents, or application progress will be saved on this device."*
- **Multilingual Support**:
  - English: `Public Kiosk Mode`, `Zero Storage`, `End Session Now`.
  - Tamil: `பொது கியோஸ்க் முறை`, `சேமிப்பகம் இல்லை`, `அமர்வை இப்போதே முடிக்கவும்`.
  - Hindi: `सार्वजनिक कियोस्क मोड`, `शून्य संग्रहण`, `सत्र अभी समाप्त करें`.
- **Keyboard & Screen Reader Support**:
  - Confirmation dialogs implement `role="dialog"`, `aria-modal="true"`, and automatic focus on the **Cancel** button to prevent accidental data loss on Enter.
  - `Escape` key cancels mode changes without modifying data.
  - Inactivity countdown is announced via `aria-live="polite"` so screen reader users receive timely audible warnings.
