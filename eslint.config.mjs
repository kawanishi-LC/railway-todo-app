import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";


export default [
  { files: ["**/*.{js,mjs,cjs,jsx}"], },
  { languageOptions: { globals: {...globals.browser, ...globals.node} } },
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,

  {
    ignores: ['node_modules', '.cache', 'build', 'public/build', '.env'],
  },
  
  {
    plugins: {
      react: pluginReact,
    },
      rules: {
      ...pluginReact.configs.flat['jsx-runtime'].rules,
        'react/prop-types': 0,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

];