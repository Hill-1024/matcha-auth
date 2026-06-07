import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MANIFEST_PATH = path.resolve(__dirname, './android/app/src/main/AndroidManifest.xml');
const GRADLE_PATH = path.resolve(__dirname, './android/app/build.gradle');
const PACKAGE_JSON_PATH = path.resolve(__dirname, './package.json');
const ANDROID_NATIVE_SOURCE_PATH = path.resolve(__dirname, './native/capacitor/java');
const ANDROID_APP_JAVA_PATH = path.resolve(__dirname, './android/app/src/main/java');

const RELEASE_SIGNING_ENV = `def releaseKeystorePath = System.getenv("ANDROID_KEYSTORE_PATH")
def releaseKeystorePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
def releaseKeyAlias = System.getenv("ANDROID_KEY_ALIAS")
def releaseKeyPassword = System.getenv("ANDROID_KEY_PASSWORD")
def hasReleaseKeystore = releaseKeystorePath && releaseKeystorePassword && releaseKeyAlias && releaseKeyPassword`;

const RELEASE_SIGNING_CONFIG = `    signingConfigs {
        release {
            if (hasReleaseKeystore) {
                storeFile file(releaseKeystorePath)
                storePassword releaseKeystorePassword
                keyAlias releaseKeyAlias
                keyPassword releaseKeyPassword
            }
        }
    }`;

const RELEASE_SIGNING_LINE = 'signingConfig = hasReleaseKeystore ? signingConfigs.release : signingConfigs.debug';
const OKHTTP_DEPENDENCY = '    implementation "com.squareup.okhttp3:okhttp:4.12.0"';

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

      if (!gradleContent.includes('ANDROID_KEYSTORE_PATH')) {
          gradleContent = gradleContent.replace(
              /apply plugin: 'com\.android\.application'\s*/,
              (match) => `${match}\n${RELEASE_SIGNING_ENV}\n`
          );
          console.log('✅ Added release signing environment configuration.');
          modified = true;
      }

      if (!/signingConfigs\s*\{/.test(gradleContent)) {
          gradleContent = gradleContent.replace(/\n\s*buildTypes\s*\{/, `\n${RELEASE_SIGNING_CONFIG}\n    buildTypes {`);
          console.log('✅ Added release signingConfig.');
          modified = true;
      }

      if (gradleContent.includes('signingConfig signingConfigs.debug')) {
          gradleContent = gradleContent.replace(/signingConfig\s+signingConfigs\.debug/g, RELEASE_SIGNING_LINE);
          console.log('✅ Replaced debug-only release signing.');
          modified = true;
      }

      if (gradleContent.includes('signingConfig = signingConfigs.debug')) {
          gradleContent = gradleContent.replace(/signingConfig\s*=\s*signingConfigs\.debug/g, RELEASE_SIGNING_LINE);
          console.log('✅ Replaced debug-only release signing.');
          modified = true;
      }

      const releaseRegex = /(buildTypes\s*\{\s*release\s*\{\s*(?:[^{}]*|\{[^{}]*\})*\})/;
      const releaseMatch = gradleContent.match(releaseRegex);
      if (releaseMatch && !releaseMatch[0].includes('signingConfig')) {
          const updatedRelease = releaseMatch[0].replace(
              /proguardFiles\s+getDefaultProguardFile\('proguard-android\.txt'\),\s*'proguard-rules\.pro'/,
              `proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'\n            ${RELEASE_SIGNING_LINE}`
          );
          gradleContent = gradleContent.replace(releaseRegex, updatedRelease);
          console.log('✅ Injected release signingConfig selector.');
          modified = true;
      }

      if (!gradleContent.includes('com.squareup.okhttp3:okhttp')) {
          gradleContent = gradleContent.replace(/dependencies\s*\{/, `dependencies {\n${OKHTTP_DEPENDENCY}`);
          console.log('✅ Added OkHttp dependency for WebDAV methods.');
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

function syncAndroidNativeSources() {
  console.log('🔌 Checking Android native WebDAV bridge...');

  if (!fs.existsSync(ANDROID_NATIVE_SOURCE_PATH)) {
    console.warn('⚠️ Native Android source templates not found. Skipping WebDAV bridge injection.');
    return;
  }

  if (!fs.existsSync(ANDROID_APP_JAVA_PATH)) {
    console.warn('⚠️ Android Java source directory not found. Skipping WebDAV bridge injection.');
    return;
  }

  fs.cpSync(ANDROID_NATIVE_SOURCE_PATH, ANDROID_APP_JAVA_PATH, { recursive: true });
  console.log('✅ Android native WebDAV bridge is in place.');
}

injectPermissions();
updateAndroidVersion();
syncAndroidNativeSources();
