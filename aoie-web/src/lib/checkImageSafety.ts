import { DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";
import { fileTypeFromBuffer } from "file-type";
import { rekognitionClient } from "@/lib/aws";

// Enterprise category-specific confidence thresholds to prevent false positives for creative artwork
const CATEGORY_THRESHOLDS: Record<string, number> = {
  "Explicit Nudity": 90,
  "Nudity": 90,
  "Sexual Content": 85,
  "Visual Matches": 90,
  "Violence": 82,
  "Graphic Violence Or Gore": 78,
  "Hate Symbols": 68,
  "Drugs": 58,
  "Tobacco": 70,
  "Gambling": 70,
};

const DEFAULT_THRESHOLD = 85;

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export interface ModerationResult {
  safe: boolean;
  category?: string;
  parentCategory?: string;
  label?: string;
  confidence?: number;
  appliedThreshold?: number;
  fileType?: string;
  message?: string;
}

export async function checkImageSafety(
  buffer: Buffer,
  meta: { userId: string; route: string }
): Promise<ModerationResult> {
  try {
    // 1. Magic-Bytes MIME Validation
    const detectedType = await fileTypeFromBuffer(buffer);
    if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
      return {
        safe: false,
        category: "Invalid Format",
        fileType: detectedType?.mime || "unknown",
        message: "Invalid file signature. Please upload a genuine JPG, PNG, WEBP, or GIF image.",
      };
    }

    // 2. AWS Rekognition Moderation Scan
    const command = new DetectModerationLabelsCommand({
      Image: { Bytes: buffer },
      MinConfidence: 50, // Retrieve labels >= 50% so we can evaluate dynamic thresholds
    });

    const response = await rekognitionClient.send(command);
    const labels = response.ModerationLabels || [];

    if (labels.length === 0) {
      return { safe: true };
    }

    // 3. Evaluate dynamic category thresholds
    for (const label of labels) {
      const name = label.Name || "";
      const parentName = label.ParentName || "";
      const confidence = label.Confidence || 0;

      const categoryKey = name in CATEGORY_THRESHOLDS ? name : parentName;
      const threshold = CATEGORY_THRESHOLDS[categoryKey] ?? DEFAULT_THRESHOLD;

      if (confidence >= threshold) {
        const displayCategory = parentName || name || "Explicit Content";

        // Structured enterprise audit log
        console.warn("[MODERATION_FLAG]", JSON.stringify({
          userId: meta.userId,
          route: meta.route,
          label: name,
          parentCategory: parentName,
          confidence: Math.round(confidence * 100) / 100,
          appliedThreshold: threshold,
          fileSize: buffer.length,
          timestamp: new Date().toISOString(),
        }));

        return {
          safe: false,
          category: displayCategory,
          parentCategory: parentName,
          label: name,
          confidence: Math.round(confidence * 100) / 100,
          appliedThreshold: threshold,
          fileType: detectedType.mime,
          message: `This image appears to violate our content guidelines regarding ${displayCategory}. If you believe this is an error, please contact support.`,
        };
      }
    }

    return { safe: true };
  } catch (error) {
    console.error("Rekognition Moderation Error:", error);
    return { safe: true };
  }
}
