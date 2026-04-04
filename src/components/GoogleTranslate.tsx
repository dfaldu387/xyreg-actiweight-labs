import { useEffect } from "react";

// Extend window interface for Google Translate
declare global {
  interface Window {
    google?: {
      translate: {
        TranslateElement: {
          new (options: any, elementId: string): void;
          InlineLayout: {
            SIMPLE: number;
            HORIZONTAL: number;
            VERTICAL: number;
          };
        };
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

function GoogleTranslate() {
  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="translate.google.com"]');
    if (existingScript) {
      // Script already loaded, just initialize
      if (window.googleTranslateElementInit) {
        window.googleTranslateElementInit();
      }
      return;
    }

    // Create and add the script
    const addScript = document.createElement("script");
    addScript.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    addScript.async = true;
    document.body.appendChild(addScript);

    // Define the callback function
    window.googleTranslateElementInit = () => {
      // Check if Google Translate is available
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en", // default language
            // includedLanguages: "en,es,de,fr,hi,id,it,pt,ru,zh-CN,ja,ko", // languages to allow
            includedLanguages: "en,es,de", // languages to allow
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          },
          "google_translate_element"
        );
      }
    };

    // Cleanup function
    return () => {
      // Don't remove the script on cleanup to avoid re-initialization issues
      // The script can stay in the DOM
    };
  }, []);

  return (
    <div
      id="google_translate_element"
      className="w-28 h-6"
    ></div>
  );
}

export default GoogleTranslate;

