import Foundation
import SwiftUI
import CoreImage
import CoreGraphics

struct TextAnchor {
    let xCoordinate: CGFloat
    let yCoordinate: CGFloat
    let alignment: NSTextAlignment
}

struct MeasuredPill {
    let topText: String
    let bottomText: String
    let width: CGFloat
}

struct BorderRenderer {
    
    // Main render entry point
    static func render(imageItem: ImageItem, config: AppConfig, logo: UIImage? = nil, isPreview: Bool = false) -> UIImage {
        let image = imageItem.uiImage
        let originalWidth = image.size.width
        let originalHeight = image.size.height
        
        // 1. Determine target resolution limit
        var maxRes: CGFloat = 8000
        if isPreview {
            maxRes = 1600 // High-performance preview resolution
        } else {
            switch config.export.maxResolution {
            case "4K": maxRes = 3840
            case "Facebook": maxRes = 2048
            case "Instagram": maxRes = 1350
            default: maxRes = 8000
            }
        }
        
        var scaleLimit: CGFloat = 1.0
        let longestEdge = max(originalWidth, originalHeight)
        if longestEdge > maxRes {
            scaleLimit = maxRes / longestEdge
        }
        
        // 2. Determine target ratio
        var targetRatio = originalWidth / originalHeight
        if config.layout.aspectRatio != "Original" {
            let parts = config.layout.aspectRatio.split(separator: ":").compactMap { Double($0) }
            if parts.count == 2 {
                targetRatio = CGFloat(parts[0] / parts[1])
            }
        }
        
        let baseLength = longestEdge * scaleLimit
        var canvasWidth: CGFloat = 0
        var canvasHeight: CGFloat = 0
        
        if targetRatio > 1.0 {
            canvasWidth = baseLength
            canvasHeight = baseLength / targetRatio
        } else {
            canvasHeight = baseLength
            canvasWidth = baseLength * targetRatio
        }
        
        let minEdge = min(canvasWidth, canvasHeight)
        let outerPadding = minEdge * CGFloat(config.layout.borderWidthScale)
        
        // 3. Render Canvas
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1.0
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: canvasWidth, height: canvasHeight), format: format)
        
        let renderedImage = renderer.image { rendererContext in
            let ctx = rendererContext.cgContext
            
            // Draw background
            if config.layout.backgroundType == .color {
                ctx.setFillColor(UIColor(hex: config.layout.backgroundColor).cgColor)
                ctx.fill(CGRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight))
            } else {
                if let blurredBackground = createBlurredBackground(
                    img: image,
                    width: canvasWidth,
                    height: canvasHeight,
                    blurScale: config.layout.backgroundBlurScale,
                    dimScale: config.layout.backgroundDimScale
                ) {
                    blurredBackground.draw(in: CGRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight))
                }
            }
            
            // Calculate sizes for inner card
            let boxWidth = canvasWidth - (outerPadding * 2)
            let boxHeight = canvasHeight - (outerPadding * 2)
            
            let innerPadTop = baseLength * CGFloat(config.layout.innerBorderTopScale)
            let innerPadBottom = baseLength * CGFloat(config.layout.innerBorderBottomScale)
            let innerPadSide = baseLength * CGFloat(config.layout.innerBorderSideScale)
            
            let imgRatio = originalWidth / originalHeight
            let photoPadding = baseLength * CGFloat(config.layout.imagePaddingScale)
            
            let availableImgW = boxWidth - (innerPadSide * 2) - (photoPadding * 2)
            let availableImgH = boxHeight - (innerPadTop + innerPadBottom) - (photoPadding * 2)
            
            var photoWidth: CGFloat = 0
            var photoHeight: CGFloat = 0
            if imgRatio > (availableImgW / availableImgH) {
                photoWidth = availableImgW
                photoHeight = availableImgW / imgRatio
            } else {
                photoHeight = availableImgH
                photoWidth = availableImgH * imgRatio
            }
            
            let cardWidth = photoWidth + (innerPadSide * 2) + (photoPadding * 2)
            let cardHeight = photoHeight + innerPadTop + innerPadBottom + (photoPadding * 2)
            
            let cardXPosition = (canvasWidth - cardWidth) / 2
            let cardYPosition = (canvasHeight - cardHeight) / 2
            
            // Draw Inner Card Border
            ctx.saveGState()
            let radius = baseLength * CGFloat(config.layout.imageRadiusScale)
            let shadowBlur = baseLength * CGFloat(config.layout.imageShadowBlurScale)
            
            if shadowBlur > 0 {
                ctx.setShadow(
                    offset: CGSize(width: 0, height: shadowBlur * 0.3),
                    blur: shadowBlur,
                    color: UIColor.black.withAlphaComponent(0.5).cgColor
                )
            }
            
            ctx.setFillColor(UIColor(hex: config.layout.innerBorderColor).cgColor)
            let cardRect = CGRect(x: cardXPosition, y: cardYPosition, width: cardWidth, height: cardHeight)
            if radius > 0 {
                let path = UIBezierPath(roundedRect: cardRect, cornerRadius: radius)
                ctx.addPath(path.cgPath)
                ctx.fillPath()
            } else {
                ctx.fill(cardRect)
            }
            ctx.restoreGState()
            
            // Draw Actual Photo
            let photoXPosition = cardXPosition + innerPadSide + photoPadding
            let photoYPosition = cardYPosition + innerPadTop + photoPadding
            let photoRect = CGRect(x: photoXPosition, y: photoYPosition, width: photoWidth, height: photoHeight)
            
            ctx.saveGState()
            let photoRadius = baseLength * CGFloat(config.layout.innerImageRadiusScale)
            let photoShadow = baseLength * CGFloat(config.layout.innerImageShadowBlurScale)
            
            if photoShadow > 0 {
                ctx.saveGState()
                ctx.setShadow(
                    offset: CGSize(width: 0, height: photoShadow * 0.3),
                    blur: photoShadow,
                    color: UIColor.black.withAlphaComponent(0.5).cgColor
                )
                ctx.setFillColor(UIColor.white.cgColor)
                if photoRadius > 0 {
                    let path = UIBezierPath(roundedRect: photoRect, cornerRadius: photoRadius)
                    ctx.addPath(path.cgPath)
                    ctx.fillPath()
                } else {
                    ctx.fill(photoRect)
                }
                ctx.restoreGState()
            }
            
            if photoRadius > 0 {
                let clipPath = UIBezierPath(roundedRect: photoRect, cornerRadius: photoRadius)
                ctx.addPath(clipPath.cgPath)
                ctx.clip()
            }
            
            image.draw(in: photoRect)
            ctx.restoreGState()
            
            // Draw photo border stroke
            let photoStroke = baseLength * CGFloat(config.layout.photoBorderWidthScale)
            if photoStroke > 0 {
                ctx.saveGState()
                ctx.setLineWidth(photoStroke)
                ctx.setStrokeColor(UIColor(hex: config.layout.photoBorderColor).cgColor)
                if photoRadius > 0 {
                    let path = UIBezierPath(roundedRect: photoRect, cornerRadius: photoRadius)
                    ctx.addPath(path.cgPath)
                    ctx.strokePath()
                } else {
                    ctx.stroke(photoRect)
                }
                ctx.restoreGState()
            }
            
            // Draw EXIF Pills
            drawExifPills(
                ctx: ctx,
                image: imageItem,
                config: config,
                cardX: cardXPosition,
                cardY: cardYPosition,
                cardW: cardWidth,
                cardH: cardHeight,
                drawImgH: photoHeight,
                innerPadTop: innerPadTop,
                innerPadBottom: innerPadBottom,
                innerPadSide: innerPadSide,
                baseLength: baseLength
            )
            
            // Draw Labels
            drawLabels(
                ctx: ctx,
                image: imageItem,
                config: config,
                cardX: cardXPosition,
                cardY: cardYPosition,
                cardW: cardWidth,
                cardH: cardHeight,
                drawImgH: photoHeight,
                innerPadTop: innerPadTop,
                innerPadBottom: innerPadBottom,
                innerPadSide: innerPadSide,
                baseLength: baseLength
            )
            
            // Draw Logo
            if let logoImg = logo {
                drawLogo(
                    ctx: ctx,
                    logo: logoImg,
                    config: config,
                    cardX: cardXPosition,
                    cardY: cardYPosition,
                    cardW: cardWidth,
                    cardH: cardHeight,
                    drawImgH: photoHeight,
                    innerPadTop: innerPadTop,
                    innerPadBottom: innerPadBottom,
                    innerPadSide: innerPadSide,
                    baseLength: baseLength
                )
            }
        }
        
        return renderedImage
    }
    
    // Core Image blurred cover background utility
    private static func createBlurredBackground(img: UIImage, width: CGFloat, height: CGFloat, blurScale: Double, dimScale: Double) -> UIImage? {
        let maxDim: CGFloat = 800.0
        let scale = min(1.0, maxDim / max(img.size.width, img.size.height))
        let targetSize = CGSize(width: img.size.width * scale, height: img.size.height * scale)
        
        UIGraphicsBeginImageContext(targetSize)
        img.draw(in: CGRect(origin: .zero, size: targetSize))
        let downsampled = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        
        guard let downsampled = downsampled, let ciImage = CIImage(image: downsampled) else { return nil }
        
        let context = CIContext()
        guard let filter = CIFilter(name: "CIGaussianBlur") else { return nil }
        
        let radius = max(img.size.width, img.size.height) * scale * CGFloat(blurScale)
        filter.setValue(ciImage, forKey: kCIInputImageKey)
        filter.setValue(radius, forKey: kCIInputRadiusKey)
        
        guard let blurredCI = filter.outputImage else { return nil }
        let croppedCI = blurredCI.cropped(to: ciImage.extent)
        
        guard let cgImage = context.createCGImage(croppedCI, from: croppedCI.extent) else { return nil }
        let blurredImg = UIImage(cgImage: cgImage)
        
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1.0
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: width, height: height), format: format)
        
        return renderer.image { ctx in
            let drawRect = coverRect(for: CGSize(width: width, height: height), imageSize: blurredImg.size)
            blurredImg.draw(in: drawRect)
            
            if dimScale > 0 {
                ctx.cgContext.setFillColor(UIColor.black.withAlphaComponent(CGFloat(dimScale)).cgColor)
                ctx.cgContext.fill(CGRect(x: 0, y: 0, width: width, height: height))
            }
        }
    }
    
    private static func coverRect(for containerSize: CGSize, imageSize: CGSize) -> CGRect {
        let containerRatio = containerSize.width / containerSize.height
        let imageRatio = imageSize.width / imageSize.height
        
        var targetWidth: CGFloat = 0
        var targetHeight: CGFloat = 0
        if containerRatio > imageRatio {
            targetWidth = containerSize.width
            targetHeight = containerSize.width / imageRatio
        } else {
            targetHeight = containerSize.height
            targetWidth = containerSize.height * imageRatio
        }
        
        let xOffset = (containerSize.width - targetWidth) / 2
        let yOffset = (containerSize.height - targetHeight) / 2
        return CGRect(x: xOffset, y: yOffset, width: targetWidth, height: targetHeight)
    }
    
    // Resolve Text Tokens
    private static func resolveTemplate(_ text: String, exif: ExifData) -> String {
        var result = text
        result = result.replacingOccurrences(of: "{make}", with: exif.make ?? "", options: .caseInsensitive)
        result = result.replacingOccurrences(of: "{model}", with: exif.model ?? "", options: .caseInsensitive)
        result = result.replacingOccurrences(of: "{lens}", with: exif.lensModel ?? "", options: .caseInsensitive)
        if let focal = exif.focalLength {
            result = result.replacingOccurrences(of: "{focal}", with: "\(Int(focal))mm", options: .caseInsensitive)
        } else {
            result = result.replacingOccurrences(of: "{focal}", with: "", options: .caseInsensitive)
        }
        if let fNum = exif.fNumber {
            result = result.replacingOccurrences(of: "{aperture}", with: "f/\(fNum)", options: .caseInsensitive)
        } else {
            result = result.replacingOccurrences(of: "{aperture}", with: "", options: .caseInsensitive)
        }
        if let iso = exif.iso {
            result = result.replacingOccurrences(of: "{iso}", with: "ISO \(iso)", options: .caseInsensitive)
        } else {
            result = result.replacingOccurrences(of: "{iso}", with: "", options: .caseInsensitive)
        }
        result = result.replacingOccurrences(of: "{shutter}", with: exif.exposureTime ?? "", options: .caseInsensitive)
        result = result.replacingOccurrences(of: "{date}", with: exif.date ?? "", options: .caseInsensitive)
        
        // Clean double spaces and edge pipes
        return result.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    private static func getPreciseAnchor(
        cardW: CGFloat,
        cardH: CGFloat,
        imgH: CGFloat,
        padTop: CGFloat,
        padBottom: CGFloat,
        padSide: CGFloat,
        position: String
    ) -> TextAnchor {
        switch position {
        case "Top Left":
            return TextAnchor(xCoordinate: padSide / 2, yCoordinate: padTop / 2, alignment: .left)
        case "Top Center":
            return TextAnchor(xCoordinate: cardW / 2, yCoordinate: padTop / 2, alignment: .center)
        case "Top Right":
            return TextAnchor(xCoordinate: cardW - (padSide / 2), yCoordinate: padTop / 2, alignment: .right)
        case "Middle Left":
            return TextAnchor(xCoordinate: padSide / 2, yCoordinate: padTop + (imgH / 2), alignment: .left)
        case "Center":
            return TextAnchor(xCoordinate: cardW / 2, yCoordinate: padTop + (imgH / 2), alignment: .center)
        case "Middle Right":
            return TextAnchor(xCoordinate: cardW - (padSide / 2), yCoordinate: padTop + (imgH / 2), alignment: .right)
        case "Bottom Left":
            return TextAnchor(xCoordinate: padSide / 2, yCoordinate: cardH - (padBottom / 2), alignment: .left)
        case "Bottom Center":
            return TextAnchor(xCoordinate: cardW / 2, yCoordinate: cardH - (padBottom / 2), alignment: .center)
        case "Bottom Right":
            return TextAnchor(xCoordinate: cardW - (padSide / 2), yCoordinate: cardH - (padBottom / 2), alignment: .right)
        default:
            return TextAnchor(xCoordinate: cardW / 2, yCoordinate: cardH - (padBottom / 2), alignment: .center)
        }
    }
    
    private static func drawExifPills(
        ctx: CGContext,
        image: ImageItem,
        config: AppConfig,
        cardX: CGFloat,
        cardY: CGFloat,
        cardW: CGFloat,
        cardH: CGFloat,
        drawImgH: CGFloat,
        innerPadTop: CGFloat,
        innerPadBottom: CGFloat,
        innerPadSide: CGFloat,
        baseLength: CGFloat
    ) {
        guard config.exifPills.show else { return }
        
        var pairs: [(top: String, bottom: String)] = []
        let exif = image.exif
        
        if config.exifPills.showFocal, let focalLength = exif.focalLength { pairs.push((String(format: "%.0f", focalLength), "mm")) }
        if config.exifPills.showAperture, let aperture = exif.fNumber { pairs.push((String(format: "%.1f", aperture), "F")) }
        if config.exifPills.showIso, let iso = exif.iso { pairs.push(("\(iso)", "ISO")) }
        if config.exifPills.showShutter, let shutterSpeed = exif.exposureTime { pairs.push((shutterSpeed, "S")) }
        
        let lensText = resolveTemplate(config.exifPills.customLensText ?? "{lens}", exif: exif)
        if config.exifPills.showLens && !lensText.isEmpty { pairs.push((lensText, "LENS")) }
        
        let cameraText = resolveTemplate(config.exifPills.customCameraText ?? "{make} {model}", exif: exif)
        if config.exifPills.showCamera && !cameraText.isEmpty { pairs.push((cameraText, "CAMERA")) }
        
        if config.exifPills.showDate, let dateText = exif.date { pairs.push((dateText, "DATE")) }
        
        guard !pairs.isEmpty else { return }
        
        let fontSize = baseLength * CGFloat(config.exifPills.fontSizeScale)
        let boxPadding = fontSize * CGFloat(config.exifPills.internalPaddingScale)
        let boxHeight = fontSize * 1.8
        let gap = baseLength * 0.01
        
        let fontTop = UIFont.boldSystemFont(ofSize: fontSize)
        let fontBottom = UIFont.systemFont(ofSize: fontSize * 0.6)
        
        var measuredPills: [MeasuredPill] = []
        var totalWidth: CGFloat = 0
        
        for pair in pairs {
            let topSize = pair.top.size(withAttributes: [.font: fontTop])
            let botSize = pair.bottom.size(withAttributes: [.font: fontBottom])
            let pillWidth = max(topSize.width, botSize.width) + (boxPadding * 2)
            measuredPills.append(MeasuredPill(topText: pair.top, bottomText: pair.bottom, width: pillWidth))
            totalWidth += pillWidth
        }
        totalWidth += gap * CGFloat(measuredPills.count - 1)
        
        let anchor = getPreciseAnchor(
            cardW: cardW,
            cardH: cardH,
            imgH: drawImgH,
            padTop: innerPadTop,
            padBottom: innerPadBottom,
            padSide: innerPadSide,
            position: config.exifPills.position
        )
        
        let offsetX = CGFloat(config.exifPills.positionXScale) * baseLength
        let offsetY = CGFloat(config.exifPills.positionYScale) * baseLength
        
        var startX = cardX + anchor.xCoordinate + offsetX
        if anchor.alignment == .right {
            startX -= totalWidth
        } else if anchor.alignment == .center {
            startX -= (totalWidth / 2)
        }
        
        let startY = cardY + anchor.yCoordinate + offsetY - (boxHeight / 2)
        
        var currentX = startX
        for pill in measuredPills {
            ctx.saveGState()
            
            let pillRect = CGRect(x: currentX, y: startY, width: pill.width, height: boxHeight)
            let path = UIBezierPath(roundedRect: pillRect, cornerRadius: baseLength * 0.005)
            
            ctx.setFillColor(UIColor(hex: config.exifPills.boxColor).cgColor)
            ctx.addPath(path.cgPath)
            ctx.fillPath()
            
            let strokeW = baseLength * CGFloat(config.exifPills.borderWidthScale)
            if strokeW > 0 {
                ctx.setLineWidth(strokeW)
                ctx.setStrokeColor(UIColor(hex: config.exifPills.borderColor).cgColor)
                ctx.addPath(path.cgPath)
                ctx.strokePath()
            }
            
            let spacing = CGFloat(config.exifPills.pillTextSpacingScale)
            let topY = startY + boxHeight * (0.525 - spacing / 2) - fontSize * 0.5
            let bottomY = startY + boxHeight * (0.525 + spacing / 2) - (fontSize * 0.6) * 0.5
            
            let textColor = UIColor(hex: config.exifPills.textColor)
            let strokeColor = UIColor(hex: config.exifPills.textStrokeColor)
            let textStrokeW = baseLength * CGFloat(config.exifPills.textStrokeWidthScale)
            
            // Draw Top Text
            let topStyle = NSMutableParagraphStyle()
            topStyle.alignment = .center
            
            var topAttrs: [NSAttributedString.Key: Any] = [
                .font: fontTop,
                .foregroundColor: textColor,
                .paragraphStyle: topStyle
            ]
            
            if textStrokeW > 0 {
                topAttrs[.strokeColor] = strokeColor
                topAttrs[.strokeWidth] = -textStrokeW
            }
            
            let topTextRect = CGRect(x: currentX, y: topY, width: pill.width, height: fontSize * 1.2)
            pill.topText.draw(in: topTextRect, withAttributes: topAttrs)
            
            // Draw Bottom Text
            let botStyle = NSMutableParagraphStyle()
            botStyle.alignment = .center
            
            var botAttrs: [NSAttributedString.Key: Any] = [
                .font: fontBottom,
                .foregroundColor: textColor.withAlphaComponent(0.66),
                .paragraphStyle: botStyle
            ]
            
            if textStrokeW > 0 {
                botAttrs[.strokeColor] = strokeColor
                botAttrs[.strokeWidth] = -textStrokeW * 0.6
            }
            
            let botTextRect = CGRect(x: currentX, y: bottomY, width: pill.width, height: fontSize * 0.8 * 1.2)
            pill.bottomText.draw(in: botTextRect, withAttributes: botAttrs)
            
            ctx.restoreGState()
            currentX += pill.width + gap
        }
    }
    
    private static func drawLabels(
        ctx: CGContext,
        image: ImageItem,
        config: AppConfig,
        cardX: CGFloat,
        cardY: CGFloat,
        cardW: CGFloat,
        cardH: CGFloat,
        drawImgH: CGFloat,
        innerPadTop: CGFloat,
        innerPadBottom: CGFloat,
        innerPadSide: CGFloat,
        baseLength: CGFloat
    ) {
        for (index, label) in config.labels.enumerated() {
            let rawText = (index == 0 && image.captionText != nil) ? image.captionText! : label.text
            guard label.show && !rawText.isEmpty else { continue }
            
            let text = resolveTemplate(rawText, exif: image.exif)
            guard !text.isEmpty else { continue }
            
            let fontSize = baseLength * CGFloat(label.fontSizeScale)
            
            var font = UIFont.systemFont(ofSize: fontSize)
            if label.fontWeight == "bold" {
                font = label.fontStyle == "italic" ? UIFont.boldSystemFont(ofSize: fontSize).italicFont() : UIFont.boldSystemFont(ofSize: fontSize)
            } else {
                font = label.fontStyle == "italic" ? font.italicFont() : font
            }
            
            let anchor = getPreciseAnchor(
                cardW: cardW,
                cardH: cardH,
                imgH: drawImgH,
                padTop: innerPadTop,
                padBottom: innerPadBottom,
                padSide: innerPadSide,
                position: label.position
            )
            
            let offsetX = baseLength * CGFloat(label.positionXScale)
            let offsetY = baseLength * CGFloat(label.positionYScale)
            
            let strokeWidth = baseLength * CGFloat(label.strokeWidthScale)
            
            let paragraphStyle = NSMutableParagraphStyle()
            paragraphStyle.alignment = anchor.alignment
            
            var attrs: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: UIColor(hex: label.color),
                .paragraphStyle: paragraphStyle
            ]
            
            if strokeWidth > 0 {
                attrs[.strokeColor] = UIColor(hex: label.strokeColor)
                attrs[.strokeWidth] = -strokeWidth
            }
            
            let size = text.size(withAttributes: [.font: font])
            var xPosition = cardX + anchor.xCoordinate + offsetX
            if anchor.alignment == .right {
                xPosition -= size.width
            } else if anchor.alignment == .center {
                xPosition -= (size.width / 2)
            }
            let yPosition = cardY + anchor.yCoordinate + offsetY - (size.height / 2)
            
            let textRect = CGRect(x: xPosition, y: yPosition, width: size.width, height: size.height)
            text.draw(in: textRect, withAttributes: attrs)
        }
    }
    
    private static func drawLogo(
        ctx: CGContext,
        logo: UIImage,
        config: AppConfig,
        cardX: CGFloat,
        cardY: CGFloat,
        cardW: CGFloat,
        cardH: CGFloat,
        drawImgH: CGFloat,
        innerPadTop: CGFloat,
        innerPadBottom: CGFloat,
        innerPadSide: CGFloat,
        baseLength: CGFloat
    ) {
        let logoHeight = baseLength * CGFloat(config.logo.sizeScale)
        let logoWidth = logoHeight * (logo.size.width / logo.size.height)
        
        let logoAnchor = getPreciseAnchor(
            cardW: cardW,
            cardH: cardH,
            imgH: drawImgH,
            padTop: innerPadTop,
            padBottom: innerPadBottom,
            padSide: innerPadSide,
            position: config.logo.position
        )
        
        let logoOffsetX = baseLength * CGFloat(config.logo.offsetXScale)
        let logoOffsetY = baseLength * CGFloat(config.logo.offsetYScale)
        
        var xPosition = cardX + logoAnchor.xCoordinate + logoOffsetX
        if logoAnchor.alignment == .right {
            xPosition -= logoWidth
        } else if logoAnchor.alignment == .center {
            xPosition -= (logoWidth / 2)
        }
        let yPosition = cardY + logoAnchor.yCoordinate + logoOffsetY - (logoHeight / 2)
        
        logo.draw(in: CGRect(x: xPosition, y: yPosition, width: logoWidth, height: logoHeight))
    }
}

// Swift Array helper for JS push syntax compatibility
extension Array {
    mutating func push(_ element: Element) {
        self.append(element)
    }
}

// Hex Color Initializer
extension UIColor {
    convenience init(hex: String) {
        var cString: String = hex.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        
        if cString.hasPrefix("#") {
            cString.remove(at: cString.startIndex)
        }
        
        if cString.count != 6 {
            self.init(white: 1.0, alpha: 1.0)
            return
        }
        
        var rgbValue: UInt64 = 0
        Scanner(string: cString).scanHexInt64(&rgbValue)
        
        self.init(
            red: CGFloat((rgbValue & 0xFF0000) >> 16) / 255.0,
            green: CGFloat((rgbValue & 0x00FF00) >> 8) / 255.0,
            blue: CGFloat(rgbValue & 0x0000FF) / 255.0,
            alpha: 1.0
        )
    }
}

// Helper to italicize standard system font
extension UIFont {
    func italicFont() -> UIFont {
        if let descriptor = fontDescriptor.withSymbolicTraits(.traitItalic) {
            return UIFont(descriptor: descriptor, size: 0)
        }
        return self
    }
}
