# Implementation Plan: LinkedIn Structural Selection Refactor

- [x] **Step 1: Refactor Scraper**
    - Replace the current class-based selector in `highlightConnections` with a structural search: find the list container and iterate over the child `<a>` tags.
    - Inside `highlightConnections`, modify the logic to look for the descendant `<p>` tag (containing the "•" character) to extract the text, removing reliance on generated CSS classes.
- [x] **Step 2: Update Observer Container**
    - Update `attachListObserver` to target the reaction list container (identifying the list by `div[role="list"]` or the modal container) rather than relying on an individual liker's class.
- [ ] **Step 3: Remove Brittle Logic**
    - Remove the hardcoded dynamic class arrays from `linkedin-content.ts`.
    - Retain the `!important` CSS style enforcement to ensure highlights are visible.
- [ ] **Step 4: Cleanup & Versioning**
    - Bump the version to `0.5.7` and update `CHANGELOG.md`.
