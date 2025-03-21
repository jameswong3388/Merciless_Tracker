"use client";

import {useState} from "react";
import {useForm} from "react-hook-form";
import dynamic from "next/dynamic";
import {toast, Toaster} from "sonner";
import {Layers} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel,} from "@/components/ui/form";
import {Switch} from "@/components/ui/switch";
import {Textarea} from "@/components/ui/textarea";

// Dynamically import ReactJson (SSR disabled)
const ReactJson = dynamic(() => import("react18-json-view"), {
    ssr: false,
    loading: () => <p>Loading...</p>,
});

// Type definitions
type NodeMeta = {
    name?: string | number;
    type: string;
    parentPath?: (string | number)[];
};

type FormValues = {
    urls: string[];
    prompt: string;
    schema: string;
    enableWebSearch: boolean;
    ignoreSitemap: boolean;
    includeSubdomains: boolean;
};

type ExtractResult = {
    success: boolean;
    extractId: string;
    data?: any;
    llmUsage?: number;
    totalUrlsScraped?: number;
    sources?: any;
};

type SelectedPath = {
    path: (string | number)[];
    value: any;
};

export default function Home() {
    // State management
    const [results, setResults] = useState<any[]>([]);
    const [selectedData, setSelectedData] = useState<any | null>(null);
    const [selectedAttribute, setSelectedAttribute] = useState<SelectedPath | null>(null);
    const [analysisResult, setAnalysisResult] = useState<{
        isCyberbullying: boolean;
        confidence: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [extractId, setExtractId] = useState<string | null>(null);

    // React Hook Form setup
    const form = useForm<FormValues>({
        defaultValues: {
            urls: ["https://cyber-bully-demo-website.vercel.app"],
            prompt:
                "Extract the comments of a tweet post, including the username, comment text, and timestamp. Ensure that both username and comment text are captured for each comment.",
            schema: JSON.stringify(
                {
                    type: "object",
                    properties: {
                        comments: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    username: {type: "string"},
                                    comment_text: {type: "string"},
                                    timestamp: {type: "string"},
                                },
                                required: ["username", "comment_text"],
                            },
                        },
                    },
                    required: ["comments"],
                },
                null,
                2
            ),
            enableWebSearch: false,
            ignoreSitemap: false,
            includeSubdomains: true,
        },
    });

    /**
     * Helper function to poll for extraction results
     */
    const pollForResults = async (id: string) => {
        try {
            const pollPromise = fetch(`http://localhost:3002/v1/extract/${id}`).then(async (res) => {
                if (!res.ok) {
                    throw new Error(`API error: ${res.status}`);
                }

                const responseData = await res.json();

                // Check the status from the response
                if (responseData.status === "completed") {
                    const resultData = responseData.data || responseData.result || {};
                    setResults([resultData, ...results]);
                    return {message: "Extraction completed successfully!"};
                } else if (responseData.status === "processing") {
                    setTimeout(() => pollForResults(id), 5000);
                    setResults([{status: "processing", id}, ...results]);
                    return {message: "Still processing, will check again soon..."};
                } else if (responseData.status === "failed") {
                    throw new Error(responseData.error || "Unknown error");
                }

                throw new Error("Unknown status");
            });

            toast.promise(pollPromise, {
                loading: "Checking extraction status...",
                success: (data) => data.message,
                error: (err) => `Extraction failed: ${err.message}`,
            });

            await pollPromise;
        } catch (error) {
            console.error("Error polling for results:", error);
            setResults((prev) => [
                {status: "error", error: error instanceof Error ? error.message : String(error)},
                ...prev,
            ]);
        }
    };

    /**
     * Form submission handler: starts the extraction process
     */
    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            // Remove empty URL fields
            const filteredUrls = values.urls.filter((url) => url.trim() !== "");
            if (filteredUrls.length === 0) {
                toast.error("Please enter at least one URL");
                throw new Error("Please enter at least one URL");
            }

            let parsedSchema;
            if (values.schema.trim()) {
                try {
                    parsedSchema = JSON.parse(values.schema);
                } catch {
                    toast.error("Invalid JSON schema");
                    throw new Error("Invalid JSON schema");
                }
            }

            const extractPromise = fetch("http://localhost:3002/v1/extract", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    urls: filteredUrls,
                    prompt: values.prompt || undefined,
                    schema: parsedSchema,
                    enableWebSearch: values.enableWebSearch,
                    ignoreSitemap: values.ignoreSitemap,
                    includeSubdomains: values.includeSubdomains,
                }),
            }).then(async (response) => {
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                const data: ExtractResult = await response.json();

                if (!data.success) {
                    throw new Error("Extract request failed");
                }

                setExtractId(data.extractId);

                // If data is immediately available, set results. Otherwise, poll.
                if (data.data) {
                    setResults([data.data, ...results]);
                } else {
                    pollForResults(data.extractId);
                }

                return data;
            });

            toast.promise(extractPromise, {
                loading: "Starting extraction...",
                success: (data) => `Extract completed with ID: ${data.extractId}`,
                error: (err) => err.message || "An error occurred during extraction",
            });

            await extractPromise;
        } catch (error) {
            console.error("Error starting extract:", error);
            setResults((prev) => [
                `Error: ${error instanceof Error ? error.message : String(error)}`,
                ...prev,
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Analyzes content to check for (mocked) cyberbullying
     */
    const analyzeContent = (content: any) => {
        // Convert to string if content is not a string
        const textToAnalyze = typeof content === "string" ? content : JSON.stringify(content);

        // Mock logic: random chance to detect "cyberbullying" if 'bad' is present or random
        const isCyberbullying = textToAnalyze.toLowerCase().includes("bad") || Math.random() > 0.7;
        const confidence = Math.round((0.5 + Math.random() * 0.5) * 100) / 100;

        setAnalysisResult({isCyberbullying, confidence});
    };

    /**
     * Selects an attribute from the JSON tree
     */
    const handleAttributeSelect = (indexOrName: string | number, value: any, nodeMeta: NodeMeta) => {
        if (nodeMeta?.parentPath) {
            const path = [...nodeMeta.parentPath, indexOrName];
            setSelectedAttribute({path, value});
            toast.success(`Selected: ${path.join(".")}`);
        }
    };

    /**
     * Utility function to add a new empty URL field
     */
    const addUrlField = () => {
        const currentUrls = form.getValues().urls;
        form.setValue("urls", [...currentUrls, ""]);
    };

    /**
     * Utility function to remove a URL field
     */
    const removeUrlField = (index: number) => {
        const currentUrls = form.getValues().urls;
        if (currentUrls.length > 1) {
            form.setValue(
                "urls",
                currentUrls.filter((_, i) => i !== index)
            );
        }
    };

    return (
        <div className="flex h-screen">
            <Toaster position="top-right"/>

            {/* Left Panel - Configuration */}
            <div className="w-1/3 border-r p-6 overflow-y-auto bg-card/50">
                <div className="flex items-center gap-2 mb-6">
                    <h2 className="text-2xl font-bold">
                        Merciless Tracker
                        <span className="text-sm font-normal ml-2">(No Mercy X Anti Cyber Bullying)</span>
                    </h2>
                </div>

                <Card className="mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Layers className="h-4 w-4"/>
                            Extract Configuration
                        </CardTitle>
                        <CardDescription>
                            Configure the parameters for extracting data from websites
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                {/* URLs to extract */}
                                <div className="space-y-2">
                                    <FormLabel>URLs to extract</FormLabel>
                                    {form.watch("urls").map((_, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <FormField
                                                control={form.control}
                                                name={`urls.${index}`}
                                                render={({field}) => (
                                                    <FormItem className="flex-1">
                                                        <FormControl>
                                                            <Input placeholder="https://example.com" {...field} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => removeUrlField(index)}
                                                disabled={form.watch("urls").length <= 1}
                                            >
                                                -
                                            </Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" onClick={addUrlField} className="w-full">
                                        Add URL
                                    </Button>
                                </div>

                                {/* Extraction prompt */}
                                <FormField
                                    control={form.control}
                                    name="prompt"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Extraction Prompt</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter a prompt to guide the extraction process"
                                                    {...field}
                                                    className="min-h-[80px]"
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Optional prompt to guide what data should be extracted
                                            </FormDescription>
                                        </FormItem>
                                    )}
                                />

                                {/* JSON Schema */}
                                <FormField
                                    control={form.control}
                                    name="schema"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Schema</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter a JSON schema to structure the extracted data"
                                                    {...field}
                                                    className="min-h-[120px] font-mono text-sm"
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                JSON schema to define the structure of the extracted data
                                            </FormDescription>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="mt-2"
                                                onClick={() => {
                                                    const sampleSchema = {
                                                        type: "object",
                                                        properties: {
                                                            comments: {
                                                                type: "array",
                                                                items: {
                                                                    type: "object",
                                                                    properties: {
                                                                        username: {type: "string"},
                                                                        comment_text: {type: "string"},
                                                                        timestamp: {type: "string"},
                                                                    },
                                                                    required: ["username", "comment_text"],
                                                                },
                                                            },
                                                        },
                                                        required: ["comments"],
                                                    };
                                                    form.setValue("schema", JSON.stringify(sampleSchema, null, 2));
                                                }}
                                            >
                                                Load Sample Schema
                                            </Button>
                                        </FormItem>
                                    )}
                                />

                                {/* Switches */}
                                <div className="space-y-4">
                                    {/* Enable Web Search */}
                                    <FormField
                                        control={form.control}
                                        name="enableWebSearch"
                                        render={({field}) => (
                                            <FormItem
                                                className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Enable Web Search</FormLabel>
                                                    <FormDescription>
                                                        Use web search to find additional data
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange}/>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {/* Ignore Sitemap */}
                                    <FormField
                                        control={form.control}
                                        name="ignoreSitemap"
                                        render={({field}) => (
                                            <FormItem
                                                className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Ignore Sitemap</FormLabel>
                                                    <FormDescription>
                                                        Ignore sitemap.xml during website scanning
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange}/>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {/* Include Subdomains */}
                                    <FormField
                                        control={form.control}
                                        name="includeSubdomains"
                                        render={({field}) => (
                                            <FormItem
                                                className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Include Subdomains</FormLabel>
                                                    <FormDescription>
                                                        Also scan subdomains of the provided URLs
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange}/>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Processing..." : "Start Extraction"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>

            {/* Right Panel - Results and Analysis */}
            <div className="w-2/3 flex flex-col h-full overflow-hidden">
                {/* Extraction Results */}
                <div className="h-1/2 p-6 overflow-y-auto border-b">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Extraction Results</h2>
                        <Button variant="outline" onClick={() => setResults([])}>
                            Clear Results
                        </Button>
                    </div>

                    {results.length > 0 ? (
                        <div className="space-y-4">
                            {results.map((result, index) => (
                                <Card
                                    key={index}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => {
                                        setSelectedData(result);
                                        setSelectedAttribute(null);
                                    }}
                                >
                                    <CardContent className="pt-6">
                                        {typeof result === "string" ? (
                                            <p>{result}</p>
                                        ) : (
                                            <ReactJson
                                                src={result}
                                                collapsed={2}
                                                enableClipboard={false}
                                                customizeNode={(node: any, nodeMeta: any) => {
                                                    // Highlight node if it matches the selected attribute
                                                    if (selectedAttribute && nodeMeta?.parentPath) {
                                                        const metaPath = nodeMeta.parentPath as (string | number)[];
                                                        const isExactMatch =
                                                            metaPath.length + 1 === selectedAttribute.path.length &&
                                                            selectedAttribute.path.every((item, i) =>
                                                                i < metaPath.length ? item === metaPath[i] : true
                                                            ) &&
                                                            selectedAttribute.path[selectedAttribute.path.length - 1] ===
                                                            nodeMeta.name;

                                                        if (isExactMatch) {
                                                            return {
                                                                style: {
                                                                    backgroundColor: "rgba(59, 130, 246, 0.3)",
                                                                    borderRadius: "4px",
                                                                    padding: "2px",
                                                                },
                                                            };
                                                        }
                                                    }
                                                    return {};
                                                }}
                                                onSelect={(key, value, nodeMeta) =>
                                                    handleAttributeSelect(key, value, nodeMeta as NodeMeta)
                                                }
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card className="bg-muted/50">
                            <CardContent
                                className="pt-6 flex flex-col items-center justify-center min-h-[150px] text-center">
                                <p className="text-muted-foreground mb-2">No extraction results yet</p>
                                <p className="text-muted-foreground text-sm">
                                    Enter URLs and click &quot;Start Extraction&quot; to begin
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Cyberbullying Analysis */}
                <div className="h-1/2 p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Cyberbullying Analysis</h2>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (selectedAttribute) {
                                        analyzeContent(selectedAttribute.value);
                                    } else if (selectedData) {
                                        analyzeContent(selectedData);
                                    }
                                }}
                                disabled={!selectedData && !selectedAttribute}
                            >
                                {selectedAttribute ? "Analyze Selected Attribute" : "Analyze All Content"}
                            </Button>
                        </div>
                    </div>

                    {selectedData && (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex justify-between items-center">
                                        <span>Selected Content</span>
                                        {selectedAttribute && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedAttribute(null)}
                                            >
                                                Clear Selected Attribute
                                            </Button>
                                        )}
                                    </CardTitle>
                                    {selectedAttribute && (
                                        <CardDescription>
                                            Selected attribute path: {selectedAttribute.path.join(".")}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    {selectedAttribute ? (
                                        typeof selectedAttribute.value === "string" ? (
                                            <p className="text-sm">{selectedAttribute.value}</p>
                                        ) : (
                                            <ReactJson
                                                src={selectedAttribute.value}
                                                collapsed={1}
                                                onSelect={(key, value, nodeMeta) => {
                                                    if (nodeMeta?.parentPath) {
                                                        const path = [...selectedAttribute.path, ...nodeMeta.parentPath, key];
                                                        setSelectedAttribute({path, value});
                                                        toast.success(`Selected: ${path.join(".")}`);
                                                    }
                                                }}
                                            />
                                        )
                                    ) : typeof selectedData === "string" ? (
                                        <p className="text-sm">{selectedData}</p>
                                    ) : (
                                        <ReactJson
                                            src={selectedData}
                                            collapsed={1}
                                            onSelect={(key, value, nodeMeta) =>
                                                handleAttributeSelect(key, value, nodeMeta as NodeMeta)
                                            }
                                        />
                                    )}
                                </CardContent>
                            </Card>

                            {analysisResult && (
                                <Card
                                    className={
                                        analysisResult.isCyberbullying ? "border-red-500" : "border-green-500"
                                    }
                                >
                                    <CardHeader>
                                        <CardTitle>Analysis Result</CardTitle>
                                        {selectedAttribute && (
                                            <CardDescription>
                                                Analysis of: {selectedAttribute.path.join(".")}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-col space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">Classification:</span>
                                                <span
                                                    className={
                                                        analysisResult.isCyberbullying
                                                            ? "text-red-500 font-bold"
                                                            : "text-green-500 font-bold"
                                                    }
                                                >
                          {analysisResult.isCyberbullying
                              ? "Cyberbullying Content"
                              : "Safe Content"}
                        </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">Confidence:</span>
                                                <span>{(analysisResult.confidence * 100).toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
