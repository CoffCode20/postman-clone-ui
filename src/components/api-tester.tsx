"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronRight,
  Clock,
  Folder,
  History,
  Play,
  Plus,
  Save,
  Settings,
} from "lucide-react";
import { useState } from "react";

interface ApiRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  timestamp: Date;
}

const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
];

const METHOD_COLORS = {
  GET: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  POST: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  PUT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  PATCH:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  HEAD: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  OPTIONS:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

export function ApiTester() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [headers, setHeaders] = useState(
    '{\n  "Content-Type": "application/json",\n  "Accept": "application/json"\n}'
  );
  const [body, setBody] = useState("");
  const [history, setHistory] = useState<ApiRequest[]>([]);

  const handleSendRequest = async () => {
    setLoading(true);
    setResponse("");

    try {
      // Validate URL
      if (!url) {
        setResponse(JSON.stringify({ error: "URL is required" }, null, 2));
        setLoading(false);
        return;
      }

      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch {
        setResponse(JSON.stringify({ error: "Invalid URL format" }, null, 2));
        setLoading(false);
        return;
      }

      const requestOptions: RequestInit = {
        method,
        headers: (() => {
          try {
            return headers ? JSON.parse(headers) : {};
          } catch {
            setResponse(
              JSON.stringify({ error: "Invalid headers JSON" }, null, 2)
            );
            setLoading(false);
            throw new Error("Invalid headers");
          }
        })(),
      };

      if (method !== "GET" && method !== "HEAD" && body) {
        requestOptions.body = body;
      }

      // Route through proxy server
      const proxyUrl = `http://localhost:5001${parsedUrl.pathname}${parsedUrl.search}`;
      requestOptions.headers = {
        ...requestOptions.headers,
        "X-Target-Url": url, // e.g., localhost:8080
      };

      console.log(`Sending request to proxy: ${proxyUrl}`, {
        headers: requestOptions.headers,
        method,
        body: requestOptions.body,
      });

      const res = await fetch(proxyUrl, requestOptions);

      let rawData: string;
      try {
        rawData = await res.text(); // read only once
      } catch {
        rawData = "";
      }

      let data: unknown;
      try {
        data = JSON.parse(rawData); // try parse as JSON
      } catch {
        data = rawData; // fallback to string
      }

      setResponse(
        JSON.stringify(
          {
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries(res.headers.entries()),
            body: data,
          },
          null,
          2
        )
      );

      // Add to history
      const newRequest: ApiRequest = {
        id: Date.now().toString(),
        name: `${method} ${parsedUrl.pathname}`,
        method,
        url,
        timestamp: new Date(),
      };
      setHistory((prev) => [newRequest, ...prev.slice(0, 9)]);
    } catch (error) {
      setResponse(
        JSON.stringify(
          { error: error instanceof Error ? error.message : "Unknown error" },
          null,
          2
        )
      );
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 bg-sidebar border-r border-sidebar-border flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <Play className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            <h1 className="font-semibold text-sidebar-foreground">
              API Tester
            </h1>
          </div>
          <Button className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Folder className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-sidebar-foreground">
                  Collections
                </span>
              </div>
              <div className="space-y-1 mb-6">
                <div className="flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent cursor-pointer">
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <Folder className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-sidebar-foreground">
                    My Workspace
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-sidebar-foreground">
                  History
                </span>
              </div>
              <div className="space-y-1">
                {history.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent cursor-pointer group"
                    onClick={() => {
                      setMethod(request.method);
                      setUrl(request.url);
                    }}
                  >
                    <Badge
                      variant="secondary"
                      className={`text-xs px-1.5 py-0.5 ${
                        METHOD_COLORS[
                          request.method as keyof typeof METHOD_COLORS
                        ]
                      }`}
                    >
                      {request.method}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-sidebar-foreground truncate">
                        {request.name}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {request.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="font-medium">Untitled Request</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Save className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b border-border">
              <div className="flex gap-2">
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HTTP_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        <Badge
                          variant="secondary"
                          className={`text-xs mr-2 ${
                            METHOD_COLORS[m as keyof typeof METHOD_COLORS]
                          }`}
                        >
                          {m}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Enter request url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendRequest}
                  disabled={loading}
                  className="px-6"
                >
                  {loading ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
            <div className="flex-1 flex">
              <div className="w-1/2 border-r border-border">
                <Tabs defaultValue="headers" className="h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="params">Params</TabsTrigger>
                  </TabsList>
                  <div className="flex-1 p-6">
                    <TabsContent value="headers" className="h-full mt-0">
                      <Textarea
                        placeholder="Enter headers as JSON"
                        value={headers}
                        onChange={(e) => setHeaders(e.target.value)}
                        className="h-full resize-none font-mono text-sm"
                      />
                    </TabsContent>
                    <TabsContent value="body" className="h-full mt-0">
                      <Textarea
                        placeholder="Enter request body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="h-full resize-none font-mono text-sm"
                      />
                    </TabsContent>
                    <TabsContent value="params" className="h-full mt-0">
                      <div className="text-sm text-muted-foreground">
                        Query parameters will be parsed from the URL
                        automatically.
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
              <div className="w-1/2">
                <div className="p-6 border-b border-border">
                  <h3 className="font-medium">Response</h3>
                </div>
                <div className="p-6 h-full">
                  <ScrollArea className="h-full">
                    <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                      {response || 'Click "Send" to see the response here...'}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
