import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Share2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GitBranch,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WebhookResponse {
  success: boolean;
  message: string;
  data?: any;
}

const ContentShareForm = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<WebhookResponse | null>(null);
  const { toast } = useToast();
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [health, setHealth] = useState<null | {
    ok: boolean;
    status?: number;
    method?: string;
    message?: string;
  }>(null);

  // Determine webhook URL from env, localStorage, or query param
  const effectiveWebhookUrl = useMemo(() => {
    const fromEnv = import.meta.env.VITE_WEBHOOK_URL as string | undefined;
    return fromEnv && fromEnv.trim() !== "" ? fromEnv.trim() : undefined;
  }, []);

  // Background health check against backend function (no UI config)
  useEffect(() => {
    if (!effectiveWebhookUrl) {
      setHealth(null);
      return;
    }
    const controller = new AbortController();
    fetch(`/.netlify/functions/check-webhook`, {
      method: "GET",
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok && data) {
          setHealth({ ok: true, status: data.status, method: data.method });
        } else {
          setHealth({ ok: false, status: data.status, message: data.message });
        }
      })
      .catch((err) => {
        setHealth({ ok: false, message: err.message });
      });
    return () => controller.abort();
  }, [effectiveWebhookUrl]);

  // Background health check
  useEffect(() => {
    const url = effectiveWebhookUrl;
    if (!url) {
      setHealth(null);
      return;
    }
    const controller = new AbortController();
    const q = new URLSearchParams({ url });
    fetch(`/.netlify/functions/check-webhook?${q.toString()}`, {
      method: "GET",
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok && data) {
          setHealth({ ok: true, status: data.status, method: data.method });
        } else {
          setHealth({ ok: false, status: data.status, message: data.message });
        }
      })
      .catch((err) => {
        setHealth({ ok: false, message: err.message });
      });
    return () => controller.abort();
  }, [effectiveWebhookUrl]);

  const extractIdFromUrl = (url: string): string | null => {
    try {
      // Extract ID from various URL patterns
      const patterns = [
        /ugcPost:(\d+)/, // Matches ugcPost:1234567890
        /activity:(\d+)/, // Matches activity:1234567890
        /activity-(\d+)/, // Matches activity-1234567890
        /\/feed\/update\/urn:li:(?:activity|ugcPost):(\d+)/, // Matches full LinkedIn feed URL
        /urn:li:(?:activity|ugcPost):(\d+)/, // Matches any URN inside a longer string
        /\/posts\/([^\/?#]+)/, // Matches /posts/xyzID123
        /\/id\/([^\/?#]+)/, // Matches /id/xyzID123
        /[?&]id=([^&]+)/, // Matches query param ?id=xyzID123
        /\/([a-zA-Z0-9_-]{10,})\/?$/, // Generic alphanumeric ID at end of URL
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
      }

      // If no pattern matches, use the last part of the path
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      return pathParts[pathParts.length - 1] || null;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid URL to share.",
        variant: "destructive",
      });
      return;
    }

    const extractedId = extractIdFromUrl(url);
    if (!extractedId) {
      toast({
        title: "ID Not Found",
        description: "Could not extract an ID from the provided URL.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResponse(null);
    setWebhookError(null);

    try {
      console.log("Making request to webhook with:", {
        comment_url: url.trim(),
        id: extractedId,
      });

      const webhookUrl = effectiveWebhookUrl;

      if (!webhookUrl) {
        toast({
          title: "Configuration Error",
          description:
            "Webhook URL is not configured. Please contact the administrator.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment_url: url.trim(),
          id: extractedId,
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);
      console.log("Response ok:", response.ok);

      let data;
      try {
        const responseText = await response.text();
        console.log("Raw response text:", responseText);
        data = JSON.parse(responseText);
        console.log("Parsed data:", data);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("Invalid response format from server");
      }

      setResponse({
        success: response.ok,
        message:
          data.message ||
          (response.ok
            ? "Content processed successfully!"
            : "Failed to process content"),
        data: data.data,
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Your request has been processed successfully.",
        });
      } else {
        setWebhookError(
          "Webhook not active - Please check your n8n configuration."
        );
        toast({
          title: "Webhook Not Active",
          description:
            "The webhook endpoint is not active. Please check your n8n configuration.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setWebhookError(
        "Unable to connect to webhook - Please check your n8n configuration."
      );
      setResponse({
        success: false,
        message: "Network error: Unable to connect to the service.",
      });

      toast({
        title: "Connection Error",
        description: "Unable to connect to the service. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Webhook status (checked via backend) */}
      <p className="text-xs text-muted-foreground">
        Webhook status: {" "}
        {effectiveWebhookUrl ? (
          health?.ok ? (
            <span className="text-green-600">reachable ({health?.method} {health?.status})</span>
          ) : health?.ok === false ? (
            <span className="text-amber-600">configured but unreachable</span>
          ) : (
            <span className="text-blue-600">checking…</span>
          )
        ) : (
          <span className="text-red-600">not configured</span>
        )}
      </p>
      {/* Webhook Error Banner */}
      {webhookError && (
        <Alert className="border-2 border-red-200 bg-red-50 text-foreground">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="font-medium text-red-800">
            {webhookError}
          </AlertDescription>
        </Alert>
      )}

      {/* Deploy Button */}
      <div className="text-center">
        <a
          href="https://app.netlify.com/start/deploy?repository=https://github.com/nick-choudhary/aurora-share-stream-main"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold px-6 py-2 rounded-lg shadow-lg transition-all duration-300">
            <GitBranch className="mr-2 h-4 w-4" />
            Deploy to Netlify
          </Button>
        </a>
      </div>
      <Card className="shadow-elegant border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="p-3 bg-primary/10 rounded-full animate-pulse-glow">
              <Share2 className="h-8 w-8 text-primary" />
            </div>
            <Sparkles className="h-6 w-6 text-accent animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Get Your Resource
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Thank you for commenting! Paste your comment link below to receive
            your exclusive resource
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="url"
                className="text-sm font-medium text-foreground"
              >
                LinkedIn Comment Link
              </label>
              <div className="relative">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://www.linkedin.com/feed/update/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-10 pr-4 py-3 text-base border-2 transition-all duration-300 focus:border-primary focus:shadow-glow"
                  disabled={isLoading}
                />
                <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                {url && isValidUrl(url) && (
                  <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary" />
                )}
              </div>
              {url && extractIdFromUrl(url) && (
                <p className="text-sm text-muted-foreground">
                  Detected Post ID:{" "}
                  <span className="font-mono text-primary">
                    {extractIdFromUrl(url)}
                  </span>
                </p>
              )}
            </div>

            {/* Instruction Image */}
            <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
              <p className="text-sm font-medium text-foreground mb-3">
                How to copy your comment link:
              </p>
              <img
                src="/file-uploads/25b4305b-013a-4bc9-b810-b43178dc54de.png"
                alt="How to copy LinkedIn comment link - click the three dots menu on your comment and select 'Copy link to comment'"
                className="w-full max-w-md mx-auto rounded-md border border-border/20"
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Click the three dots (•••) on your comment and select "Copy link
                to comment"
              </p>
            </div>

            <Button
              type="submit"
              disabled={!url.trim() || !isValidUrl(url) || isLoading}
              className="w-full py-3 text-base font-semibold transition-all duration-300 hover:shadow-glow disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  <span className="shimmer">Processing Content...</span>
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-5 w-5" />
                  Get My Resource
                </>
              )}
            </Button>
          </form>

          {isLoading && (
            <div className="space-y-4 animate-slide-in-up">
              <div className="aurora-glow h-4 rounded-full"></div>
              <div className="text-center space-y-2">
                <div className="inline-flex items-center space-x-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="animate-pulse">
                    Preparing your resource...
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This may take a few moments
                </p>
              </div>
            </div>
          )}

          {response && (
            <Alert
              className={`animate-slide-in-up border-2 ${
                response.success
                  ? "border-primary/20 bg-primary/5 text-foreground"
                  : "border-destructive/20 bg-destructive/5 text-foreground"
              }`}
            >
              <div className="flex items-start space-x-2">
                {response.success ? (
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                )}
                <div className="space-y-2 flex-1">
                  <AlertDescription className="text-base font-medium">
                    {response.message}
                  </AlertDescription>
                  {response.data && (
                    <div className="mt-3 p-3 bg-background/50 rounded-md border">
                      <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                        {JSON.stringify(response.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentShareForm;
