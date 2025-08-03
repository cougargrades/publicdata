import { downloadFile, extractBundle, rimraf } from './_bundleHelper.js';

const DEFAULT_BUNDLE = 'publicdata-bundle.tar.gz';
export const SELECTED_BUNDLE = process.env.SELECTED_BUNDLE !== undefined ? process.env.SELECTED_BUNDLE : DEFAULT_BUNDLE;
export const RELEASE_TAG = process.env.RELEASE_TAG !== undefined ? process.env.RELEASE_TAG : 'latest';

// verify that the tmp folder is empty before putting new files there, we don't want old bundles laying around causing problems
await rimraf('tmp')

const BUNDLE_URL = (
  RELEASE_TAG === 'latest'
  ? `https://github.com/cougargrades/publicdata/releases/latest/download/${SELECTED_BUNDLE}`
  : `https://github.com/cougargrades/publicdata/releases/download/${RELEASE_TAG}/${SELECTED_BUNDLE}`
);

await downloadFile(BUNDLE_URL, 'tmp/bundle.tar.gz')

await extractBundle('tmp/bundle.tar.gz', 'tmp/test')
