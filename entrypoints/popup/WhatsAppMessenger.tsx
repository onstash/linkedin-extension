import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useExtensionStore } from "@/lib/store";
import { useEffect } from "react";

export function WhatsAppMessenger() {
  const { whatsAppNumber, getWhatsAppNumber, openWhatsApp } = useExtensionStore();

  useEffect(() => {
    getWhatsAppNumber();
  }, []);

  if (!whatsAppNumber) return null;

  return (
    <Button
      onClick={openWhatsApp}
      variant="outline"
      className="w-full gap-2 border-green-500 text-green-600 hover:bg-green-50 mt-4"
    >
      <MessageSquare className="h-4 w-4" /> Send WhatsApp Msg
    </Button>
  );
}
