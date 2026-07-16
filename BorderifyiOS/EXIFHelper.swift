import Foundation
import ImageIO
import UIKit
import UniformTypeIdentifiers

struct EXIFHelper {
    
    // Reads EXIF from image data
    static func readEXIF(from data: Data) -> ExifData {
        var exif = ExifData()
        
        guard let source = CGImageSourceCreateWithData(data as CFData, nil) else {
            return exif
        }
        
        guard let properties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any] else {
            return exif
        }
        
        // TIFF Properties (Make & Model)
        if let tiff = properties[kCGImagePropertyTIFFDictionary] as? [CFString: Any] {
            exif.make = tiff[kCGImagePropertyTIFFMake] as? String
            exif.model = tiff[kCGImagePropertyTIFFModel] as? String
        }
        
        // EXIF Properties
        if let exifDict = properties[kCGImagePropertyExifDictionary] as? [CFString: Any] {
            if let focal = exifDict[kCGImagePropertyExifFocalLength] as? Double {
                exif.focalLength = focal
            }
            if let fNum = exifDict[kCGImagePropertyExifFNumber] as? Double {
                exif.fNumber = fNum
            }
            if let isos = exifDict[kCGImagePropertyExifISOSpeedRatings] as? [Int], !isos.isEmpty {
                exif.iso = isos[0]
            } else if let isoSingle = exifDict[kCGImagePropertyExifISOSpeedRatings] as? Int {
                exif.iso = isoSingle
            }
            
            if let expTime = exifDict[kCGImagePropertyExifExposureTime] as? Double {
                if expTime < 1.0 {
                    let denominator = Int(round(1.0 / expTime))
                    exif.exposureTime = "1/\(denominator)"
                } else {
                    exif.exposureTime = String(format: "%.1f", expTime)
                }
            }
            
            if let lens = exifDict[kCGImagePropertyExifLensModel] as? String {
                exif.lensModel = lens
            }
            
            if let dateStr = exifDict[kCGImagePropertyExifDateTimeOriginal] as? String {
                exif.date = dateStr
            }
        }
        
        return exif
    }
    
    // Re-injects original EXIF metadata (plus any modifications) to output data
    static func writeEXIF(to uiImage: UIImage, originalData: Data?, quality: Double) -> Data? {
        guard let cgImage = uiImage.cgImage else { return nil }
        
        let outputData = NSMutableData()
        guard let destination = CGImageDestinationCreateWithData(outputData as CFMutableData, UTType.jpeg.identifier as CFString, 1, nil) else {
            return nil
        }
        
        var metadataDict: [CFString: Any] = [:]
        
        // If original data is available, load its original properties to preserve all headers
        if let originalData = originalData,
           let source = CGImageSourceCreateWithData(originalData as CFData, nil),
           let originalProperties = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any] {
            metadataDict = originalProperties
        }
        
        // Apply compression quality setting
        metadataDict[kCGImageDestinationLossyCompressionQuality] = (quality / 100.0) as CFNumber
        
        CGImageDestinationAddImage(destination, cgImage, metadataDict as CFDictionary)
        
        if CGImageDestinationFinalize(destination) {
            return outputData as Data
        }
        
        return nil
    }
}
