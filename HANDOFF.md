# Handoff: LinkedIn Degree Highlighter Structural Refactor

## Context & Objectives
The goal of this project is to fix the LinkedIn degree highlighting feature, which is currently broken due to brittle CSS selectors. The previous approach relied on specific, generated CSS classes (`f9835074...`) that change frequently.

The new approach must use a **structural selector** strategy (relying on DOM hierarchy, e.g., finding the liker's link element containing a `<p>` tag with a "•" separator) to be resilient against LinkedIn's class name obfuscation.

## Current Status
- The extension fails to find list items (likers) in the Reactions modal because the old selectors are obsolete.
- `document.querySelectorAll("a." + [ObfuscatedClasses...])` works but is brittle.
- The `discoveryObserver` was recently updated to better capture liker insertions.

## Implementation Tasks

- [ ] **Step 1: Refactor Scraper in `entrypoints/popup/linkedin-content.ts`**
    - **Goal**: Remove reliance on hardcoded dynamic class names.
    - **Logic**: 
        1. Find the modal reactions list container (e.g., `div[role="list"]` or the modal wrapper).
        2. Iterate over the container's child `<a>` elements (the liker links).
        3. For each `<a>`, query for the descendant `<p>` tag that contains the "•" character.
        4. Extract the degree ("1st" or "2nd") using the current Regex logic.
    - **Action**: Delete the hardcoded dynamic class arrays from the source code.

- [ ] **Step 2: Robust Observer Update**
    - **Goal**: Ensure the list remains live as user scrolls.
    - **Logic**: Ensure `listObserver` targets the container found in Step 1, not a specific liker's class.

- [ ] **Step 3: Verification**
    - **Goal**: Validate stability.
    - **Logic**: Trigger the highlighter when the Reactions modal is open and verify via console logs that `peopleWhoReacted` counts are non-zero (target ~50-70 items per modal).

- [ ] **Step 4: Release**
    - **Goal**: Finalize version.
    - **Logic**: Bump version in `package.json` to 0.5.7 and record changes in `CHANGELOG.md`.

## Known Constraints
- The selector logic must avoid generated CSS classes that change between builds.
- The `!important` CSS property must be retained on the `border` property of the `<a>` tag so the browser ignores LinkedIn's default styles for these elements.
- Maintain the current project state machine logic (`IDLE`, `WAITING`, `ACTIVE`).

## Diagnostic Commands
- **Check item count**: `document.querySelectorAll("a").filter(el => el.querySelector("p")?.innerText.includes("•")).length`
