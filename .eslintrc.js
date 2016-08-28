module.exports = {
  extends: 'airbnb',
  plugins: [
    'react',
  ],
  parser: 'babel-eslint',
  rules: {
    'react/jsx-filename-extension': 'off',
    'global-require': 'off',
    'import/no-unresolved': [
      2,
      {
        ignore: [
          '^react$',
          '^react-native$',
          '^react-native/',
          '^react-native-camera',
        ],
      },
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: [
          '.js',
          '.android.js',
          '.ios.js',
        ],
      },
    },
    node: true,
  },
};
