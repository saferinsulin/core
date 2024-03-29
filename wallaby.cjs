/* eslint-disable */
module.exports = function (wallaby) {
  return {
    env: {
      type: 'node',
    },
    symlinkNodeModules: true,
    workers: { restart: true },
    files: ['package.json', 'out-tsc/src/**/*.js',
    ],
    tests: ['test/**/*.js'],
    testFramework: 'mocha',
  };
};
