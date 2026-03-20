export type ProjectStatus = "draft" | "completed" | "in-progress";

export interface Project {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  status: ProjectStatus;
  techStackArray: string[];
  componentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectCreateInput = Omit<Project, "id" | "createdAt" | "updatedAt">;
