import { Injectable } from '@angular/core';
import { createWorker } from 'tesseract.js';

@Injectable({
  providedIn: 'root',
})
export class OcrService {
  private worker: any;
  private readonly LANGUAGE_CODES = 'eng+fra';
  private readonly BEST_DATA_PATH = 'https://tessdata.projectnaptha.com/4.0.0_best/';

  // Property to hold the *active* progress callback for the current job (Main Thread Scope)
  private currentJobProgressCallback: ((p: number) => void) | undefined;

  private async init() {
    if (this.worker) return;

    console.log('Initializing Tesseract Worker...');

    // 1. Create the worker and set the global logger here.
    // This logger will now be the ONLY way we receive progress updates.
    this.worker = await createWorker(this.LANGUAGE_CODES, 1, {
      langPath: this.BEST_DATA_PATH,
      // 2. The global logger directs ALL worker messages to a safe handler method.
      logger: (m) => {
        this.handleTesseractMessage(m);
      },
    });
    console.log('Tesseract Worker initialized successfully.');
  }

  // Method to safely receive and handle messages from the Tesseract worker
  private handleTesseractMessage(m: any) {
    // 1. Check for the specific progress status and a valid callback
    if (m.status === 'recognizing text' && m.progress && this.currentJobProgressCallback) {
      // 2. The component's function is executed here in the Main Thread.
      this.currentJobProgressCallback(m.progress);
    }
    // Note: This handler can also be used for loading statuses if needed
  }

  /**
   * Performs OCR recognition on a Base64 data URL and reports progress.
   * @param dataUrl The image file as a Base64 data URL.
   * @param onProgress Optional callback to report progress (0 to 1).
   * @returns The extracted text.
   */
  async recognizeFromBase64(dataUrl: string, onProgress?: (p: number) => void, langs?: string[]) {
    await this.init();

    // 3. Store the component's function reference before starting the job.
    this.currentJobProgressCallback = onProgress;

    try {
      // 4. Call recognize *WITHOUT* the logger option in the job options.
      //    This is the KEY fix that prevents the function from being sent to the worker.
      const { data } = await this.worker.recognize(dataUrl);

      return data.text;
    } catch (error) {
      console.error('OCR recognition failed:', error);
      throw error;
    } finally {
      // 5. IMPORTANT: Clean up the reference after the job completes or fails
      this.currentJobProgressCallback = undefined;
    }
  }

  async recognizeWithMultipleAttempts(
    base64: string,
    progressCallback?: (progress: number) => void
  ): Promise<string> {
    const attempts = [
      { langs: ['eng'], label: 'English' },
      { langs: ['fra'], label: 'French' },
      { langs: ['eng', 'fra'], label: 'English + French' }
    ];

    let bestResult = '';
    let bestConfidence = 0;

    for (const attempt of attempts) {
      try {
        console.log(`Attempting OCR with ${attempt.label}...`);
        const result = await this.recognizeFromBase64(base64, progressCallback, attempt.langs);

        // Calculate confidence based on text length and recognizable words
        const confidence = this.calculateConfidence(result);

        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestResult = result;
        }
      } catch (error) {
        console.warn(`OCR attempt with ${attempt.label} failed:`, error);
      }
    }

    return bestResult;
  }

  private calculateConfidence(text: string): number {
    // Simple confidence calculation based on:
    // 1. Text length
    // 2. Ratio of alphanumeric characters
    // 3. Presence of common words

    if (!text || text.length === 0) return 0;

    const alphanumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length;
    const alphanumericRatio = alphanumericCount / text.length;

    const commonWords = ['invoice', 'facture', 'total', 'date', 'ref', 'price', 'qty'];
    const foundWords = commonWords.filter(word =>
      text.toLowerCase().includes(word)
    ).length;

    const wordScore = foundWords / commonWords.length;

    return (alphanumericRatio * 0.5 + wordScore * 0.5) * text.length;
  }
}
