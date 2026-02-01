import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.resolve(__dirname, './android/app/src/main/AndroidManifest.xml');
const GRADLE_PATH = path.resolve(__dirname, './android/app/build.gradle');
const PACKAGE_JSON_PATH = path.resolve(__dirname, './package.json');

function injectPermissions() {
  console.log('🛡️ Checking Android Manifest for Camera Permissions...');

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.warn('⚠️ AndroidManifest.xml not found. Skipping permission injection.');
    return;
  }

  let content = fs.readFileSync(MANIFEST_PATH, 'utf8');
  let modified = false;

  const cameraPermission = '<uses-permission android:name="android.permission.CAMERA" />';
  const cameraFeature = '<uses-feature android:name="android.hardware.camera" />';
  const cameraFeatureAF = '<uses-feature android:name="android.hardware.camera.autofocus" />';

  // Find the position to insert (before <application>)
  const appTagIndex = content.indexOf('<application');
  
  if (appTagIndex === -1) {
    console.error('❌ Could not find <application> tag in Manifest.');
    return;
  }

  // Helper to insert line safely
  const insertBeforeApp = (tag) => {
    if (!content.includes(tag)) {
        // Re-find index as content might have changed
        const currentAppTagIndex = content.indexOf('<application');
        const insertPos = content.lastIndexOf('<', currentAppTagIndex);
        content = content.slice(0, insertPos) + `    ${tag}\n` + content.slice(insertPos);
        return true;
    }
    return false;
  };

  // Check and Inject Permissions/Features
  if (insertBeforeApp(cameraPermission)) {
      console.log('✅ Injected CAMERA permission.');
      modified = true;
  }
  
  if (insertBeforeApp(cameraFeature)) {
      console.log('✅ Injected CAMERA hardware feature.');
      modified = true;
  }

  if (insertBeforeApp(cameraFeatureAF)) {
      console.log('✅ Injected CAMERA autofocus feature.');
      modified = true;
  }

  if (modified) {
    fs.writeFileSync(MANIFEST_PATH, content, 'utf8');
    console.log('🚀 AndroidManifest.xml updated successfully.');
  } else {
    console.log('👍 Android Manifest permissions already present.');
  }
}

function updateAndroidVersion() {
  console.log('🔄 Checking Android Versioning...');

  if (!fs.existsSync(PACKAGE_JSON_PATH)) {
    console.warn('⚠️ package.json not found. Skipping version update.');
    return;
  }

  if (!fs.existsSync(GRADLE_PATH)) {
    console.warn('⚠️ android/app/build.gradle not found. Skipping version update.');
    return;
  }

  try {
      const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
      const version = pkg.version;

      if (!version) {
          console.warn('⚠️ No version specified in package.json');
          return;
      }

      // Convert SemVer to Integer for versionCode
      // Strategy: Major * 1,000,000 + Minor * 1,000 + Patch
      const parts = version.split('.').map(v => parseInt(v, 10));
      
      if (parts.length < 3 || parts.some(isNaN)) {
          console.warn(`⚠️ Version ${version} is not standard SemVer (x.y.z). Skipping code generation.`);
          return;
      }
      
      const [major, minor, patch] = parts;
      const versionCode = major * 1000000 + minor * 1000 + patch;
      
      let gradleContent = fs.readFileSync(GRADLE_PATH, 'utf8');
      let modified = false;

      // Update versionCode
      const versionCodeRegex = /versionCode\s+(\d+)/;
      const codeMatch = gradleContent.match(versionCodeRegex);
      if (codeMatch && parseInt(codeMatch[1], 10) !== versionCode) {
          gradleContent = gradleContent.replace(versionCodeRegex, `versionCode ${versionCode}`);
          console.log(`✅ Updated versionCode: ${codeMatch[1]} -> ${versionCode}`);
          modified = true;
      }

      // Update versionName
      const versionNameRegex = /versionName\s+"([^"]+)"/;
      const nameMatch = gradleContent.match(versionNameRegex);
      if (nameMatch && nameMatch[1] !== version) {
          gradleContent = gradleContent.replace(versionNameRegex, `versionName "${version}"`);
          console.log(`✅ Updated versionName: "${nameMatch[1]}" -> "${version}"`);
          modified = true;
      }

      if (modified) {
          fs.writeFileSync(GRADLE_PATH, gradleContent, 'utf8');
          console.log('🚀 Android build.gradle updated successfully.');
      } else {
          console.log('👍 Android version matches package.json.');
      }

  } catch (error) {
      console.error('❌ Error updating Android version:', error);
  }
}

injectPermissions();
updateAndroidVersion();