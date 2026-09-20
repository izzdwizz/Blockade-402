declare module "scribe.js-ocr" {
  interface Scribe {
    extractText(files: File[], langs?: string[], outputFormat?: string): Promise<string>;
  }
  const scribe: Scribe;
  export default scribe;
}
