/**
 * Unscoped npm packages maintained by BAM.
 * These cannot be discovered via the npm scope search API, so they are hardcoded.
 * Scoped @bam.tech/* packages are fetched dynamically.
 */
export const UNSCOPED_PACKAGES = [
  'react-native-performance',
  'react-native-image-resizer',
  'react-native-hide-with-keyboard',
  'react-native-image-header-scroll-view',
  'generator-rn-toolbox',
  'react-native-make',
  'redux-enhancer-react-native-appstate',
  'react-tv-space-navigation',
  'react-native-formik',
  'rn-camera-roll',
  'react-native-braintree-payments-drop-in',
  'react-native-form-idable',
  'react-redux-toolbox',
  'react-native-debugger-utils',
  'redux-async-actions-factory',
  'react-native-photo-guideline-grid',
  'generator-module-react-native',
  'devicelab-bot',
  'react-native-numberpicker-dialog',
  'cordova-camera-roll',
  'react-native-text-input',
] as const;

export type UnscopedPackageName = (typeof UNSCOPED_PACKAGES)[number];
