"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function FormatNumeroCommande({ numero }: { numero: string }) {
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(numero);
      toast({
        title: "Numéro copié",
        description: `${numero} a été copié dans le presse-papier.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le numéro.",
        variant: "destructive",
      });
      console.error("Erreur lors de la copie:", error);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
        {numero}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5"
        onClick={copyToClipboard}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}
