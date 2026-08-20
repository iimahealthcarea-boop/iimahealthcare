import { Phone } from "lucide-react";

const BottomBanner = () => {
  const handleWhatsAppClick = () => {
    window.open('https://wa.me/918595270617', '_blank');
  };

  return (
    <div 
      onClick={handleWhatsAppClick}
      className="fixed bottom-0 left-0 right-0 z-50 bg-muted/90 backdrop-blur-sm border-t border-border cursor-pointer hover:bg-muted/95 transition-colors duration-200"
    >
      <div className="container mx-auto px-3 py-2 sm:px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[11px] leading-tight text-muted-foreground sm:text-xs">
          <Phone className="h-3 w-3 flex-shrink-0" />
          <span className="text-center">
            Powered by Mrikal – Data &amp; AI Capability Center
          </span>
          <span className="whitespace-nowrap text-center">+91-8595270617</span>
        </div>
      </div>
    </div>
  );
};

export default BottomBanner;
