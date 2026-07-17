import SwiftUI
import PhotosUI

struct ContentView: View {
    @State private var selectedItems: [PhotosPickerItem] = []
    @State private var originalDataMap: [UUID: Data] = [:]
    @State private var imageItems: [ImageItem] = []
    @State private var activeImageIndex: Int = 0
    @State private var config = AppConfig()
    @State private var previewImage: UIImage?
    @State private var isProcessing = false
    @State private var exportMessage: String?
    @State private var showingExportAlert = false
    @State private var selectedPreset: String = "custom"
    
    // Logo State
    @State private var selectedLogoItem: PhotosPickerItem?
    @State private var logoImage: UIImage?
    
    // Sliders & customization tab
    @State private var activeTab: String = "Layout"
    @State private var renderTask: Task<Void, Never>?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Main Preview Area
                ZStack {
                    Color(red: 0.1, green: 0.1, blue: 0.12)
                        .edgesIgnoringSafeArea(.all)
                    
                    if isProcessing {
                        ProgressView("Rendering...")
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .foregroundColor(.white)
                    } else if let preview = previewImage {
                        VStack(spacing: 12) {
                            Image(uiImage: preview)
                                .resizable()
                                .scaledToFit()
                                .padding(16)
                                .shadow(radius: 10)
                            
                            // Carousel of thumbnails
                            if imageItems.count > 1 {
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 10) {
                                        ForEach(0..<imageItems.count, id: \.self) { index in
                                            Image(uiImage: imageItems[index].uiImage)
                                                .resizable()
                                                .scaledToFill()
                                                .frame(width: 60, height: 60)
                                                .clipShape(RoundedRectangle(cornerRadius: 6))
                                                .overlay(
                                                    RoundedRectangle(cornerRadius: 6)
                                                        .stroke(activeImageIndex == index ? Color.blue : Color.clear, lineWidth: 3)
                                                )
                                                .onTapGesture {
                                                    activeImageIndex = index
                                                    triggerRender()
                                                }
                                        }
                                    }
                                    .padding(.horizontal, 16)
                                }
                                .frame(height: 70)
                            }
                        }
                    } else {
                        VStack(spacing: 16) {
                            Image(systemName: "photo.on.rectangle.angled")
                                .font(.system(size: 64))
                                .foregroundColor(.gray)
                            Text("Select photos from library to begin")
                                .font(.headline)
                                .foregroundColor(.gray)
                            
                            PhotosPicker(selection: $selectedItems, matching: .images) {
                                Text("Choose Photos")
                                    .fontWeight(.semibold)
                                    .padding()
                                    .frame(width: 200)
                                    .background(Color.blue)
                                    .foregroundColor(.white)
                                    .cornerRadius(12)
                            }
                        }
                    }
                }
                .frame(maxHeight: .infinity)
                
                if !imageItems.isEmpty {
                    // Settings Drawer
                    VStack(spacing: 0) {
                        // Settings Category Selector
                        HStack(spacing: 0) {
                            tabButton(title: "Layout", systemImage: "rectangle.split.3x1")
                            tabButton(title: "Labels", systemImage: "character.textbox")
                            tabButton(title: "Logo", systemImage: "photo.circle")
                            tabButton(title: "EXIF Pills", systemImage: "info.circle")
                            tabButton(title: "Export", systemImage: "square.and.arrow.up")
                        }
                        .background(Color(UIColor.secondarySystemBackground))
                        
                        Divider()
                        
                        // Control Forms
                        ScrollView {
                            VStack(spacing: 16) {
                                if activeTab == "Layout" {
                                    layoutControls
                                } else if activeTab == "EXIF Pills" {
                                    exifControls
                                } else if activeTab == "Labels" {
                                    labelsControls
                                } else if activeTab == "Logo" {
                                    logoControls
                                } else if activeTab == "Export" {
                                    exportControls
                                }
                            }
                            .padding()
                        }
                        .frame(height: 280)
                        .background(Color(UIColor.systemBackground))
                    }
                    .transition(.move(edge: .bottom))
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 8) {
                        Image("favicon")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 28, height: 28)
                        Text("Borderify")
                            .font(.headline)
                    }
                }
                ToolbarItem(placement: .navigationBarLeading) {
                    if !imageItems.isEmpty {
                        PhotosPicker(selection: $selectedItems, matching: .images) {
                            Image(systemName: "photo.badge.plus")
                                .font(.body)
                        }
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    if !imageItems.isEmpty {
                        Button(action: exportAndSave) {
                            HStack {
                                Image(systemName: "square.and.arrow.down")
                                Text("Save \(imageItems.count > 1 ? "All" : "")")
                            }
                            .fontWeight(.bold)
                        }
                    }
                }
            }
            .onChange(of: selectedItems) { _ in
                loadSelectedPhotos()
            }
            .onChange(of: selectedLogoItem) { _ in
                loadLogoPhoto()
            }
            .onChange(of: config) { _ in
                triggerRender()
            }
            .alert(isPresented: $showingExportAlert) {
                Alert(
                    title: Text("Export Result"),
                    message: Text(exportMessage ?? ""),
                    dismissButton: .default(Text("OK"))
                )
            }
        }
    }
    
    // Tab selector helper
    private func tabButton(title: String, systemImage: String) -> some View {
        Button(action: { activeTab = title }, label: {
            VStack(spacing: 4) {
                Image(systemName: systemImage)
                    .font(.system(size: 18))
                Text(title)
                    .font(.caption2)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .foregroundColor(activeTab == title ? .blue : .gray)
            .contentShape(Rectangle())
        })
    }
    
    // Core Layout Control Views
    private var layoutControls: some View {
        VStack(alignment: .leading, spacing: 14) {
            Group {
                Text("Style Preset")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Picker("Preset", selection: $selectedPreset) {
                    Text("Custom").tag("custom")
                    Text("Polaroid").tag("polaroid")
                    Text("Museum").tag("museum")
                    Text("Minimal").tag("minimal")
                }
                .pickerStyle(SegmentedPickerStyle())
                .onChange(of: selectedPreset) { preset in
                    applyPreset(preset)
                }
            }
            
            Divider()
            
            Group {
                Text("Aspect Ratio")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Picker("Aspect Ratio", selection: $config.layout.aspectRatio) {
                    ForEach(["Original", "1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3"], id: \.self) { ratio in
                        Text(ratio).tag(ratio)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
            }
            
            Divider()
            
            Group {
                Text("Background Type")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Picker("Background", selection: $config.layout.backgroundType) {
                    Text("Solid Color").tag(BackgroundType.color)
                    Text("Blurred Photo").tag(BackgroundType.blurredImage)
                }
                .pickerStyle(SegmentedPickerStyle())
            }
            
            if config.layout.backgroundType == .color {
                ColorPicker("Background Color", selection: Binding(
                    get: { Color(hex: config.layout.backgroundColor) },
                    set: { config.layout.backgroundColor = $0.toHex() }
                ))
            } else {
                SliderRow(title: "Blur Scale", value: $config.layout.backgroundBlurScale, range: 0.0...0.20, step: 0.01)
                SliderRow(title: "Dim/Darken", value: $config.layout.backgroundDimScale, range: 0.0...0.9, step: 0.05)
            }
            
            Divider()
            
            SliderRow(title: "Border Width", value: $config.layout.borderWidthScale, range: 0.0...0.15, step: 0.005)
            
            Group {
                Text("Inner Border Size (Polaroid Style)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                SliderRow(title: "Top Padding", value: $config.layout.innerBorderTopScale, range: 0.0...0.15, step: 0.005)
                SliderRow(title: "Bottom Padding", value: $config.layout.innerBorderBottomScale, range: 0.0...0.25, step: 0.005)
                SliderRow(title: "Side Padding", value: $config.layout.innerBorderSideScale, range: 0.0...0.15, step: 0.005)
            }
            
            Divider()
            
            SliderRow(title: "Card Corners", value: $config.layout.imageRadiusScale, range: 0.0...0.05, step: 0.002)
            SliderRow(title: "Card Shadow", value: $config.layout.imageShadowBlurScale, range: 0.0...0.08, step: 0.005)
            SliderRow(title: "Photo Corners", value: $config.layout.innerImageRadiusScale, range: 0.0...0.05, step: 0.002)
            SliderRow(title: "Photo Shadow", value: $config.layout.innerImageShadowBlurScale, range: 0.0...0.08, step: 0.005)
            
            Divider()
            
            Group {
                Text("Photo Border Style")
                    .font(.caption)
                    .foregroundColor(.secondary)
                ColorPicker("Photo Border Color", selection: Binding(
                    get: { Color(hex: config.layout.photoBorderColor) },
                    set: { config.layout.photoBorderColor = $0.toHex() }
                ))
                SliderRow(title: "Photo Border Width", value: $config.layout.photoBorderWidthScale, range: 0.0...0.05, step: 0.001)
            }
        }
    }
    
    // EXIF Control Views
    private var exifControls: some View {
        VStack(alignment: .leading, spacing: 12) {
            Toggle("Show EXIF Info Pills", isOn: $config.exifPills.show)
            
            if config.exifPills.show {
                Divider()
                Group {
                    Toggle("Focal Length", isOn: $config.exifPills.showFocal)
                    Toggle("Aperture", isOn: $config.exifPills.showAperture)
                    Toggle("ISO Speed", isOn: $config.exifPills.showIso)
                    Toggle("Shutter Speed", isOn: $config.exifPills.showShutter)
                    Toggle("Lens Info", isOn: $config.exifPills.showLens)
                    Toggle("Camera Name", isOn: $config.exifPills.showCamera)
                }
                
                Divider()
                Group {
                    Text("Pill Templates")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    TextField("Custom Camera Template", text: Binding(
                        get: { config.exifPills.customCameraText ?? "" },
                        set: { config.exifPills.customCameraText = $0.isEmpty ? nil : $0 }
                    ))
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    TextField("Custom Lens Template", text: Binding(
                        get: { config.exifPills.customLensText ?? "" },
                        set: { config.exifPills.customLensText = $0.isEmpty ? nil : $0 }
                    ))
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                }
                
                Divider()
                Group {
                    Text("Pill Settings")
                        .font(.headline)
                    SliderRow(title: "Font Size", value: $config.exifPills.fontSizeScale, range: 0.008...0.03, step: 0.001)
                    ColorPicker("Box Background", selection: Binding(
                        get: { Color(hex: config.exifPills.boxColor) },
                        set: { config.exifPills.boxColor = $0.toHex() }
                    ))
                    ColorPicker("Text Color", selection: Binding(
                        get: { Color(hex: config.exifPills.textColor) },
                        set: { config.exifPills.textColor = $0.toHex() }
                    ))
                }
            }
        }
    }
    
    // Labels Controls
    private var labelsControls: some View {
        VStack(alignment: .leading, spacing: 14) {
            ForEach(0..<config.labels.count, id: \.self) { index in
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text("Label \(index + 1)")
                            .font(.headline)
                        Spacer()
                        Toggle("Show", isOn: $config.labels[index].show)
                    }
                    
                    if config.labels[index].show {
                        TextField("Text (Supports {make}, {model}, {lens})", text: $config.labels[index].text)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                        
                        HStack {
                            ColorPicker("Color", selection: Binding(
                                get: { Color(hex: config.labels[index].color) },
                                set: { config.labels[index].color = $0.toHex() }
                            ))
                            Spacer()
                            Picker("Weight", selection: $config.labels[index].fontWeight) {
                                Text("Regular").tag("normal")
                                Text("Bold").tag("bold")
                            }
                            .pickerStyle(MenuPickerStyle())
                        }
                        
                        SliderRow(title: "Size", value: $config.labels[index].fontSizeScale, range: 0.01...0.08, step: 0.002)
                        SliderRow(title: "Offset Y", value: $config.labels[index].positionYScale, range: -0.2...0.2, step: 0.005)
                        SliderRow(title: "Offset X", value: $config.labels[index].positionXScale, range: -0.2...0.2, step: 0.005)
                    }
                }
                .padding(.bottom, 8)
                Divider()
            }
        }
    }
    
    // Logo Controls View
    private var logoControls: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Brand Logo")
                .font(.headline)
            
            HStack {
                Text("Select Logo Image")
                Spacer()
                PhotosPicker(selection: $selectedLogoItem, matching: .images) {
                    Text(logoImage == nil ? "Choose Image" : "Replace")
                        .font(.subheadline)
                        .bold()
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.blue.opacity(0.15))
                        .cornerRadius(6)
                }
            }
            
            if let logo = logoImage {
                HStack {
                    Image(uiImage: logo)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 50, height: 50)
                        .background(Color.black.opacity(0.05))
                        .cornerRadius(6)
                    
                    Button(action: {
                        logoImage = nil
                        selectedLogoItem = nil
                        triggerRender()
                    }) {
                        Text("Remove Logo")
                            .font(.caption)
                            .foregroundColor(.red)
                    }
                }
                
                Divider()
                
                Group {
                    Text("Logo Position")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Picker("Position", selection: $config.logo.position) {
                        ForEach(["Top Left", "Top Center", "Top Right", "Middle Left", "Center", "Middle Right", "Bottom Left", "Bottom Center", "Bottom Right"], id: \.self) { pos in
                            Text(pos).tag(pos)
                        }
                    }
                    .pickerStyle(MenuPickerStyle())
                }
                
                SliderRow(title: "Logo Size", value: $config.logo.sizeScale, range: 0.01...0.20, step: 0.005)
                SliderRow(title: "Offset X", value: $config.logo.offsetXScale, range: -0.3...0.3, step: 0.005)
                SliderRow(title: "Offset Y", value: $config.logo.offsetYScale, range: -0.3...0.3, step: 0.005)
            }
        }
    }
    
    // Export Controls
    private var exportControls: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Export settings")
                .font(.headline)
            
            SliderRow(title: "JPEG Export Quality", value: $config.export.quality, range: 50.0...100.0, step: 1.0)
            
            Text("Maximum Output Bounds")
                .font(.caption)
                .foregroundColor(.secondary)
            Picker("Bounds Limit", selection: $config.export.maxResolution) {
                ForEach(["Original", "4K", "Facebook", "Instagram"], id: \.self) { res in
                    Text(res).tag(res)
                }
            }
            .pickerStyle(SegmentedPickerStyle())
        }
    }
    
    // Apply Preset Settings
    private func applyPreset(_ name: String) {
        switch name {
        case "polaroid":
            config.layout.aspectRatio = "1:1"
            config.layout.backgroundType = .blurredImage
            config.layout.backgroundBlurScale = 0.02
            config.layout.innerBorderMode = "polaroid"
            config.layout.innerBorderSideScale = 0.02
            config.layout.innerBorderTopScale = 0.02
            config.layout.innerBorderBottomScale = 0.12
            config.layout.borderWidthScale = 0.05
            if config.labels.count >= 2 {
                config.labels[0].position = "Bottom Left"
                config.labels[0].positionXScale = 0.05
                config.labels[0].positionYScale = -0.075
                config.labels[0].show = true
                
                config.labels[1].position = "Bottom Left"
                config.labels[1].positionXScale = 0.05
                config.labels[1].positionYScale = -0.045
                config.labels[1].show = true
            }
            config.exifPills.position = "Bottom Center"
            config.exifPills.positionYScale = 0.02
            config.exifPills.show = true
        case "museum":
            config.layout.aspectRatio = "Original"
            config.layout.backgroundType = .color
            config.layout.backgroundColor = "#FFFFFF"
            config.layout.innerBorderMode = "uniform"
            config.layout.innerBorderSideScale = 0.05
            config.layout.innerBorderTopScale = 0.05
            config.layout.innerBorderBottomScale = 0.05
            config.layout.borderWidthScale = 0.08
            if config.labels.count >= 2 {
                config.labels[0].position = "Bottom Left"
                config.labels[0].positionXScale = 0.05
                config.labels[0].positionYScale = -0.075
                config.labels[0].show = true
                
                config.labels[1].position = "Bottom Left"
                config.labels[1].positionXScale = 0.05
                config.labels[1].positionYScale = -0.045
                config.labels[1].show = true
            }
            config.exifPills.position = "Bottom Center"
            config.exifPills.positionYScale = 0.05
            config.exifPills.show = true
        case "minimal":
            config.layout.aspectRatio = "Original"
            config.layout.backgroundType = .color
            config.layout.backgroundColor = "#FFFFFF"
            config.layout.innerBorderMode = "uniform"
            config.layout.innerBorderSideScale = 0.0
            config.layout.innerBorderTopScale = 0.0
            config.layout.innerBorderBottomScale = 0.0
            config.layout.borderWidthScale = 0.03
            for index in 0..<config.labels.count {
                config.labels[index].show = false
            }
            config.exifPills.show = false
        default:
            break
        }
    }
    
    // Helper to load multiple images
    private func loadSelectedPhotos() {
        guard !selectedItems.isEmpty else { return }
        isProcessing = true
        
        let dispatchGroup = DispatchGroup()
        var newItems: [ImageItem] = []
        var newDataMap: [UUID: Data] = [:]
        
        for photosItem in selectedItems {
            dispatchGroup.enter()
            photosItem.loadTransferable(type: Data.self) { result in
                switch result {
                case .success(let data?):
                    if let uiImage = UIImage(data: data) {
                        let exif = EXIFHelper.readEXIF(from: data)
                        let item = ImageItem(
                            url: nil,
                            uiImage: uiImage,
                            width: uiImage.size.width,
                            height: uiImage.size.height,
                            exif: exif
                        )
                        newItems.append(item)
                        newDataMap[item.id] = data
                    }
                default:
                    break
                }
                dispatchGroup.leave()
            }
        }
        
        dispatchGroup.notify(queue: .main) {
            self.imageItems = newItems
            self.originalDataMap = newDataMap
            self.activeImageIndex = 0
            self.triggerRender()
        }
    }
    
    // Helper to load logo image
    private func loadLogoPhoto() {
        guard let selectedLogoItem = selectedLogoItem else { return }
        isProcessing = true
        
        selectedLogoItem.loadTransferable(type: Data.self) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let data?):
                    if let uiImage = UIImage(data: data) {
                        self.logoImage = uiImage
                        self.triggerRender()
                    } else {
                        self.isProcessing = false
                    }
                default:
                    self.isProcessing = false
                }
            }
        }
    }
    
    // Helper to trigger renderer asynchronously with cancellation & debounce
    private func triggerRender() {
        guard activeImageIndex < imageItems.count else {
            self.isProcessing = false
            return
        }
        
        let item = imageItems[activeImageIndex]
        
        renderTask?.cancel()
        isProcessing = true
        
        renderTask = Task.detached(priority: .userInteractive) {
            // Debounce for 50ms to ignore rapid slider values during drags
            try? await Task.sleep(nanoseconds: 50_000_000)
            
            if Task.isCancelled { return }
            
            let rendered = BorderRenderer.render(imageItem: item, config: self.config, logo: self.logoImage, isPreview: true)
            
            if Task.isCancelled { return }
            
            await MainActor.run {
                self.previewImage = rendered
                self.isProcessing = false
            }
        }
    }
    
    // Save images (handles batch processing for all photos in list)
    private func exportAndSave() {
        guard !imageItems.isEmpty else { return }
        isProcessing = true
        
        DispatchQueue.global(qos: .userInitiated).async {
            var saveCount = 0
            var failedCount = 0
            let dispatchGroup = DispatchGroup()
            
            for item in self.imageItems {
                dispatchGroup.enter()
                
                // Render at full output resolution limit
                let fullResImage = BorderRenderer.render(imageItem: item, config: self.config, logo: self.logoImage, isPreview: false)
                
                // Re-inject EXIF data
                let originalData = self.originalDataMap[item.id]
                guard let finalData = EXIFHelper.writeEXIF(to: fullResImage, originalData: originalData, quality: self.config.export.quality) else {
                    failedCount += 1
                    dispatchGroup.leave()
                    continue
                }
                
                guard let finalImage = UIImage(data: finalData) else {
                    failedCount += 1
                    dispatchGroup.leave()
                    continue
                }
                
                PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
                    if status == .authorized || status == .limited {
                        UIImageWriteToSavedPhotosAlbum(finalImage, nil, nil, nil)
                        saveCount += 1
                    } else {
                        failedCount += 1
                    }
                    dispatchGroup.leave()
                }
            }
            
            dispatchGroup.notify(queue: .main) {
                self.isProcessing = false
                if failedCount == 0 {
                    self.exportMessage = "Successfully saved all \(saveCount) photos to your camera roll!"
                } else {
                    self.exportMessage = "Saved \(saveCount) photos. Failed to save \(failedCount) photos due to errors or permission denials."
                }
                self.showingExportAlert = true
            }
        }
    }
}

// Small Slider Row Helper View
struct SliderRow: View {
    let title: String
    @Binding var value: Double
    let range: ClosedRange<Double>
    let step: Double
    
    var body: some View {
        VStack(spacing: 4) {
            HStack {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text(String(format: "%.3f", value))
                    .font(.caption.monospacedDigit())
                    .bold()
            }
            Slider(value: $value, in: range, step: step)
        }
    }
}

// Extension to bridge SwiftUI Color with Hex strings
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let redVal, greenVal, blueVal: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (redVal, greenVal, blueVal) = ((int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (redVal, greenVal, blueVal) = (int >> 16, int >> 8 & 0xFF, int & 0xFF)
        default:
            (redVal, greenVal, blueVal) = (255, 255, 255)
        }
        self.init(
            .sRGB,
            red: Double(redVal) / 255,
            green: Double(greenVal) / 255,
            blue: Double(blueVal) / 255,
            opacity: 1
        )
    }
    
    func toHex() -> String {
        guard let components = UIColor(self).cgColor.components, components.count >= 3 else {
            return "#FFFFFF"
        }
        let redVal = Float(components[0])
        let greenVal = Float(components[1])
        let blueVal = Float(components[2])
        return String(format: "#%02lX%02lX%02lX", lroundf(redVal * 255), lroundf(greenVal * 255), lroundf(blueVal * 255))
    }
}
