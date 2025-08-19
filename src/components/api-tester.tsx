"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Clock,
  History,
  Play,
  Plus,
  Save,
  Settings,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ApiRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  timestamp: Date;
}

interface FormDataEntry {
  id: string;
  key: string;
  value: string;
  type: "text" | "file";
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

type AuthType = "none" | "bearer" | "basic" | "apikey";
type ApiKeyLocation = "header" | "query";
type BodyType = "none" | "raw" | "form-data" | "x-www-form-urlencoded";

export function ApiTester() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [headers, setHeaders] = useState<{ [key: string]: string }>({});
  const [body, setBody] = useState("");

  const [authType, setAuthType] = useState<AuthType>("none");
  const [bearerToken, setBearerToken] = useState("");
  const [basicUsername, setBasicUsername] = useState("");
  const [basicPassword, setBasicPassword] = useState("");
  const [apiKeyKey, setApiKeyKey] = useState("");
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [apiKeyLocation, setApiKeyLocation] =
    useState<ApiKeyLocation>("header");

  const [bodyType, setBodyType] = useState<BodyType>("none");

  useEffect(() => {
    setHeaders((prevHeaders) => {
      const newHeaders = { ...prevHeaders };

      switch (bodyType) {
        case "raw":
          newHeaders["Content-Type"] = "application/json";
          break;
        case "form-data":
          delete newHeaders["Content-Type"]; // Let browser set it with boundary
          break;
        case "x-www-form-urlencoded":
          newHeaders["Content-Type"] = "application/x-www-form-urlencoded";
          break;
        case "none":
        default:
          newHeaders["Content-Type"] = "application/json";
          break;
      }

      return newHeaders;
    });
  }, [bodyType]);

  const [formData, setFormData] = useState<FormDataEntry[]>([
    { id: "1", key: "", value: "", type: "text" },
  ]);
  const [urlEncodedData, setUrlEncodedData] = useState<FormDataEntry[]>([
    { id: "1", key: "", value: "", type: "text" },
  ]);

  const [history, setHistory] = useState<ApiRequest[]>([]);

  const addFormDataEntry = (isUrlEncoded = false) => {
    const newEntry: FormDataEntry = {
      id: Date.now().toString(),
      key: "",
      value: "",
      type: "text",
    };

    if (isUrlEncoded) {
      setUrlEncodedData((prev) => [...prev, newEntry]);
    } else {
      setFormData((prev) => [...prev, newEntry]);
    }
  };

  const removeFormDataEntry = (id: string, isUrlEncoded = false) => {
    if (isUrlEncoded) {
      setUrlEncodedData((prev) => prev.filter((entry) => entry.id !== id));
    } else {
      setFormData((prev) => prev.filter((entry) => entry.id !== id));
    }
  };

  const updateFormDataEntry = (
    id: string,
    field: keyof FormDataEntry,
    value: string,
    isUrlEncoded = false
  ) => {
    const updateFn = (prev: FormDataEntry[]) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      );

    if (isUrlEncoded) {
      setUrlEncodedData(updateFn);
    } else {
      setFormData(updateFn);
    }
  };

  const handleSendRequest = async () => {
    setLoading(true);
    setResponse("");

    try {
      if (!url) {
        setResponse(JSON.stringify({ error: "URL is required" }, null, 2));
        setLoading(false);
        return;
      }

      let parsedUrl: URL;
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
          const newHeaders = { ...headers };

          switch (authType) {
            case "bearer":
              if (bearerToken) {
                newHeaders.Authorization = `Bearer ${bearerToken}`;
              }
              break;
            case "basic":
              if (basicUsername && basicPassword) {
                const credentials = btoa(`${basicUsername}:${basicPassword}`);
                newHeaders.Authorization = `Basic ${credentials}`;
              }
              break;
            case "apikey":
              if (apiKeyKey && apiKeyValue && apiKeyLocation === "header") {
                newHeaders[apiKeyKey] = apiKeyValue;
              }
              break;
          }

          return newHeaders;
        })(),
      };

      if (method !== "GET" && method !== "HEAD") {
        switch (bodyType) {
          case "raw":
            if (body) {
              requestOptions.body = body;
            }
            break;
          case "form-data":
            const formDataBody = new FormData();
            formData.forEach((entry) => {
              if (entry.key && entry.value) {
                formDataBody.append(entry.key, entry.value);
              }
            });
            requestOptions.body = formDataBody;

            break;
          case "x-www-form-urlencoded":
            const urlEncodedBody = new URLSearchParams();
            urlEncodedData.forEach((entry) => {
              if (entry.key && entry.value) {
                urlEncodedBody.append(entry.key, entry.value);
              }
            });
            requestOptions.body = urlEncodedBody.toString();

            break;
        }
      }

      let finalUrl = url;
      if (
        authType === "apikey" &&
        apiKeyLocation === "query" &&
        apiKeyKey &&
        apiKeyValue
      ) {
        const urlObj = new URL(url);
        urlObj.searchParams.set(apiKeyKey, apiKeyValue);
        finalUrl = urlObj.toString();
      }

      // Decide whether to use proxy or not
      const hostname = parsedUrl.hostname.toLowerCase();

      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        /^192\.168\./.test(hostname) || // LAN IP
        /^10\./.test(hostname)
      ) {
        // Use proxy for local targets
        finalUrl = `http://localhost:5001${parsedUrl.pathname}${parsedUrl.search}`;
        requestOptions.headers = {
          ...requestOptions.headers,
          "X-Target-Url": url,
        };
      }

      console.log(`Sending request to: ${finalUrl}`, {
        headers: requestOptions.headers,
        method,
        body: requestOptions.body,
      });

      const res = await fetch(finalUrl, requestOptions);

      let rawData: string;
      try {
        rawData = await res.text();
      } catch {
        rawData = "";
      }

      let data: unknown;
      try {
        data = JSON.parse(rawData);
      } catch {
        data = rawData;
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
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4">
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
            <h2 className="font-medium">Request Area</h2>
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
                  <TabsList className="grid w-full grid-cols-4 mx-6 mt-4">
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="auth">Auth</TabsTrigger>
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="params">Params</TabsTrigger>
                  </TabsList>
                  <div className="flex-1 p-6 overflow-auto">
                    <TabsContent value="headers" className="h-full mt-0">
                      <Textarea
                        placeholder="Enter headers as JSON"
                        value={JSON.stringify(headers, null, 2)}
                        onChange={(e) => {
                          try {
                            setHeaders(JSON.parse(e.target.value));
                          } catch {
                            // Handle invalid JSON
                          }
                        }}
                        className="h-full resize-none font-mono text-sm"
                      />
                    </TabsContent>

                    <TabsContent value="auth" className="mt-0 space-y-4">
                      <div>
                        <Label htmlFor="auth-type">Authorization Type</Label>
                        <Select
                          value={authType}
                          onValueChange={(value) =>
                            setAuthType(value as AuthType)
                          }
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Auth</SelectItem>
                            <SelectItem value="bearer">Bearer Token</SelectItem>
                            <SelectItem value="basic">Basic Auth</SelectItem>
                            <SelectItem value="apikey">API Key</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {authType === "bearer" && (
                        <div>
                          <Label htmlFor="bearer-token">Bearer Token</Label>
                          <Input
                            id="bearer-token"
                            placeholder="Enter bearer token"
                            value={bearerToken}
                            onChange={(e) => setBearerToken(e.target.value)}
                            type="password"
                            className="mt-1"
                          />
                        </div>
                      )}

                      {authType === "basic" && (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="basic-username">Username</Label>
                            <Input
                              id="basic-username"
                              placeholder="Enter username"
                              value={basicUsername}
                              onChange={(e) => setBasicUsername(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="basic-password">Password</Label>
                            <Input
                              id="basic-password"
                              placeholder="Enter password"
                              value={basicPassword}
                              onChange={(e) => setBasicPassword(e.target.value)}
                              type="password"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}

                      {authType === "apikey" && (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="apikey-location">Add to</Label>
                            <Select
                              value={apiKeyLocation}
                              onValueChange={(value) =>
                                setApiKeyLocation(value as ApiKeyLocation)
                              }
                            >
                              <SelectTrigger className="w-full mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="header">Header</SelectItem>
                                <SelectItem value="query">
                                  Query Params
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="apikey-key">Key</Label>
                            <Input
                              id="apikey-key"
                              placeholder="Enter key name"
                              value={apiKeyKey}
                              onChange={(e) => setApiKeyKey(e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="apikey-value">Value</Label>
                            <Input
                              id="apikey-value"
                              placeholder="Enter API key"
                              value={apiKeyValue}
                              onChange={(e) => setApiKeyValue(e.target.value)}
                              type="password"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="body" className="mt-0 space-y-4">
                      <div>
                        <Label htmlFor="body-type">Body Type</Label>
                        <Select
                          value={bodyType}
                          onValueChange={(value) =>
                            setBodyType(value as BodyType)
                          }
                        >
                          <SelectTrigger className="w-full mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="raw">Raw (JSON/Text)</SelectItem>
                            <SelectItem value="form-data">Form Data</SelectItem>
                            <SelectItem value="x-www-form-urlencoded">
                              x-www-form-urlencoded
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {bodyType === "raw" && (
                        <Textarea
                          placeholder="Enter request body (JSON, text, etc.)"
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          className="h-64 resize-none font-mono text-sm"
                        />
                      )}

                      {bodyType === "form-data" && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label>Form Data</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addFormDataEntry(false)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                          <div className="space-y-2 max-h-64 overflow-auto">
                            {formData.map((entry) => (
                              <div
                                key={entry.id}
                                className="flex gap-2 items-center"
                              >
                                <Input
                                  placeholder="Key"
                                  value={entry.key}
                                  onChange={(e) =>
                                    updateFormDataEntry(
                                      entry.id,
                                      "key",
                                      e.target.value,
                                      false
                                    )
                                  }
                                  className="flex-1"
                                />
                                <Input
                                  placeholder="Value"
                                  value={entry.value}
                                  onChange={(e) =>
                                    updateFormDataEntry(
                                      entry.id,
                                      "value",
                                      e.target.value,
                                      false
                                    )
                                  }
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeFormDataEntry(entry.id, false)
                                  }
                                  disabled={formData.length === 1}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {bodyType === "x-www-form-urlencoded" && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label>URL Encoded Data</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addFormDataEntry(true)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                          <div className="space-y-2 max-h-64 overflow-auto">
                            {urlEncodedData.map((entry) => (
                              <div
                                key={entry.id}
                                className="flex gap-2 items-center"
                              >
                                <Input
                                  placeholder="Key"
                                  value={entry.key}
                                  onChange={(e) =>
                                    updateFormDataEntry(
                                      entry.id,
                                      "key",
                                      e.target.value,
                                      true
                                    )
                                  }
                                  className="flex-1"
                                />
                                <Input
                                  placeholder="Value"
                                  value={entry.value}
                                  onChange={(e) =>
                                    updateFormDataEntry(
                                      entry.id,
                                      "value",
                                      e.target.value,
                                      true
                                    )
                                  }
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeFormDataEntry(entry.id, true)
                                  }
                                  disabled={urlEncodedData.length === 1}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
