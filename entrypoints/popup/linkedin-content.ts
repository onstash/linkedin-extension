import { invariant } from "@/lib/invariant";
import { linkedInDegreeHighlightingLogger } from "@/lib/logger";

// State Management
let discoveryObserver: MutationObserver | null = null;
let listObserver: MutationObserver | null = null;
let currentState: "idle" | "active" | "inactive" = "inactive";
let currentStateUpdatedAt: EpochTimeStamp = -1;

/**
 * Core Logic: Highlights 1st and 2nd degree connections
 * Returns count of elements highlighted.
 */
function highlightConnections(): number {
  try {
    linkedInDegreeHighlightingLogger.debug(
      "[contentScript] highlightConnections",
      "Running highlighting logic",
    );

    // Look for any liker element, even if modal is not strictly #dialog-header
    const peopleWhoReacted = document.querySelectorAll(
      "a[data-view-name='view-likers']",
    );

    if (!peopleWhoReacted.length) {
      linkedInDegreeHighlightingLogger.debug(
        "[contentScript] highlightConnections",
        "No peopleWhoReacted elements found",
      );
      return 0;
    }

    linkedInDegreeHighlightingLogger.debug(
      "[contentScript] highlightConnections",
      `Found ${peopleWhoReacted.length} people`,
    );

    let highlightedCount = 0;

    peopleWhoReacted.forEach((person) => {
      try {
        const text = (person as HTMLAnchorElement).innerText;
        linkedInDegreeHighlightingLogger.debug("[contentScript] person text", text);
        // More robust matching: Look for "1st" or "2nd" followed by "degree"
        const match = text.match(/(1st|2nd) degree/);
        if (!match) return;

        const connectionDegree = match[1] as "1st" | "2nd";
        const anchor = person as HTMLAnchorElement;

        // Visual Highlighting
        const color = connectionDegree === "1st" ? "#0077b6ff" : "#aab600ff";
        anchor.style.border = `5px solid ${color}`;
        highlightedCount++;

        // Add custom identifier
        anchor.setAttribute("data-highlighted", "true");
        // Click Behavior Override
        if (anchor.getAttribute("data-custom-click") !== "true") {
          anchor.setAttribute("data-custom-click", "true");
          anchor.setAttribute("target", "_blank");
          anchor.addEventListener("click", (e) => {
            e.stopPropagation();
          });
        }
      } catch (errInLoop) {
        // Suppress individual errors
      }
    });

    return highlightedCount;
  } catch (err) {
    linkedInDegreeHighlightingLogger.error(
      "[contentScript] highlightConnections",
      "Error in highlightConnections",
      err,
    );
    return 0;
  }
}

/**
 * Attaches the main observer to the specific list container
 */
function attachListObserver() {
  if (listObserver) return; // Already attached

  // Find the container: parent of a 'view-likers' element or a known container selector
  const firstPerson = document.querySelector("a[data-view-name='view-likers']");
  const listContainer =
    firstPerson?.closest("ul") ||
    firstPerson?.closest(".scaffold-finite-scroll__content") ||
    firstPerson?.parentElement?.parentElement;

  if (!listContainer) {
    linkedInDegreeHighlightingLogger.debug(
      "[contentScript] attachListObserver",
      "List container not found yet",
    );
    return;
  }

  linkedInDegreeHighlightingLogger.debug(
    "[contentScript] attachListObserver",
    "Attaching list observer to container",
    listContainer,
  );

  listObserver = new MutationObserver(() => {
    // Debounce could be added here if needed
    highlightConnections();
  });

  listObserver.observe(listContainer, { childList: true, subtree: true });
}

export function highlight1stAnd2ndDegreeConnections(
  action: "start" | "stop" | "toggle",
): number {
  try {
    linkedInDegreeHighlightingLogger.debug(
      "[contentScript] highlight1stAnd2ndDegreeConnections",
      `Action: ${action}, CurrentState: ${currentState}`,
    );

    if (action === "stop") {
      if (currentState === "inactive") return 0;
      // ... (rest of the logic)
      discoveryObserver?.disconnect();
      discoveryObserver = null;
      listObserver?.disconnect();
      listObserver = null;
      currentState = "inactive";
      currentStateUpdatedAt = Date.now();
      return 0;
    }

    if (action === "start" || action === "toggle") {
      // ... (rest of start logic)
      currentState = "active";
      const count = highlightConnections();
      attachListObserver();

      if (!discoveryObserver) {
        discoveryObserver = new MutationObserver(() => {
          highlightConnections();
        });
        discoveryObserver.observe(document.body, { childList: true, subtree: true });
      }
      return count;
    }
    return 0;
  } catch (err: unknown) {
    linkedInDegreeHighlightingLogger.error("Highlighting error", err);
    return 0;
  }
}
