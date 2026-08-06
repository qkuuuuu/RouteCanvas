"use client";
import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, FilePlus2, LayoutTemplate, Search, Sparkles } from "lucide-react";
import { CANVAS_TEMPLATES, instantiateTemplate, type CanvasTemplate, type TemplateCategory } from "@/data/templates";
import { useCanvasStore } from "@/store/canvasStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { toast } from "@/lib/toast";
import { createProject } from "@/lib/canvasManager";

const categories: Array<"全部" | TemplateCategory> = ["全部", "品牌官网", "产品发布", "SaaS", "数据工作台", "移动应用"];

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const { accent, preview } = template;
  if (preview === "dashboard") return <span className="grid h-11 w-16 shrink-0 grid-cols-3 gap-1 rounded bg-[#10241d] p-1.5"><i className="col-span-3 h-1 rounded bg-white/30" /><i className="col-span-3 h-2 rounded bg-white/10" /><i className="h-4 rounded bg-white/10" /><i className="h-4 rounded bg-white/10" /><i className="h-4 rounded" style={{ backgroundColor: accent }} /></span>;
  if (preview === "mobile") return <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded bg-[#fff1ed]"><i className="flex h-9 w-5 flex-col gap-1 rounded-sm p-1 shadow-sm" style={{ backgroundColor: accent }}><b className="h-1 w-3 self-center rounded bg-white/80" /><b className="h-4 rounded bg-white" /><b className="h-1 rounded bg-white/60" /></i></span>;
  if (preview === "studio") return <span className="flex h-11 w-16 shrink-0 items-end gap-1 rounded bg-[#11110f] p-1.5"><i className="mb-2 h-1 w-7 rounded bg-white/70" /><i className="h-8 flex-1 rounded-sm" style={{ backgroundColor: accent }} /></span>;
  if (preview === "launch") return <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded bg-[#f5f2ec] p-1.5"><i className="h-8 w-7 rounded-sm" style={{ backgroundColor: accent }} /><i className="h-6 flex-1 rounded bg-[#d8d0c4]" /></span>;
  if (preview === "commerce") return <span className="flex h-11 w-16 shrink-0 gap-1 rounded bg-[#f4f0e8] p-1.5"><i className="flex-1 rounded bg-[#d7d0c3]" /><i className="w-4 rounded" style={{ backgroundColor: accent }} /></span>;
  return <span className="grid h-11 w-16 shrink-0 grid-cols-3 gap-1 rounded bg-[#f4f2ff] p-1.5"><i className="col-span-3 h-2 rounded bg-white" /><i className="rounded bg-white" /><i className="rounded" style={{ backgroundColor: accent }} /><i className="rounded bg-white" /></span>;
}

export function WorkspaceSidebar() {
  const collapsed = useWorkspaceStore((s) => s.workspaceSidebarCollapsed);
  const toggle = useWorkspaceStore((s) => s.toggleWorkspaceSidebar);
  const setActivePageId = useWorkspaceStore((s) => s.setActivePageId);
  const setView = useWorkspaceStore((s) => s.setView);
  const openStudio = useWorkspaceStore((s) => s.openStudio);
  const pages = useCanvasStore((s) => s.pages);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<(typeof categories)[number]>("全部");
  const filtered = CANVAS_TEMPLATES.filter((template) => (category === "全部" || template.category === category) && (`${template.name}${template.description}`).toLowerCase().includes(query.toLowerCase()));
  const createBlankProject = () => {
    const pageId = createProject();
    setActivePageId(pageId);
    setView("design");
    openStudio();
  };

  if (collapsed) {
    return (
      <aside className="flex w-11 shrink-0 flex-col items-center gap-1 border-r border-gray-200 bg-white py-2">
        <button className="grid h-8 w-8 place-items-center rounded text-gray-500 transition-colors hover:bg-gray-100" onClick={toggle} title="展开工作区"><ChevronRight size={16} /></button>
        <div className="my-1 h-px w-6 bg-gray-100" />
        <button className="grid h-8 w-8 place-items-center rounded text-indigo-600 transition-colors hover:bg-indigo-50" onClick={createBlankProject} title="新建设计项目"><FilePlus2 size={16} /></button>
        <LayoutTemplate size={16} className="mt-1 text-gray-400" />
      </aside>
    );
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-11 items-center gap-2 border-b border-gray-100 px-3">
        <span className="grid h-5 w-5 place-items-center rounded brand-gradient text-[9px] font-bold text-white"><Sparkles size={11} /></span>
        <span className="text-xs font-semibold text-gray-800">开始</span>
        <button className="ml-auto rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700" onClick={toggle} title="收起工作区"><ChevronLeft size={15} /></button>
      </div>
      <div className="space-y-1.5 border-b border-gray-100 p-2">
        {pages.length > 0 && (
          <button className="btn-brand flex h-8 w-full items-center justify-center gap-1.5 rounded text-xs font-medium text-white" onClick={() => { setActivePageId(pages[0].id); setView("design"); openStudio(); }}><Sparkles size={14} /> 继续编辑</button>
        )}
        <button className={`flex h-8 w-full items-center justify-center gap-1.5 rounded text-xs font-medium transition-colors ${pages.length ? "border border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/40" : "btn-brand text-white"}`} onClick={createBlankProject}><FilePlus2 size={14} /> 新建设计</button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="px-2 pt-2">
          <div className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase text-gray-400"><LayoutTemplate size={12} /> 模板库</div>
          <div className="relative"><Search size={12} className="absolute left-2 top-2 text-gray-400" /><input className="h-7 w-full rounded border border-gray-200 pl-7 pr-2 text-[11px] outline-none focus:border-indigo-400" placeholder="搜索模板" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          <div className="relative mt-2">
            <select
              className="h-7 w-full appearance-none rounded border border-gray-200 bg-gray-50 px-2 pr-7 text-[10px] font-medium text-gray-600 outline-none hover:bg-white focus:border-indigo-400"
              value={category}
              onChange={(event) => setCategory(event.target.value as (typeof categories)[number])}
              aria-label="模板分类"
            >
              {categories.map((item) => <option key={item} value={item}>{item === "全部" ? "全部类型" : item}</option>)}
            </select>
            <ChevronDown size={12} className="pointer-events-none absolute right-2 top-2 text-gray-400" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1.5">
            {filtered.map((template) => (
              <button key={template.id} className="card-lift flex w-full items-center gap-2 rounded-lg border border-gray-200 p-2 text-left hover:border-indigo-300 hover:bg-indigo-50/40" onClick={() => { const id = instantiateTemplate(template); setActivePageId(id); setView("design"); openStudio(); toast.success(`已从模板创建项目：${template.name}`); }}>
                <TemplatePreview template={template} />
                <span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-medium text-gray-700">{template.name}</span><span className="block truncate text-[9px] text-gray-400">{template.description}</span></span>
                <span className="text-[9px] text-gray-300">{template.category}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
