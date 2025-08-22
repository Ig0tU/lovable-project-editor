
// Userscript global variables and functions
declare global {
  interface Window {
    GM_info?: {
      script: {
        name: string;
        version: string;
        description: string;
      };
      scriptMetaStr: string;
      scriptSource: string;
      scriptUpdateURL: string;
      scriptWillUpdate: boolean;
      version: string;
    };
  }
  
  // Greasemonkey/Tampermonkey API
  var GM_info: typeof window.GM_info;
  var GM_setValue: ((key: string, value: unknown) => void) | undefined;
  var GM_getValue: ((key: string, defaultValue?: unknown) => unknown) | undefined;
  var GM_deleteValue: ((key: string) => void) | undefined;
  var GM_listValues: (() => string[]) | undefined;
  var GM_addStyle: ((css: string) => HTMLStyleElement) | undefined;
  var GM_getResourceText: ((name: string) => string) | undefined;
  var GM_getResourceURL: ((name: string) => string) | undefined;
  var GM_openInTab: ((url: string, options?: { active?: boolean; insert?: boolean; setParent?: boolean }) => void) | undefined;
  var GM_registerMenuCommand: ((name: string, fn: () => void, accessKey?: string) => number) | undefined;
  var GM_unregisterMenuCommand: ((menuCmdId: number) => void) | undefined;
  var GM_notification: ((details: {
    text: string;
    title?: string;
    image?: string;
    timeout?: number;
    onclick?: () => void;
  }) => void) | undefined;
}

export {};
