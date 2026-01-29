import { invariant } from "@/lib/invariant";
import { linkedInDegreeHighlightingLogger } from "@/lib/logger";

// State Management
let discoveryObserver: MutationObserver | null = null;
let listObserver: MutationObserver | null = null;
let currentState: "idle" | "active" | "inactive" = "inactive";
let currentStateUpdatedAt: EpochTimeStamp = -1;

/**
 * Core Logic: Highlights 1st and 2nd degree connections
 * Returns true if elements were found and highlighted, false otherwise.
 */
function highlightConnections(): boolean {
  try {
    linkedInDegreeHighlightingLogger.debug(
      "[contentScript] highlightConnections",
      "Running highlighting logic",
    );

    const dialogHeader = document.querySelector("#dialog-header");
    if (!dialogHeader) {
      linkedInDegreeHighlightingLogger.debug(
        "[contentScript] highlightConnections",
        "dialogHeader not found",
      );
      return false;
    }

    const headerSibling = dialogHeader.nextElementSibling;
    if (!headerSibling) {
      linkedInDegreeHighlightingLogger.debug(
        "[contentScript] highlightConnections",
        "headerSibling not found",
      );
      return false;
    }

    const peopleWhoReacted = document.querySelectorAll(
      "a[data-view-name='view-likers']",
    );

    if (!peopleWhoReacted.length) {
      linkedInDegreeHighlightingLogger.debug(
        "[contentScript] highlightConnections",
        "No peopleWhoReacted elements found",
      );
      return false;
    }

    linkedInDegreeHighlightingLogger.debug(
      "[contentScript] highlightConnections",
      `Found ${peopleWhoReacted.length} people`,
    );

    let highlightedCount = 0;

    peopleWhoReacted.forEach((person, index) => {
      try {
        const nameAndConnectionDegree =
          (person as HTMLAnchorElement).querySelector("p")?.innerText ??
          "Not found";

        if (nameAndConnectionDegree === "Not found") return;

        const nameAndConnectionDegreeSplit = nameAndConnectionDegree
          .split("•")
          .map((x) => x.trim());

        if (nameAndConnectionDegreeSplit.length !== 2) return;

        const [, connectionDegree] = nameAndConnectionDegreeSplit as [
          string,
          "1st" | "2nd",
        ];

        if (connectionDegree === "1st" || connectionDegree === "2nd") {
          const anchor = person as HTMLAnchorElement;

          // Visual Highlighting
          const color = connectionDegree === "1st" ? "#0077b6ff" : "#aab600ff";
          anchor.style.border = `5px solid ${color}`;
          highlightedCount++;

          // Click Behavior Override
          if (anchor.getAttribute("data-custom-click") !== "true") {
            anchor.setAttribute("data-custom-click", "true");
            anchor.setAttribute("target", "_blank");
            anchor.addEventListener("click", (e) => {
              e.stopPropagation();
              // Native click with target="_blank" handles the rest
            });
          }
        }
      } catch (errInLoop) {
        // Suppress individual errors to prevent flooding
      }
    });

    return highlightedCount > 0;
  } catch (err) {
    linkedInDegreeHighlightingLogger.error(
      "[contentScript] highlightConnections",
      "Error in highlightConnections",
      err,
    );
    return false;
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
) {
  try {
    linkedInDegreeHighlightingLogger.debug(
      "[contentScript] highlight1stAnd2ndDegreeConnections",
      `Action: ${action}, CurrentState: ${currentState}`,
    );

    if (action === "stop") {
      if (currentState === "inactive") return;

      linkedInDegreeHighlightingLogger.debug(
        "[contentScript] Stopping observers",
      );
      discoveryObserver?.disconnect();
      discoveryObserver = null;
      listObserver?.disconnect();
      listObserver = null;
      currentState = "inactive";
      currentStateUpdatedAt = Date.now();
      return;
    }

    if (action === "start" || action === "toggle") {
      if (action === "toggle" && currentState === "active") {
        // Treat toggle as stop if currently active
        highlight1stAnd2ndDegreeConnections("stop");
        return;
      }

      if (currentState === "active") {
        linkedInDegreeHighlightingLogger.debug(
          "[contentScript] Already active, ignoring start",
        );
        return;
      }

      currentState = "active";

      // 1. Initial Highlight
      highlightConnections();

      // 2. Attach List Observer (if modal is already open)
      attachListObserver();

      // 3. Start Discovery Observer (Global watcher for modal/list open)
      if (!discoveryObserver) {
        linkedInDegreeHighlightingLogger.debug(
          "[contentScript] Starting Discovery Observer",
        );
        discoveryObserver = new MutationObserver((mutations) => {
          let shouldScan = false;
          for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
              shouldScan = true;
              break;
            }
          }

          if (shouldScan) {
            const found = highlightConnections();
            if (found) {
              attachListObserver();
            }
          }
        });

        discoveryObserver.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }
    }
  } catch (err: unknown) {
    const error = err as Error;
    linkedInDegreeHighlightingLogger.error(
      "[contentScript] highlight1stAnd2ndDegreeConnections",
      "Error in main function",
      error.name,
      error.message,
    );
  }
}
