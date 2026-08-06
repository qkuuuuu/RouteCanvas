/**
 * 文件文本提取 —— 让一切"有文字的格式"都能作为设计参考资料
 * docx(mammoth) / pptx(jszip 解 XML) / pdf(pdfjs-dist) 均动态导入，不影响首屏体积。
 * 旧版 .doc/.ppt 浏览器无法解析，提示用户另存为新格式。
 */

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

async function parseDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

async function parsePptx(file: File): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slidePaths = Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort((a, b) => {
      const num = (p: string) => Number(p.match(/slide(\d+)\.xml$/)?.[1] ?? 0);
      return num(a) - num(b);
    });
  const slides: string[] = [];
  for (const path of slidePaths) {
    const xml = await zip.files[path].async("string");
    const texts = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => decodeEntities(m[1]));
    if (texts.length) slides.push(`[第 ${slides.length + 1} 页] ${texts.join(" · ")}`);
  }
  return slides.join("\n");
}

async function parsePdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // worker 静态托管在 public/（避免打包器处理 import.meta 失败），与 pdfjs-dist 版本保持一致
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
  const doc = await task.promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text) pages.push(`[第 ${i} 页] ${text}`);
  }
  void task.destroy();
  return pages.join("\n");
}

/** 判断是否为浏览器可直接解析的文档格式 */
export function isParsableDoc(name: string): boolean {
  return /\.(docx|pptx|pdf)$/i.test(name);
}

/**
 * 统一入口：任意受支持文件 → 纯文本。
 * 文本类（md/txt/json/html/csv 等）直接读取；Office/PDF 走解析器。
 */
export async function parseFileToText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (/\.(doc|ppt|xls)$/i.test(name)) {
    throw new Error("旧版 Office 格式无法在浏览器解析，请另存为 docx/pptx 后重试");
  }
  if (name.endsWith(".docx")) return parseDocx(file);
  if (name.endsWith(".pptx")) return parsePptx(file);
  if (name.endsWith(".pdf")) return parsePdf(file);
  return file.text();
}
