import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_JSON_PATH = path.resolve(__dirname, '../package.json');
const GRADLE_PATH = path.resolve(__dirname, '../android/app/build.gradle');

function syncVersion() {
  console.log('🔄 Syncing version from package.json to Android...');

  // 1. Read package.json
  if (!fs.existsSync(PACKAGE_JSON_PATH)) {
    console.error('❌ package.json not found!');
    process.exit(1);
  }
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  const version = packageJson.version;

  if (!version) {
    console.error('❌ No version found in package.json');
    process.exit(1);
  }

  // 2. Calculate versionCode (Integer) from SemVer string
  // Format: 1.2.3 -> 10203 (Major * 10000 + Minor * 100 + Patch)
  const [major, minor, patch] = version.split('.').map(num => parseInt(num, 10));
  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    console.error(`❌ Invalid version format: ${version}. Expected x.y.z`);
    process.exit(1);
  }
  const versionCode = major * 10000 + minor * 100 + patch;

  console.log(`📦 Package Version: ${version}`);
  console.log(`📱 Generated versionCode: ${versionCode}`);

  // 3. Update android/app/build.gradle
  if (!fs.existsSync(GRADLE_PATH)) {
    console.warn('⚠️ Android project not found (android/app/build.gradle). Skipping Android sync.');
    // Don't fail, maybe the user hasn't added android platform yet
    return;
  }

  let gradleContent = fs.readFileSync(GRADLE_PATH, 'utf8');

  // Replace versionName
  const versionNameRegex = /versionName\s+"[^"]+"/;
  if (versionNameRegex.test(gradleContent)) {
    gradleContent = gradleContent.replace(versionNameRegex, `versionName "${version}"`);
  } else {
    console.warn('⚠️ Could not find versionName in build.gradle');
  }

  // Replace versionCode
  const versionCodeRegex = /versionCode\s+\d+/;
  if (versionCodeRegex.test(gradleContent)) {
    gradleContent = gradleContent.replace(versionCodeRegex, `versionCode ${versionCode}`);
  } else {
    console.warn('⚠️ Could not find versionCode in build.gradle');
  }

  fs.writeFileSync(GRADLE_PATH, gradleContent, 'utf8');
  console.log('✅ Android build.gradle updated successfully!');
}

syncVersion();
