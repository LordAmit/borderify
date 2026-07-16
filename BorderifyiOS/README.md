# Borderify iOS (SwiftUI)

This directory contains the fully native iOS implementation of Borderify built with **SwiftUI** and **Swift**. It executes directly on the iPhone and bypasses WebKit/Safari-specific canvas memory limitations and rendering bugs (specifically, background blurring on high-resolution canvases).

## Architecture & Rendering Pipeline
- **Core Image (`CIFilter`)**: Background blurring utilizes GPU-accelerated `CIGaussianBlur`.
- **Downsampled Offscreen Buffer**: The image is downsampled to a maximum of 800px before applying the blur filter, and is then scaled back up to the main graphics context. This provides extremely fast, memory-safe, and visually identical blurred background presentation on any iOS device.
- **ImageIO**: Reads camera/lens properties and preserves/injects original EXIF metadata during JPEG export.
- **PhotosUI**: Leverages the system's native photo picker.

## Core Files
- `Models.swift`: Data structures representing app configurations, styles, presets, and active photo items.
- `EXIFHelper.swift`: Helper using `ImageIO` to read original camera/lens properties and inject/preserve metadata on final JPEG export.
- `BorderRenderer.swift`: Main drawing class handling image scaling, Core Image background blurring, dropping shadows, rounded photo clipping, and rendering labels/exif pills.
- `ContentView.swift`: Main user interface with real-time render preview, parameter sliders, segmented controls, color pickers, and native photo selector/export actions.
- `BorderifyApp.swift`: Swift App main entry point.
- `project.yml`: XcodeGen project specification sheet.

---

## How to Build & Run on Your iPhone (via Command Line)

You can generate the Xcode project and build it entirely from your terminal without opening the Xcode GUI application:

1. **Install XcodeGen**:
   ```sh
   brew install xcodegen
   ```

2. **Generate the Xcode Project**:
   Run the following command inside this `BorderifyiOS/` directory to generate the `.xcodeproj` file:
   ```sh
   xcodegen generate
   ```

3. **Build the Application**:
   ```sh
   xcodebuild -project Borderify.xcodeproj -scheme Borderify -configuration Debug -sdk iphoneos build
   ```

   *Note*: you may need to run this command if xcodebuild complains about command line tools instance.
   ```sh
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```

4. **Run on a Connected iPhone**:
   Install `ios-deploy` (to deploy apps to a device without Xcode GUI):
   ```sh
   brew install ios-deploy
   ```
   Then run:
   ```sh
   xcodebuild -project Borderify.xcodeproj -scheme Borderify -destination 'generic/platform=iOS' -allowProvisioningUpdates DEVELOPMENT_TEAM=YOUR_TEAM_ID
   ```
   *(Replace `YOUR_TEAM_ID` with your Apple Developer Team ID, which can be found in your account details on developer.apple.com).*

---

## How to Build & Run via Xcode GUI

If you prefer using the graphical interface:

1. Generate the project folder using step 2 above (`xcodegen generate`).
2. Double-click the newly generated `Borderify.xcodeproj` to open it in Xcode.
3. Connect your iPhone via USB.
4. Select your connected device as the run destination (top bar next to the play button).
5. Go to the project settings, select **Signing & Capabilities**, and select your personal Apple ID/Team to sign the app.
6. Click the **Run** (Play) button to build and install it on your mobile device!
