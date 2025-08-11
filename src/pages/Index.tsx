import Hero from '@/components/Hero';
import ContentShareForm from '@/components/ContentShareForm';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <Hero />
      
      {/* Main Content Form */}
      <div id="content-form" className="py-20 px-4">
        <div className="container mx-auto">
          <ContentShareForm />
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-12 border-t border-border/50 bg-muted/20">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground">
            Built with care for our LinkedIn community
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
