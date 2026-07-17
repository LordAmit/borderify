import XCTest
@testable import Borderify

final class BorderRendererTests: XCTestCase {
    
    // Helper to generate a dummy test image
    private func createTestImage(width: CGFloat, height: CGFloat) -> UIImage {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1.0
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: width, height: height), format: format)
        return renderer.image { ctx in
            ctx.cgContext.setFillColor(UIColor.green.cgColor)
            ctx.cgContext.fill(CGRect(x: 0, y: 0, width: width, height: height))
        }
    }
    
    func testRenderResolvesOriginalAspectRatio() {
        let uiImage = createTestImage(width: 800, height: 600)
        let item = ImageItem(url: nil, uiImage: uiImage, width: 800, height: 600, exif: ExifData())
        
        var config = AppConfig()
        config.layout.aspectRatio = "Original"
        config.layout.borderWidthScale = 0.0 // no border for raw calculation
        
        let outputImage = BorderRenderer.render(imageItem: item, config: config, isPreview: true)
        
        // Target is bounded to 1600 max for preview, so it shouldn't scale up or down
        XCTAssertEqual(outputImage.size.width, 800, accuracy: 1.0)
        XCTAssertEqual(outputImage.size.height, 600, accuracy: 1.0)
    }
    
    func testRenderResizesToAspectRatio() {
        let uiImage = createTestImage(width: 500, height: 500)
        let item = ImageItem(url: nil, uiImage: uiImage, width: 500, height: 500, exif: ExifData())
        
        var config = AppConfig()
        config.layout.aspectRatio = "4:3"
        config.layout.borderWidthScale = 0.0
        
        let outputImage = BorderRenderer.render(imageItem: item, config: config, isPreview: true)
        
        // 4:3 aspect ratio on 500x500 base length (longest edge remains 500)
        XCTAssertEqual(outputImage.size.width, 500, accuracy: 1.0)
        XCTAssertEqual(outputImage.size.height, 375, accuracy: 1.0)
    }
    
    func testRenderPreviewScaleLimiting() {
        // Very large image
        let uiImage = createTestImage(width: 4000, height: 3000)
        let item = ImageItem(url: nil, uiImage: uiImage, width: 4000, height: 3000, exif: ExifData())
        
        var config = AppConfig()
        config.layout.aspectRatio = "Original"
        
        // isPreview: true should cap the longest edge at 1600
        let outputImage = BorderRenderer.render(imageItem: item, config: config, isPreview: true)
        XCTAssertEqual(outputImage.size.width, 1600, accuracy: 1.0)
        XCTAssertEqual(outputImage.size.height, 1200, accuracy: 1.0)
    }
}
