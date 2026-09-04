import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";

// SAVE PROJECT
export const saveProject = async (userId, design) => {
  if (!userId) {
    throw new Error("User is not authenticated.");
  }

  const projectRef = await addDoc(
    collection(db, "projects"),
    {
      userId,
      projectName: design.projectName || "Untitled Project",
      design,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  return projectRef.id;
};

// GET USER PROJECTS
export const getUserProjects = async (userId) => {
  if (!userId) {
    return [];
  }

  const projectsQuery = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(projectsQuery);

  return snapshot.docs.map((project) => ({
    id: project.id,
    ...project.data(),
  }));
};

// DELETE PROJECT
export const deleteProject = async (projectId) => {
  if (!projectId) {
    throw new Error("Project ID is required.");
  }

  await deleteDoc(
    doc(db, "projects", projectId)
  );
};