import { PageLoader } from "@/components/ui/PageLoader";

export default function Loading() {
  return <PageLoader label="Carregando configurações" blocks={3} />;
}
