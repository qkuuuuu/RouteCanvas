"use client";
import * as React from "react";
import { X, Plus, Copy, Trash2, Pencil, Check, FolderOpen } from "lucide-react";
import {
  getCanvasList,
  getActiveCanvasId,
  createCanvas,
  switchCanvas,
  renameCanvas,
  deleteCanvas,
  duplicateCanvas,
  type CanvasMeta,
} from "@/lib/canvasManager";
import { toast } from "@/lib/toast";

export function CanvasManagerDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [list, setList] = React.useState<CanvasMeta[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);

  const refresh = React.useCallback(() => {
    setList(getCanvasList());
    setActiveId(getActiveCanvasId());
  }, []);

  React.useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  if (!open) return null;

  const onNew = () => {
    const id = createCanvas();
    switchCanvas(id);
    refresh();
    toast.success("新项目已创建");
  };

  const onSwitch = (id: string) => {
    switchCanvas(id);
    refresh();
    onClose();
  };

  const onRename = (id: string) => {
    if (editName.trim()) {
      renameCanvas(id, editName.trim());
      refresh();
    }
    setEditingId(null);
  };

  const onDelete = (id: string) => {
    deleteCanvas(id);
    setConfirmDelete(null);
    refresh();
    toast.success("项目已删除");
  };

  const onDuplicate = (id: string) => {
    duplicateCanvas(id);
    refresh();
    toast.success("项目已复制");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[70vh] flex flex-col">
        <div className="px-4 py-2.5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-blue-600" />
            <span className="text-sm font-semibold">项目管理</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onNew} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
              <Plus size={13} /> 新建
            </button>
            <button className="text-gray-400 hover:text-gray-700" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {list.length === 0 && (
            <div className="text-center text-xs text-gray-400 py-8">暂无项目</div>
          )}
          {list.map((c) => (
            <div
              key={c.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                c.id === activeId ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex-1 min-w-0">
                {editingId === c.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      className="flex-1 h-6 rounded border border-gray-300 px-2 text-xs"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && onRename(c.id)}
                      autoFocus
                    />
                    <button onClick={() => onRename(c.id)} className="text-green-600">
                      <Check size={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="text-xs font-medium text-gray-800 truncate">
                      {c.name}
                      {c.id === activeId && <span className="ml-1.5 text-[10px] text-blue-500">(当前)</span>}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {c.pageCount} 页 · {new Date(c.updatedAt).toLocaleDateString()}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {c.id !== activeId && (
                  <button onClick={() => onSwitch(c.id)} className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="切换">
                    <FolderOpen size={13} />
                  </button>
                )}
                <button
                  onClick={() => { setEditingId(c.id); setEditName(c.name); }}
                  className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  title="重命名"
                >
                  <Pencil size={13} />
                </button>
                <button onClick={() => onDuplicate(c.id)} className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100" title="复制">
                  <Copy size={13} />
                </button>
                {confirmDelete === c.id ? (
                  <button onClick={() => onDelete(c.id)} className="p-1 rounded text-red-600 hover:bg-red-50 text-[10px] font-medium">
                    确认
                  </button>
                ) : (
                  <button onClick={() => setConfirmDelete(c.id)} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50" title="删除">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-2.5 border-t flex justify-end">
          <button className="px-3 py-1.5 rounded text-xs text-gray-600 hover:bg-gray-100" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
