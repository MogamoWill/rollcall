module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Replace import.meta.env with process.env (fixes Zustand on Metro web)
      function importMetaEnvPlugin() {
        return {
          visitor: {
            MetaProperty(path) {
              // import.meta.env.X -> process.env.X
              if (
                path.node.meta.name === "import" &&
                path.node.property.name === "meta"
              ) {
                const parent = path.parentPath;
                if (
                  parent.isMemberExpression() &&
                  parent.node.property.name === "env"
                ) {
                  parent.replaceWithSourceString("process.env");
                }
              }
            },
          },
        };
      },
    ],
  };
};
