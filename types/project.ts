export type ProjectStatus = "draft" | "in-progress" | "completed" | "launched" | "archived";

export interface Project {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  status: ProjectStatus;
  techStackArray: string[];
  componentCount: number;
  architectureJson?: string;
  checklistChecked?: number[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectCreateInput = Omit<Project, "id" | "createdAt" | "updatedAt">;
