import { showPopup } from "../modals/simple-modals";
import Ape from "../ape";
import * as Misc from "../utils/misc";

type LocalLeaderboardEntry = {
  rank: number;
  username: string;
  wpm: number;
  accuracy: number;
  raw: number;
  consistency: number;
  timestamp: Date;
};

const lb = document.getElementById("pageLeaderboards");

let currentPage = 0;
let currentType: "allTime" | "weekly" | "daily" = "allTime";
let isLoading = false;

function showError(message: string): void {
  const errorEl = lb?.querySelector(".error");
  const loadingEl = lb?.querySelector(".loading");
  const tableEl = lb?.querySelector("table");

  if (errorEl) {
    (errorEl as HTMLElement).textContent = message;
    (errorEl as HTMLElement).classList.remove("hidden");
  }
  if (loadingEl) (loadingEl as HTMLElement).classList.add("hidden");
  if (tableEl) (tableEl as HTMLElement).classList.add("hidden");
}

function hideError(): void {
  const errorEl = lb?.querySelector(".error");
  if (errorEl) (errorEl as HTMLElement).classList.add("hidden");
}

function showLoading(): void {
  const loadingEl = lb?.querySelector(".loading");
  const tableEl = lb?.querySelector("table");
  if (loadingEl) (loadingEl as HTMLElement).classList.remove("hidden");
  if (tableEl) (tableEl as HTMLElement).classList.add("hidden");
  isLoading = true;
}

function hideLoading(): void {
  const loadingEl = lb?.querySelector(".loading");
  if (loadingEl) (loadingEl as HTMLElement).classList.add("hidden");
  isLoading = false;
}

function updateTable(entries: LocalLeaderboardEntry[]): void {
  const tbody = lb?.querySelector("table tbody");
  if (!tbody) return;

  (tbody as HTMLElement).innerHTML = "";

  // Show the correct table header for local leaderboard
  const allTimeHead = lb?.querySelector("thead.allTimeAndDaily");
  const weeklyHead = lb?.querySelector("thead.weekly");
  if (allTimeHead)
    (allTimeHead as HTMLElement).style.display = "table-header-group";
  if (weeklyHead) (weeklyHead as HTMLElement).style.display = "none";

  entries.forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.rank}</td>
      <td>
        <div class="avatarNameBadge">
          <div class="avatar">
            <div class="userIcon">
              <i class="fas fa-user-circle"></i>
            </div>
          </div>
          <div class="name">${Misc.escapeHTML(entry.username)}</div>
        </div>
      </td>
      <td>${entry.wpm.toFixed(2)}</td>
      <td>${entry.accuracy.toFixed(2)}%</td>
      <td>${entry.raw.toFixed(2)}</td>
      <td>${entry.consistency.toFixed(2)}%</td>
      <td class="small">${new Date(entry.timestamp).toLocaleDateString()}</td>
    `;
    tbody.appendChild(row);
  });

  const tableEl = lb?.querySelector("table");
  if (tableEl) (tableEl as HTMLElement).classList.remove("hidden");
}

async function loadLocalLeaderboard(page = 0): Promise<void> {
  if (isLoading) return;

  try {
    showLoading();
    hideError();

    const skip = page * 50;
    const response = await Ape.localResults.getLeaderboard({
      query: { limit: 50, skip },
    });

    if (response.status !== 200) {
      showError("Failed to load leaderboard");
      return;
    }

    const entries = response.body.data.entries;
    updateTable(entries);
    currentPage = page;

    // Update pagination buttons
    updatePaginationButtons(entries.length >= 50);
  } catch (error) {
    console.error("Error loading leaderboard:", error);
    showError("Something went wrong");
  } finally {
    hideLoading();
  }
}

export { loadLocalLeaderboard };

function updatePaginationButtons(hasMore: boolean): void {
  const prevBtn = lb?.querySelector("button[data-action='previousPage']");
  const nextBtn = lb?.querySelector("button[data-action='nextPage']");
  const firstBtn = lb?.querySelector("button[data-action='firstPage']");

  if (prevBtn) (prevBtn as HTMLButtonElement).disabled = currentPage === 0;
  if (nextBtn) (nextBtn as HTMLButtonElement).disabled = !hasMore;
  if (firstBtn) (firstBtn as HTMLButtonElement).disabled = currentPage === 0;
}

function updateTypeButtons(): void {
  const buttons = lb?.querySelectorAll(
    ".typeButtons button"
  ) as NodeListOf<HTMLButtonElement>;
  buttons.forEach((btn) => {
    const type = btn.getAttribute("data-type");
    if (type === currentType) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// Event listeners for go to page button
for (const button of lb?.querySelectorAll(
  ".jumpButtons button[data-action='goToPage']"
) ?? []) {
  button?.addEventListener("click", () => {
    showPopup("lbGoToPage");
  });
}

// Event listeners for type buttons
for (const button of lb?.querySelectorAll(".typeButtons button[data-type]") ??
  []) {
  button.addEventListener("click", (e) => {
    const type = (e.target as HTMLElement).getAttribute("data-type") as
      | "allTime"
      | "weekly"
      | "daily";
    if (type && type !== currentType) {
      currentType = type;
      currentPage = 0;
      updateTypeButtons();
      void loadLocalLeaderboard(0);
    }
  });
}

// Event listeners for pagination buttons
for (const button of lb?.querySelectorAll(".jumpButtons button[data-action]") ??
  []) {
  button.addEventListener("click", (e) => {
    const action = (e.target as HTMLElement).getAttribute("data-action");
    if (action === null || action === "" || isLoading) return;

    switch (action) {
      case "firstPage":
        if (currentPage > 0) {
          currentPage = 0;
          void loadLocalLeaderboard(0);
        }
        break;
      case "previousPage":
        if (currentPage > 0) {
          currentPage--;
          void loadLocalLeaderboard(currentPage);
        }
        break;
      case "nextPage":
        currentPage++;
        void loadLocalLeaderboard(currentPage);
        break;
    }
  });
}

// Initialize when page becomes visible
if (lb) {
  // Load leaderboard if page is already visible
  if (!lb.classList.contains("hidden")) {
    void loadLocalLeaderboard(0);
  } else {
    // Check again after a short delay in case the page becomes visible
    setTimeout(() => {
      if (lb !== null && !lb.classList.contains("hidden")) {
        void loadLocalLeaderboard(0);
      }
    }, 100);
  }

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        const target = mutation.target as HTMLElement;
        if (
          !target.classList.contains("hidden") &&
          target.classList.contains("active") &&
          target.id === "pageLeaderboards"
        ) {
          // Page became visible and active, load leaderboard
          void loadLocalLeaderboard(0);
        }
      }
    });
  });

  observer.observe(lb, {
    attributes: true,
    attributeFilter: ["class"],
  });
} else {
  // If element not found, try again after DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    const lbElement = document.getElementById("pageLeaderboards");
    if (lbElement !== null && !lbElement.classList.contains("hidden")) {
      void loadLocalLeaderboard(0);
    }
  });
}
