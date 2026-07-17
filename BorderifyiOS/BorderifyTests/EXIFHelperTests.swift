import XCTest
@testable import Borderify

final class EXIFHelperTests: XCTestCase {
    
    func testReadEXIFFromEmptyData() {
        let emptyData = Data()
        let exif = EXIFHelper.readEXIF(from: emptyData)
        
        XCTAssertNil(exif.make)
        XCTAssertNil(exif.model)
        XCTAssertNil(exif.focalLength)
        XCTAssertNil(exif.fNumber)
        XCTAssertNil(exif.iso)
        XCTAssertNil(exif.exposureTime)
        XCTAssertNil(exif.lensModel)
    }
    
    func testReadEXIFFromPixelData() {
        // Generate a 1x1 image without metadata
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1.0
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: 1, height: 1), format: format)
        let image = renderer.image { ctx in
            ctx.cgContext.setFillColor(UIColor.red.cgColor)
            ctx.cgContext.fill(CGRect(x: 0, y: 0, width: 1, height: 1))
        }
        
        guard let data = image.jpegData(compressionQuality: 0.9) else {
            XCTFail("Failed to generate test image data")
            return
        }
        
        let exif = EXIFHelper.readEXIF(from: data)
        XCTAssertNil(exif.make)
        XCTAssertNil(exif.model)
    }
    
    func testWriteEXIFPreservesQuality() {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1.0
        let renderer = UIGraphicsImageRenderer(size: CGSize(width: 10, height: 10), format: format)
        let image = renderer.image { ctx in
            ctx.cgContext.setFillColor(UIColor.blue.cgColor)
            ctx.cgContext.fill(CGRect(x: 0, y: 0, width: 10, height: 10))
        }
        
        let data = EXIFHelper.writeEXIF(to: image, originalData: nil, quality: 80.0)
        XCTAssertNotNil(data)
        XCTAssertGreaterThan(data?.count ?? 0, 0)
    }
}
