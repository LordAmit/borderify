import Foundation
import SwiftUI

struct ExifData: Codable, Equatable {
    var make: String?
    var model: String?
    var focalLength: Double?
    var fNumber: Double?
    var iso: Int?
    var exposureTime: String? // e.g. "1/250" or "0.5"
    var lensModel: String?
    var date: String? // ISO format or formatted date string
}

struct ImageItem: Identifiable, Equatable {
    let id = UUID()
    let url: URL?
    let uiImage: UIImage
    var width: CGFloat
    var height: CGFloat
    var exif: ExifData
    var captionText: String?
}

enum BackgroundType: String, Codable {
    case color
    case blurredImage = "blurred-image"
}

struct LayoutSettings: Codable, Equatable {
    var aspectRatio: String = "Original" // "Original", "1:1", "4:3", "3:4", "16:9", "9:16", "3:2", "2:3"
    var backgroundColor: String = "#FFFFFF"
    var backgroundType: BackgroundType = .color
    var backgroundBlurScale: Double = 0.05
    var backgroundDimScale: Double = 0.0
    var borderWidthScale: Double = 0.04
    var imagePaddingScale: Double = 0.0
    var innerBorderColor: String = "#FFFFFF"
    var innerBorderMode: String = "polaroid" // "uniform" | "polaroid" | "custom"
    var innerBorderTopScale: Double = 0.04
    var innerBorderBottomScale: Double = 0.12
    var innerBorderSideScale: Double = 0.04
    var imageRadiusScale: Double = 0.0
    var innerImageRadiusScale: Double = 0.0
    var imageShadowBlurScale: Double = 0.02
    var innerImageShadowBlurScale: Double = 0.0
    var photoBorderColor: String = "#000000"
    var photoBorderWidthScale: Double = 0.0
}

struct TextLabel: Codable, Identifiable, Equatable {
    var id = UUID()
    var show: Bool = true
    var text: String = ""
    var fontFamily: String = "HelveticaNeue"
    var fontSizeScale: Double = 0.03
    var color: String = "#000000"
    var strokeColor: String = "#FFFFFF"
    var strokeWidthScale: Double = 0.0
    var position: String = "Bottom Left"
    var positionXScale: Double = 0.0
    var positionYScale: Double = 0.0
    var fontWeight: String = "normal"
    var fontStyle: String = "normal"
    
    enum CodingKeys: String, CodingKey {
        case show, text, fontFamily, fontSizeScale, color, strokeColor, strokeWidthScale, position, positionXScale, positionYScale, fontWeight, fontStyle
    }
}

struct LogoSettings: Codable, Equatable {
    var sizeScale: Double = 0.06
    var position: String = "Bottom Right"
    var offsetXScale: Double = 0.0
    var offsetYScale: Double = 0.0
}

struct ExifPillSettings: Codable, Equatable {
    var show: Bool = true
    var showFocal: Bool = true
    var showAperture: Bool = true
    var showIso: Bool = true
    var showShutter: Bool = true
    var showLens: Bool = false
    var showCamera: Bool = false
    var showDate: Bool = false
    var position: String = "Bottom Center"
    var positionXScale: Double = 0.0
    var positionYScale: Double = 0.0
    var boxColor: String = "#F2F2F7"
    var textColor: String = "#1C1C1E"
    var textStrokeColor: String = "#FFFFFF"
    var textStrokeWidthScale: Double = 0.0
    var borderColor: String = "#E5E5EA"
    var fontFamily: String = "HelveticaNeue"
    var fontSizeScale: Double = 0.015
    var borderWidthScale: Double = 0.001
    var internalPaddingScale: Double = 0.6
    var pillTextSpacingScale: Double = 0.7
    var customCameraText: String?
    var customLensText: String?
}

struct ExportSettings: Codable, Equatable {
    var quality: Double = 90.0 // 1.0 to 100.0
    var maxResolution: String = "Original" // "Original" | "4K" | "Facebook" | "Instagram"
}

struct AppConfig: Codable, Equatable {
    var layout = LayoutSettings()
    var labels: [TextLabel] = [
        TextLabel(show: true, text: "{make} {model}", position: "Bottom Left", positionXScale: 0.05, positionYScale: -0.075, fontWeight: "bold"),
        TextLabel(show: true, text: "{lens}", color: "#666666", position: "Bottom Left", positionXScale: 0.05, positionYScale: -0.045)
    ]
    var logo = LogoSettings()
    var exifPills = ExifPillSettings()
    var export = ExportSettings()
}
