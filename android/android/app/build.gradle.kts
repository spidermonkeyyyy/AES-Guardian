import java.util.Properties

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "com.example.respiracare"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        // TODO: Specify your own unique Application ID (https://developer.android.com/studio/build/application-id.html).
        applicationId = "com.example.respiracare"
        // You can update the following values to your application needs.
        // For more information, see: https://flutter.dev/to/review-gradle-config.
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        create("release") {
            val propsFile = file("key.properties")
            if (propsFile.exists()) {
                val props = Properties()
                propsFile.inputStream().use { props.load(it) }
                val alias = props.getProperty("keyAlias") ?: ""
                val storePath = props.getProperty("storeFile") ?: ""
                if (alias.isNotEmpty() && storePath.isNotEmpty()) {
                    keyAlias = alias
                    keyPassword = props.getProperty("keyPassword") ?: ""
                    storeFile = file(storePath)
                    storePassword = props.getProperty("storePassword") ?: ""
                }
            }
        }
    }

    buildTypes {
        release {
            // Release signing configuration.
            // If a local key.properties file is present with valid production credentials
            // (gitignored; populated per Phase 4N-1 instructions), use the release signing config.
            // Otherwise fall back to debug signing so `flutter run --release` continues to work
            // in development. This fallback is NOT production signing.
            val propsFile = file("key.properties")
            val hasReleaseKey = if (propsFile.exists()) {
                val props = Properties()
                propsFile.inputStream().use { props.load(it) }
                val alias = props.getProperty("keyAlias") ?: ""
                val storePath = props.getProperty("storeFile") ?: ""
                alias.isNotEmpty() && storePath.isNotEmpty() && file(storePath).exists()
            } else {
                false
            }
            signingConfig = if (hasReleaseKey) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
        // Debug build configuration retained unchanged.
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
