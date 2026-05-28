// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // The local import resolver depends on an optional native package that can be missing
      // after npm installs on this machine. TypeScript remains the module-resolution check.
      "import/no-duplicates": "off",
      "import/no-unresolved": "off",
      "import/namespace": "off",

      // These React Compiler-era rules currently flag common React Native patterns:
      // Animated.Value refs, initial hydration state, and RN text punctuation.
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/no-unescaped-entities": "off",
    },
  }
]);
