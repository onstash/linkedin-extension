# Handoff: WhatsApp Message Integration Feature

## Context & Objectives
This feature enables users to send a WhatsApp message directly from a contact's Google Contacts profile page or a LinkedIn context where the `a.W7Nbnf` contact link is present.

## Current State
- The project has a robust store (`lib/store.ts`) using Zustand for extension state management.
- The project has a content script architecture (`entrypoints/content.ts`) that handles DOM scraping and messaging between the page and the extension.
- The UI is built using React and shadcn/ui.

## Implementation Tasks

- [ ] **Step 1: Content Script Scraper**
    - **Location**: `entrypoints/content.ts`
    - **Logic**: 
        - Add a function (e.g., `getWhatsAppNumber`) to find `a.W7Nbnf` and extract the contact identifier/phone number.
        - Add a case for `get_whatsapp_number` in the `browser.runtime.onMessage` listener to return this identifier to the popup.

- [ ] **Step 2: Store Integration**
    - **Location**: `lib/store.ts`
    - **Logic**:
        - Add `whatsAppNumber: string | null` to the `ExtensionState` interface.
        - Add an action `getWhatsAppNumber` that sends a message to the content script.
        - Add an action `openWhatsApp` that triggers `window.open("https://wa.me/" + number)`.

- [x] **Step 1: Content Script Scraper**
- [x] **Step 2: Store Integration**
- [x] **Step 3: UI Enhancement**
- [ ] **Step 4: Decouple WhatsApp UI**
    - Create `entrypoints/popup/WhatsAppMessenger.tsx`.
    - Refactor `entrypoints/popup/DegreeHighlighter.tsx` to remove the WhatsApp logic and imports.
    - Update `entrypoints/popup/App.tsx` to compose `WhatsAppMessenger` alongside `DegreeHighlighter`/`TrackProfile`.
- [ ] **Step 5: Cleanup & Versioning**
    - Bump version to `0.5.9` and document architectural changes.

## Known Constraints
- Ensure the scraper handles cases where the contact link `a.W7Nbnf` does not exist (e.g., if the user is not on a Google Contacts page).
- Proper sanitization of the extracted phone number (e.g., removing non-digit characters) is required for `wa.me`.

## Diagnostic Commands
- **Check scraper in console**: `document.querySelector("a.W7Nbnf")?.href`
