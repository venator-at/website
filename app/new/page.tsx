import { NewProjectClient } from "./_client";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function NewProjectPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  return <NewProjectClient initialPrompt={q} />;
}
