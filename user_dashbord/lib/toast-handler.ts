import { toast } from "@/hooks/use-toast";

export const showErrorToast = (message: string, title?: string) => {
  toast({
    variant: "destructive",
    title: title || "Error",
    description: message,
  });
};

export const showSuccessToast = (message: string, title?: string) => {
  toast({
    variant: "success",
    title: title || "Success",
    description: message,
  });
};

export const showInfoToast = (message: string, title?: string) => {
  toast({
    variant: "info",
    title: title || "Info",
    description: message,
  });
};
