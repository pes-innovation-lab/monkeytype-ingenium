import Ape from "../ape";
import * as DB from "../db";
import * as UpdateConfig from "../config";
import * as Notifications from "../elements/notifications";
import * as Settings from "../pages/settings";
import * as ThemePicker from "../elements/settings/theme-picker";
import * as CustomText from "../test/custom-text";
import * as CustomTextState from "../states/custom-text-name";
import * as ThemeController from "../controllers/theme-controller";
import { CustomThemeColors } from "@monkeytype/schemas/configs";
import { ExecReturn, SimpleModal, TextInput } from "../utils/simple-modal";
import { ShowOptions } from "../utils/animated-modal";
import { GenerateDataRequest } from "@monkeytype/contracts/dev";
import { UserNameSchema } from "@monkeytype/schemas/users";
import FileStorage from "../utils/file-storage";

type PopupKey =
  | "updateEmail"
  | "updateName"
  | "updatePassword"
  | "removeGoogleAuth"
  | "removeGithubAuth"
  | "removePasswordAuth"
  | "addPasswordAuth"
  | "deleteAccount"
  | "resetAccount"
  | "optOutOfLeaderboards"
  | "applyCustomFont"
  | "resetPersonalBests"
  | "resetSettings"
  | "revokeAllTokens"
  | "unlinkDiscord"
  | "editApeKey"
  | "deleteCustomText"
  | "deleteCustomTextLong"
  | "resetProgressCustomTextLong"
  | "updateCustomTheme"
  | "deleteCustomTheme"
  | "devGenerateData"
  | "lbGoToPage";

const list: Record<PopupKey, SimpleModal | undefined> = {
  updateEmail: undefined,
  updateName: undefined,
  updatePassword: undefined,
  removeGoogleAuth: undefined,
  removeGithubAuth: undefined,
  removePasswordAuth: undefined,
  addPasswordAuth: undefined,
  deleteAccount: undefined,
  resetAccount: undefined,
  optOutOfLeaderboards: undefined,
  applyCustomFont: undefined,
  resetPersonalBests: undefined,
  resetSettings: undefined,
  revokeAllTokens: undefined,
  unlinkDiscord: undefined,
  editApeKey: undefined,
  deleteCustomText: undefined,
  deleteCustomTextLong: undefined,
  resetProgressCustomTextLong: undefined,
  updateCustomTheme: undefined,
  deleteCustomTheme: undefined,
  devGenerateData: undefined,
  lbGoToPage: undefined,
};

list.applyCustomFont = new SimpleModal({
  id: "applyCustomFont",
  title: "Custom font",
  inputs: [{ type: "text", placeholder: "Font name", initVal: "" }],
  text: "Make sure you have the font installed on your computer before applying",
  buttonText: "apply",
  execFn: async (_thisPopup, fontName): Promise<ExecReturn> => {
    Settings.groups["fontFamily"]?.setValue(fontName.replace(/\s/g, "_"));

    return {
      status: 1,
      message: "Font applied",
    };
  },
});

list.resetSettings = new SimpleModal({
  id: "resetSettings",
  title: "Reset settings",
  text: "Are you sure you want to reset all your settings?",
  buttonText: "reset",
  onlineOnly: true,
  execFn: async (): Promise<ExecReturn> => {
    await UpdateConfig.reset();
    await FileStorage.deleteFile("LocalBackgroundFile");
    return {
      status: 1,
      message: "Settings reset",
    };
  },
});

list.deleteCustomText = new SimpleModal({
  id: "deleteCustomText",
  title: "Delete custom text",
  text: "Are you sure?",
  buttonText: "delete",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    CustomText.deleteCustomText(_thisPopup.parameters[0] as string, false);
    CustomTextState.setCustomTextName("", undefined);

    return {
      status: 1,
      message: "Custom text deleted",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    _thisPopup.text = `Are you sure you want to delete custom text ${_thisPopup.parameters[0]}?`;
  },
});

list.deleteCustomTextLong = new SimpleModal({
  id: "deleteCustomTextLong",
  title: "Delete custom text",
  text: "Are you sure?",
  buttonText: "delete",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    CustomText.deleteCustomText(_thisPopup.parameters[0] as string, true);
    CustomTextState.setCustomTextName("", undefined);

    return {
      status: 1,
      message: "Custom text deleted",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    _thisPopup.text = `Are you sure you want to delete custom text ${_thisPopup.parameters[0]}?`;
  },
});

list.resetProgressCustomTextLong = new SimpleModal({
  id: "resetProgressCustomTextLong",
  title: "Reset progress for custom text",
  text: "Are you sure?",
  buttonText: "reset",
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    CustomText.setCustomTextLongProgress(_thisPopup.parameters[0] as string, 0);
    const text = CustomText.getCustomText(
      _thisPopup.parameters[0] as string,
      true
    );
    CustomText.setText(text);
    return {
      status: 1,
      message: "Custom text progress reset",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    _thisPopup.text = `Are you sure you want to reset your progress for custom text ${_thisPopup.parameters[0]}?`;
  },
});

list.updateCustomTheme = new SimpleModal({
  id: "updateCustomTheme",
  title: "Update custom theme",
  inputs: [
    {
      type: "text",
      placeholder: "name",
      initVal: "",
    },
    {
      type: "checkbox",
      initVal: false,
      label: "Update custom theme to current colors",
      optional: true,
    },
  ],
  buttonText: "update",
  onlineOnly: true,
  execFn: async (_thisPopup, name, updateColors): Promise<ExecReturn> => {
    const snapshot = DB.getSnapshot();
    if (!snapshot) {
      return {
        status: -1,
        message: "Failed to update custom theme: no snapshot",
      };
    }

    const customTheme = snapshot.customThemes?.find(
      (t) => t._id === _thisPopup.parameters[0]
    );
    if (customTheme === undefined) {
      return {
        status: -1,
        message: "Failed to update custom theme: theme not found",
      };
    }

    let newColors: string[] = [];
    if (updateColors === "true") {
      for (const color of ThemeController.colorVars) {
        newColors.push(
          $(
            `.pageSettings .customTheme .customThemeEdit #${color}[type='color']`
          ).attr("value") as string
        );
      }
    } else {
      newColors = customTheme.colors;
    }

    const newTheme = {
      name: name.replaceAll(" ", "_"),
      colors: newColors as CustomThemeColors,
    };
    const validation = await DB.editCustomTheme(customTheme._id, newTheme);
    if (!validation) {
      return {
        status: -1,
        message: "Failed to update custom theme",
      };
    }
    UpdateConfig.setCustomThemeColors(newColors as CustomThemeColors);
    void ThemePicker.fillCustomButtons();

    return {
      status: 1,
      message: "Custom theme updated",
    };
  },
  beforeInitFn: (_thisPopup): void => {
    const snapshot = DB.getSnapshot();
    if (!snapshot) return;

    const customTheme = snapshot.customThemes?.find(
      (t) => t._id === _thisPopup.parameters[0]
    );
    if (!customTheme) return;
    (_thisPopup.inputs[0] as TextInput).initVal = customTheme.name;
  },
});

list.deleteCustomTheme = new SimpleModal({
  id: "deleteCustomTheme",
  title: "Delete custom theme",
  text: "Are you sure?",
  buttonText: "delete",
  onlineOnly: true,
  execFn: async (_thisPopup): Promise<ExecReturn> => {
    await DB.deleteCustomTheme(_thisPopup.parameters[0] as string);
    void ThemePicker.fillCustomButtons();

    return {
      status: 1,
      message: "Custom theme deleted",
    };
  },
});

list.devGenerateData = new SimpleModal({
  id: "devGenerateData",
  title: "Generate data",
  showLabels: true,
  inputs: [
    {
      type: "text",
      label: "username",
      placeholder: "username",
      oninput: (event): void => {
        const target = event.target as HTMLInputElement;
        const span = document.querySelector(
          "#devGenerateData_1 + span"
        ) as HTMLInputElement;
        span.innerHTML = `if checked, user will be created with ${target.value}@example.com and password: password`;
        return;
      },
      validation: {
        schema: UserNameSchema,
      },
    },
    {
      type: "checkbox",
      label: "create user",
      description:
        "if checked, user will be created with {username}@example.com and password: password",
      optional: true,
    },
    {
      type: "date",
      label: "first test",
      optional: true,
    },
    {
      type: "date",
      label: "last test",
      max: new Date(),
      optional: true,
    },
    {
      type: "range",
      label: "min tests per day",
      initVal: 0,
      min: 0,
      max: 200,
      step: 10,
    },
    {
      type: "range",
      label: "max tests per day",
      initVal: 50,
      min: 0,
      max: 200,
      step: 10,
    },
  ],
  buttonText: "generate (might take a while)",
  execFn: async (
    _thisPopup,
    username,
    createUser,
    firstTestTimestamp,
    lastTestTimestamp,
    minTestsPerDay,
    maxTestsPerDay
  ): Promise<ExecReturn> => {
    const request: GenerateDataRequest = {
      username,
      createUser: createUser === "true",
    };
    if (firstTestTimestamp !== undefined && firstTestTimestamp.length > 0)
      request.firstTestTimestamp = Date.parse(firstTestTimestamp);
    if (lastTestTimestamp !== undefined && lastTestTimestamp.length > 0)
      request.lastTestTimestamp = Date.parse(lastTestTimestamp);
    if (minTestsPerDay !== undefined && minTestsPerDay.length > 0)
      request.minTestsPerDay = Number.parseInt(minTestsPerDay);
    if (maxTestsPerDay !== undefined && maxTestsPerDay.length > 0)
      request.maxTestsPerDay = Number.parseInt(maxTestsPerDay);

    const result = await Ape.dev.generateData({ body: request });

    return {
      status: result.status === 200 ? 1 : -1,
      message: result.body.message,
      hideOptions: {
        clearModalChain: true,
      },
    };
  },
});

list.lbGoToPage = new SimpleModal({
  id: "lbGoToPage",
  title: "Go to page",
  inputs: [
    {
      type: "number",
      placeholder: "Page number",
    },
  ],
  buttonText: "Go",
  execFn: async (_thisPopup, pageNumber): Promise<ExecReturn> => {
    const page = parseInt(pageNumber, 10);
    if (isNaN(page) || page < 1) {
      return {
        status: 0,
        message: "Invalid page number",
      };
    }

    return {
      status: 1,
      message: "Navigating to page " + page,
      showNotification: false,
    };
  },
});

export function showPopup(
  key: PopupKey,
  showParams = [] as string[],
  showOptions: ShowOptions = {}
): void {
  const popup = list[key];
  if (popup === undefined) {
    Notifications.add("Failed to show popup - popup is not defined", -1);
    return;
  }
  popup.show(showParams, showOptions);
}

//todo: move these event handlers to their respective files (either global event files or popup files)
$(".pageAccountSettings").on("click", "#unlinkDiscordButton", () => {
  showPopup("unlinkDiscord");
});

$(".pageAccountSettings").on("click", "#removeGoogleAuth", () => {
  showPopup("removeGoogleAuth");
});

$(".pageAccountSettings").on("click", "#removeGithubAuth", () => {
  showPopup("removeGithubAuth");
});

$(".pageAccountSettings").on("click", "#removePasswordAuth", () => {
  showPopup("removePasswordAuth");
});

$("#resetSettingsButton").on("click", () => {
  showPopup("resetSettings");
});

$(".pageAccountSettings").on("click", "#revokeAllTokens", () => {
  showPopup("revokeAllTokens");
});

$(".pageAccountSettings").on("click", "#resetPersonalBestsButton", () => {
  showPopup("resetPersonalBests");
});

$(".pageAccountSettings").on("click", "#updateAccountName", () => {
  showPopup("updateName");
});

$("#bannerCenter").on("click", ".banner .text .openNameChange", () => {
  showPopup("updateName");
});

$(".pageAccountSettings").on("click", "#addPasswordAuth", () => {
  showPopup("addPasswordAuth");
});

$(".pageAccountSettings").on("click", "#emailPasswordAuth", () => {
  showPopup("updateEmail");
});

$(".pageAccountSettings").on("click", "#passPasswordAuth", () => {
  showPopup("updatePassword");
});

$(".pageAccountSettings").on("click", "#deleteAccount", () => {
  showPopup("deleteAccount");
});

$(".pageAccountSettings").on("click", "#resetAccount", () => {
  showPopup("resetAccount");
});

$(".pageAccountSettings").on("click", "#optOutOfLeaderboardsButton", () => {
  showPopup("optOutOfLeaderboards");
});

$(".pageSettings").on(
  "click",
  ".section.themes .customTheme .delButton",
  (e) => {
    const $parentElement = $(e.currentTarget).parent(".customTheme.button");
    const customThemeId = $parentElement.attr("customThemeId") as string;
    showPopup("deleteCustomTheme", [customThemeId]);
  }
);

$(".pageSettings").on(
  "click",
  ".section.themes .customTheme .editButton",
  (e) => {
    const $parentElement = $(e.currentTarget).parent(".customTheme.button");
    const customThemeId = $parentElement.attr("customThemeId") as string;
    showPopup("updateCustomTheme", [customThemeId], {
      focusFirstInput: "focusAndSelect",
    });
  }
);

$(".pageSettings").on(
  "click",
  ".section[data-config-name='fontFamily'] button[data-config-value='custom']",
  () => {
    showPopup("applyCustomFont");
  }
);
