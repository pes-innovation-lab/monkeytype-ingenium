import * as Misc from "./utils/misc";
import * as MonkeyPower from "./elements/monkey-power";
import * as MerchBanner from "./elements/merch-banner";
import * as ConnectionState from "./states/connection";
//@ts-expect-error no types for this package
import Konami from "konami";
import * as ServerConfiguration from "./ape/server-configuration";
import { getActiveFunboxesWithFunction } from "./test/funbox/list";
import { loadPromise } from "./config";

$(async (): Promise<void> => {
  await loadPromise;

  //this line goes back to pretty much the beginning of the project and im pretty sure its here
  //to make sure the initial theme application doesnt animate the background color
  $("body").css("transition", "background .25s, transform .05s");
  MerchBanner.showIfNotClosedBefore();

  for (const fb of getActiveFunboxesWithFunction("applyGlobalCSS")) {
    fb.functions.applyGlobalCSS();
  }

  $("#app")
    .css("opacity", "0")
    .removeClass("hidden")
    .stop(true, true)
    .animate({ opacity: 1 }, Misc.applyReducedMotion(250));

  // Auth removed - hide authentication-related UI elements
  $(".register").addClass("hidden");
  $(".login").addClass("hidden");
  $(".disabledNotification").removeClass("hidden");

  if (ConnectionState.get()) {
    void ServerConfiguration.sync().catch((error: unknown) => {
      console.warn("Server configuration sync failed:", error);
      // Continue without server config in no-auth mode
    });
  }
  MonkeyPower.init();

  // untyped, need to ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  new Konami("https://keymash.io/");

  if (Misc.isDevEnvironment()) {
    void navigator.serviceWorker
      .getRegistrations()
      .then(function (registrations) {
        for (const registration of registrations) {
          void registration.unregister();
        }
      });
  } else {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((registration) => {
            console.log(
              "ServiceWorker registration successful with scope: ",
              registration.scope
            );
          })
          .catch((error: unknown) => {
            console.error("ServiceWorker registration failed: ", error);
          });
      });
    }
  }
});
