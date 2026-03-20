import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import type { Project, ProjectCreateInput } from "@/types/project";

function fromFirestore(id: string, data: Record<string, unknown>): Project {
  return {
    id,
    userId: data.userId as string,
    title: data.title as string,
    prompt: data.prompt as string,
    status: data.status as Project["status"],
    techStackArray: (data.techStackArray as string[]) ?? [],
    componentCount: (data.componentCount as number) ?? 0,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate()
        : new Date(),
    updatedAt:
      data.updatedAt instanceof Timestamp
        ? data.updatedAt.toDate()
        : new Date(),
  };
}

export async function createProject(input: ProjectCreateInput): Promise<string> {
  if (!db) throw new Error("Firestore not initialized");
  const ref = await addDoc(collection(db, "projects"), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteProject(projectId: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized");
  await deleteDoc(doc(db, "projects", projectId));
}

export function subscribeToProjects(
  userId: string,
  callback: (projects: Project[]) => void,
): Unsubscribe {
  if (!db) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
  );
  return onSnapshot(q, (snap) => {
    const projects = snap.docs.map((d) =>
      fromFirestore(d.id, d.data() as Record<string, unknown>),
    );
    callback(projects);
  });
}
