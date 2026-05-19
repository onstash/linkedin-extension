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

    // Structural approach: Find all 'a' tags which have a 'p' descendant containing '•'
    // This is robust against dynamic class name changes.
    const potentialLikers = Array.from(document.querySelectorAll("a")).filter(
      (a) => a.querySelector("p")?.innerText.includes("•"),
    );

    if (!potentialLikers.length) {
      linkedInDegreeHighlightingLogger.debug(
        "[contentScript] highlightConnections",
        "No liker elements found structurally",
      );
      return 0;
    }

    linkedInDegreeHighlightingLogger.debug(
      "[contentScript] highlightConnections",
      `Found ${potentialLikers.length} potential likers`,
    );

    let highlightedCount = 0;

    potentialLikers.forEach((anchor) => {
      try {
        const pElement = anchor.querySelector("p");
        const text = pElement?.innerText ?? "";
        
        // Match 1st or 2nd degree
        const match = text.match(/(1st|2nd) degree/);
        if (!match) return;

        const connectionDegree = match[1] as "1st" | "2nd";

        // Force Visual Highlighting
        const color = connectionDegree === "1st" ? "#0077b6" : "#aab600";
        anchor.style.setProperty("border", `5px solid ${color}`, "important");
        anchor.style.setProperty("box-sizing", "border-box", "important");
        highlightedCount++;

        anchor.setAttribute("data-highlighted", "true");
        
        if (anchor.getAttribute("data-custom-click") !== "true") {
          anchor.setAttribute("data-custom-click", "true");
          anchor.setAttribute("target", "_blank");
          anchor.addEventListener("click", (e) => e.stopPropagation());
        }
      } catch (errInLoop) {}
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
        linkedInDegreeHighlightingLogger.debug(
          "[contentScript] Starting Discovery Observer",
        );
        discoveryObserver = new MutationObserver((mutations) => {
          // Look for added elements that might be likers (structural check)
          const hasLikers = Array.from(mutations).some((m) =>
            Array.from(m.addedNodes).some(
              (node) =>
                node instanceof Element &&
                (node.querySelector("p")?.innerText.includes("•") ||
                  (node.tagName === "A" && node.querySelector("p")?.innerText.includes("•"))),
            ),
          );

          if (hasLikers) {
            linkedInDegreeHighlightingLogger.debug(
              "[contentScript] Discovery Observer triggered - Liker found",
            );
            highlightConnections();
            attachListObserver();
          }
        });

        discoveryObserver.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }
      return count;
    }
    return 0;
  } catch (err: unknown) {
    linkedInDegreeHighlightingLogger.error("Highlighting error", err);
    return 0;
  }
}
