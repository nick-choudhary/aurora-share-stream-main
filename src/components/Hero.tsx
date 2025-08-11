import { Button } from "@/components/ui/button";
import { ArrowDown, Zap, Globe, MessageSquare } from "lucide-react";

const Hero = () => {
  const scrollToForm = () => {
    const formElement = document.getElementById("content-form");
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20"></div>
      <div className="absolute inset-0 aurora-glow opacity-30"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-pulse">
        <div className="w-2 h-2 bg-primary rounded-full"></div>
      </div>
      <div className="absolute top-40 right-20 animate-pulse animation-delay-300">
        <div className="w-3 h-3 bg-accent rounded-full"></div>
      </div>
      <div className="absolute bottom-40 left-20 animate-pulse animation-delay-700">
        <div className="w-2 h-2 bg-secondary rounded-full"></div>
      </div>

      <div className="relative z-10 text-center space-y-8 px-4 max-w-4xl mx-auto">
        <div className="space-y-6 animate-slide-in-up">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent bg-[length:200%_auto] animate-aurora">
              Claim Your
            </span>
            <br />
            <span className="text-foreground">Exclusive Resource</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Thank you for engaging with my LinkedIn post! Get your personalized
            resource by sharing your comment link below.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground animate-fade-in-delayed">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-primary" />
            <span>Instant Access</span>
          </div>
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4 text-accent" />
            <span>Comment Based</span>
          </div>
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-secondary" />
            <span>Exclusive Content</span>
          </div>
        </div>

        <div className="space-y-4 animate-fade-in-delayed">
          <Button
            onClick={scrollToForm}
            size="lg"
            className="px-8 py-4 text-lg font-semibold transition-all duration-300 hover:shadow-glow transform hover:scale-105"
          >
            Get My Resource
            <ArrowDown className="ml-2 h-5 w-5" />
          </Button>

          <p className="text-sm text-muted-foreground">
            No signup required • Exclusive for commenters • Instant delivery
          </p>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <Button
          variant="ghost"
          size="sm"
          onClick={scrollToForm}
          className="opacity-60 hover:opacity-100 transition-opacity"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Hero;
