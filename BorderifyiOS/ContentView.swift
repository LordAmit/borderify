import SwiftUI
import PhotosUI

struct ContentView: View {
    @State private var selectedItem: PhotosPickerItem? = nil
    @State private var originalData: Data? = nil
    @State private var imageItem: ImageItem? = nil
    @State private var config = AppConfig()
    @State private var previewImage: UIImage? = nil
    @State private var isProcessing = false
    @State private var exportMessage: String? = nil
    @State private var showingExportAlert = false
    
    // Sliders & customization tab
    @State private var activeTab: String = "Layout"
    
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
                        Image(uiImage: preview)
                            .resizable()
                            .scaledToFit()
                            .padding(16)
                            .shadow(radius: 10)
                    } else {
                        VStack(spacing: 16) {
                            Image(systemName: "photo.on.rectangle.angled")
                                .font(.system(size: 64))
                                .foregroundColor(.gray)
                            Text("Select a photo from library to begin")
                                .font(.headline)
                                .foregroundColor(.gray)
                            
                            PhotosPicker(selection: $selectedItem, matching: .images) {
                                Text("Choose Photo")
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
                
                if imageItem != nil {
                    // Settings Drawer
                    VStack(spacing: 0) {
                        // Settings Category Selector
                        HStack(spacing: 0) {
                            tabButton(title: "Layout", systemImage: "rectangle.split.3x1")
                            tabButton(title: "EXIF Pills", systemImage: "info.circle")
                            tabButton(title: "Labels", systemImage: "character.textbox")
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
            .navigationTitle("Borderify")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    if imageItem != nil {
                        PhotosPicker(selection: $selectedItem, matching: .images) {
                            Image(systemName: "photo.badge.plus")
                                .font(.body)
                        }
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    if let imageItem = imageItem {
                        Button(action: exportAndSave) {
                            HStack {
                                Image(systemName: "square.and.arrow.down")
                                Text("Save")
                            }
                            .fontWeight(.bold)
                        }
                    }
                }
            }
            .onChange(of: selectedItem) { _ in
                loadSelectedPhoto()
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
        Button(action: { activeTab = title }) {
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
        }
    }
    
    // Core Layout Control Views
    private var layoutControls: some View {
        VStack(alignment: .leading, spacing: 14) {
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
    
    // Helper to load image
    private func loadSelectedPhoto() {
        guard let selectedItem = selectedItem else { return }
        isProcessing = true
        
        selectedItem.loadTransferable(type: Data.self) { result in
            DispatchQueue.main.async {
                switch result {
                case .success(let data?):
                    self.originalData = data
                    if let uiImage = UIImage(data: data) {
                        let exif = EXIFHelper.readEXIF(from: data)
                        let item = ImageItem(
                            url: nil,
                            uiImage: uiImage,
                            width: uiImage.size.width,
                            height: uiImage.size.height,
                            exif: exif
                        )
                        self.imageItem = item
                        self.triggerRender()
                    } else {
                        self.isProcessing = false
                    }
                case .failure:
                    self.isProcessing = false
                default:
                    self.isProcessing = false
                }
            }
        }
    }
    
    // Helper to trigger renderer asynchronously
    private func triggerRender() {
        guard let item = imageItem else { return }
        isProcessing = true
        
        DispatchQueue.global(qos: .userInteractive).async {
            let rendered = BorderRenderer.render(imageItem: item, config: self.config, isPreview: true)
            DispatchQueue.main.async {
                self.previewImage = rendered
                self.isProcessing = false
            }
        }
    }
    
    // Save image with EXIF re-injection
    private func exportAndSave() {
        guard let item = imageItem else { return }
        isProcessing = true
        
        DispatchQueue.global(qos: .userInitiated).async {
            // Render at full output resolution limit
            let fullResImage = BorderRenderer.render(imageItem: item, config: self.config, isPreview: false)
            
            // Re-inject EXIF data
            guard let finalData = EXIFHelper.writeEXIF(to: fullResImage, originalData: self.originalData, quality: self.config.export.quality) else {
                DispatchQueue.main.async {
                    self.isProcessing = false
                    self.exportMessage = "Failed to inject EXIF properties."
                    self.showingExportAlert = true
                }
                return
            }
            
            // Write to Photos Album
            guard let finalImage = UIImage(data: finalData) else { return }
            
            PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
                DispatchQueue.main.async {
                    if status == .authorized || status == .limited {
                        UIImageWriteToSavedPhotosAlbum(finalImage, nil, nil, nil)
                        self.isProcessing = false
                        self.exportMessage = "Image successfully saved to camera roll!"
                        self.showingExportAlert = true
                    } else {
                        self.isProcessing = false
                        self.exportMessage = "Permission denied. Please enable Photo Library access in Settings."
                        self.showingExportAlert = true
                    }
                }
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
        let r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (r, g, b) = ((int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (r, g, b) = (int >> 16, int >> 8 & 0xFF, int & 0xFF)
        default:
            (r, g, b) = (255, 255, 255)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: 1
        )
    }
    
    func toHex() -> String {
        guard let components = UIColor(self).cgColor.components, components.count >= 3 else {
            return "#FFFFFF"
        }
        let r = Float(components[0])
        let g = Float(components[1])
        let b = Float(components[2])
        return String(format: "#%02lX%02lX%02lX", lroundf(r * 255), lroundf(g * 255), lroundf(b * 255))
    }
}
