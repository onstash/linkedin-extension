# Feature Specification: WhatsApp Message Integration

## Overview
This feature adds a "Send WhatsApp Msg" button to LinkedIn profile pages (or relevant contexts) that extracts contact information and initiates a WhatsApp conversation.

## Requirements

### 1. Link Format & Data Extraction
- **Contact URL Pattern**: `https://contacts.google.com/person/<id>`
- **Selector**: `a.W7Nbnf`
- **Data Acquisition**:
    - The extension must identify and scrape the target `<a>` tag with the class `a.W7Nbnf`.
    - Extract the unique `<id>` or phone number associated with the contact from this link.

### 2. Button & Action
- **UI Component**: Add a button labeled "Send WhatsApp Msg".
- **Action**: On click, the button opens a new tab directed to `https://wa.me/<phone_number>`.
- **Phone Number Parsing**: Ensure the ID/phone number is correctly passed as the `wa.me` parameter.

## Technical Implementation Plan

- [ ] **Step 1: Scraper Update**
    - Implement a content script function to locate `a.W7Nbnf` on the page.
    - Extract the ID/phone number from the `href` or data attributes.
- [ ] **Step 2: UI Implementation**
    - Add the "Send WhatsApp Msg" button to the existing extension popup/sidebar (using Zustand for state management).
    - Ensure the button is only enabled when a valid contact identifier is found.
- [ ] **Step 3: Navigation Logic**
    - Implement the `window.open("https://wa.me/" + phoneNumber, "_blank")` logic within the store.
- [ ] **Step 4: Testing & Verification**
    - Verify that the URL opens correctly and that the phone number is correctly formatted for the WhatsApp API.
