// 将 pdfjs-dist 的 worker 同步到 public/（浏览器按模块 worker 加载，避免打包器处理 import.meta 失败）
import { copyFileSync, mkdirSync, existsSync } from "node:fs";

const src = "node_modules/pdfjs-dist/build/pdf.worker.min.mjs";
const dest = "public/pdf.worker.min.mjs";

if (existsSync(src)) {
  mkdirSync("public", { recursive: true });
  copyFileSync(src, dest);
  console.log("[sync-pdf-worker] pdf.worker.min.mjs -> public/");
} else {
  console.warn("[sync-pdf-worker] 未找到 pdfjs-dist worker，跳过");
}

const pptxSrc = "node_modules/pptxgenjs/dist/pptxgen.min.js";
const pptxDest = "public/vendor/pptxgen.min.js";
const zipSrc = "node_modules/jszip/dist/jszip.min.js";
const zipDest = "public/vendor/jszip.min.js";
if (existsSync(zipSrc)) {
  mkdirSync("public/vendor", { recursive: true });
  copyFileSync(zipSrc, zipDest);
  console.log("[sync-browser-vendors] jszip.min.js -> public/vendor/");
} else {
  console.warn("[sync-browser-vendors] 未找到 jszip browser bundle，跳过");
}
if (existsSync(pptxSrc)) {
  mkdirSync("public/vendor", { recursive: true });
  copyFileSync(pptxSrc, pptxDest);
  console.log("[sync-browser-vendors] pptxgen.min.js -> public/vendor/");
} else {
  console.warn("[sync-browser-vendors] 未找到 pptxgenjs browser bundle，跳过");
}
