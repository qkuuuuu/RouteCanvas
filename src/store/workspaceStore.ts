import { create } from "zustand";
import type { BreakpointKey } from "@/types/schema";

export type EditorView = "design" | "flow";
export type SidebarTab = "layers" | "components" | "tokens";

interface WorkspaceStore {
  view: EditorView;
  sidebarTab: SidebarTab;
  activePageId: string | null;
  breakpoint: BreakpointKey;
  workspaceSidebarCollapsed: boolean;
  designPanelExpanded: boolean;
  studioOpen: boolean;
  setView: (view: EditorView) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setActivePageId: (id: string | null) => void;
  setBreakpoint: (breakpoint: BreakpointKey) => void;
  toggleWorkspaceSidebar: () => void;
  toggleDesignPanel: (tab: SidebarTab) => void;
  openStudio: () => void;
  closeStudio: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  view: "design",
  sidebarTab: "layers",
  activePageId: null,
  breakpoint: "desktop",
  workspaceSidebarCollapsed: false,
  designPanelExpanded: false,
  studioOpen: false,
  setView: (view) => set({ view }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setActivePageId: (activePageId) => set({ activePageId }),
  setBreakpoint: (breakpoint) => set({ breakpoint }),
  toggleWorkspaceSidebar: () => set((state) => ({ workspaceSidebarCollapsed: !state.workspaceSidebarCollapsed })),
  toggleDesignPanel: (tab) => set((state) => ({
    sidebarTab: tab,
    designPanelExpanded: state.sidebarTab === tab ? !state.designPanelExpanded : true,
  })),
  openStudio: () => set({ studioOpen: true, view: "design", workspaceSidebarCollapsed: true }),
  closeStudio: () => set({ studioOpen: false, workspaceSidebarCollapsed: false }),
}));
