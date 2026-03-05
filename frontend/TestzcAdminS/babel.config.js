module.exports = {
  presets: [
    [
      "@vue/cli-plugin-babel/preset",
      {
        useBuiltIns: "usage", // 按需引入 polyfill
        corejs: 3, // 指定 core-js 版本
      },
    ],
  ],
};
