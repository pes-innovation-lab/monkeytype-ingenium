import * as PageController from "./page-controller";
import * as TestUI from "../test/test-ui";
import * as PageTransition from "../states/page-transition";
import { isFunboxActive } from "../test/funbox/list";
import * as TestState from "../test/test-state";
import * as Notifications from "../elements/notifications";
import { LoadingOptions } from "../pages/page";

//source: https://www.youtube.com/watch?v=OstALBk-jTc
// https://www.youtube.com/watch?v=OstALBk-jTc

//this will be used in tribe
type NavigateOptions = {
  force?: boolean;
  empty?: boolean;
  data?: unknown;
  loadingOptions?: LoadingOptions;
};

function pathToRegex(path: string): RegExp {
  return new RegExp(
    "^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$"
  );
}

function getParams(match: {
  route: Route;
  result: RegExpMatchArray;
}): Record<string, string> {
  const values = match.result.slice(1);
  const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(
    (result) => result[1]
  );

  const a = keys.map((key, index) => [key, values[index]]);
  return Object.fromEntries(a) as Record<string, string>;
}

type Route = {
  path: string;
  load: (
    params: Record<string, string>,
    navigateOptions: NavigateOptions
  ) => Promise<void>;
};

const route404: Route = {
  path: "404",
  load: async () => {
    await PageController.change("404");
  },
};

const routes: Route[] = [
  {
    path: "/",
    load: async (_params, options) => {
      await PageController.change("test", options);
    },
  },
  {
    path: "/verify",
    load: async (_params, options) => {
      await PageController.change("test", options);
    },
  },
  {
    path: "/about",
    load: async (_params, options) => {
      await PageController.change("about", options);
    },
  },
  {
    path: "/settings",
    load: async (_params, options) => {
      await PageController.change("settings", options);
    },
  },
  {
    path: "/leaderboards",
    load: async (_params, options) => {
      await PageController.change("leaderboards", options);
    },
  },
];

export async function navigate(
  url = window.location.pathname +
    window.location.search +
    window.location.hash,
  options = {} as NavigateOptions
): Promise<void> {
  if (
    !options.force &&
    (TestUI.testRestarting || TestUI.resultCalculating || PageTransition.get())
  ) {
    console.debug(
      `navigate: ${url} ignored, page is busy (testRestarting: ${
        TestUI.testRestarting
      }, resultCalculating: ${
        TestUI.resultCalculating
      }, pageTransition: ${PageTransition.get()})`
    );
    return;
  }

  const noQuit = isFunboxActive("no_quit");
  if (TestState.isActive && noQuit) {
    Notifications.add("No quit funbox is active. Please finish the test.", 0, {
      important: true,
    });
    //todo: figure out if this was ever used
    // event?.preventDefault();
    return;
  }

  url = url.replace(/\/$/, "");
  if (url === "") url = "/";

  // only push to history if we're navigating to a different URL
  const currentUrl = new URL(window.location.href);
  const targetUrl = new URL(url, window.location.origin);

  if (
    currentUrl.pathname + currentUrl.search + currentUrl.hash !==
    targetUrl.pathname + targetUrl.search + targetUrl.hash
  ) {
    history.pushState(null, "", url);
  }

  await router(options);
}

async function router(options = {} as NavigateOptions): Promise<void> {
  const path = window.location.pathname;
  const potentialMatches = routes.map((route) => ({
    route,
    result: path.match(pathToRegex(route.path)),
  }));

  const match = potentialMatches.find((x) => x.result !== null);

  if (match === undefined || match.result === null) {
    await route404.load({}, {});
    return;
  }

  await match.route.load(
    getParams({ route: match.route, result: match.result }),
    options
  );
}

window.addEventListener("popstate", () => {
  void router();
});

document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", (e) => {
    const target = e?.target as HTMLLinkElement;
    if (target.matches("[router-link]") && target?.href) {
      e.preventDefault();
      void navigate(target.href);
    }
  });

  // Initialize router to handle current URL - force initial navigation
  void router({ force: true });
});
