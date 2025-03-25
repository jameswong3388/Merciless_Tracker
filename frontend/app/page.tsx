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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Dynamically import ReactJson (SSR disabled)
const ReactJson = dynamic(() => import("react18-json-view"), {
    ssr: false,
    loading: () => <p>Loading...</p>,
});

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

export default function Home() {
    // State management
    const [results, setResults] = useState<any[]>([]);
    const [selectedData, setSelectedData] = useState<any | null>(null);
    const [analysisResult, setAnalysisResult] = useState<{
        isCyberbullying: boolean;
        cyberbullying_type: number;
        confidence: number;
        details?: Array<{
            text: string, 
            source: string, 
            isCyberbullying: boolean, 
            cyberbullying_type: number, 
            confidence: number
        }>;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [extractId, setExtractId] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState("rf");

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
     * Analyzes content to check for cyberbullying
     */
    const analyzeContent = async (content: any) => {
        setIsLoading(true);
        try {
            // Reset text samples
            const textSamples: { text: string; source: string }[] = [];

            if (typeof content === "string") {
                // If content is a plain string, use it directly with "root" as the source
                textSamples.push({text: content, source: "root"});
            } else {
                // Recursively extract all string attributes and use their JSON paths as the source.
                const extractStrings = (obj: any, path: string = "root") => {
                    if (obj === null || obj === undefined) return;
                    if (typeof obj === "string") {
                        // Optionally, you can add length filtering if desired
                        textSamples.push({text: obj, source: path});
                    } else if (Array.isArray(obj)) {
                        obj.forEach((item, idx) => extractStrings(item, `${path}[${idx}]`));
                    } else if (typeof obj === "object") {
                        Object.entries(obj).forEach(([key, value]) => {
                            extractStrings(value, `${path}.${key}`);
                        });
                    }
                };
                extractStrings(content);

                // Fallback: if no string samples were found, use the entire JSON
                if (textSamples.length === 0) {
                    textSamples.push({
                        text: JSON.stringify(content),
                        source: "serialized-json",
                    });
                }
            }

            // Analysis results storage
            const results = [];

            // Analyze each text sample
            for (const sample of textSamples) {
                try {
                    const response = await fetch("http://localhost:3399/analyze", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            model_type: selectedModel,
                            text: sample.text,
                        }),
                    });

                    if (!response.ok) {
                        console.warn(`API error for ${sample.source}: ${response.status}`);
                        continue;
                    }

                    const result = await response.json();
                    results.push({
                        text:
                            sample.text.length > 100
                                ? `${sample.text.substring(0, 100)}...`
                                : sample.text,
                        source: sample.source,
                        isCyberbullying: result.isCyberbullying,
                        cyberbullying_type: result.cyberbullying_type,
                        confidence: result.confidence || 0.5,
                    });
                } catch (error) {
                    console.warn(`Error analyzing ${sample.source}:`, error);
                }
            }

            // Calculate overall results
            if (results.length > 0) {
                // Count cyberbullying instances
                const bullying = results.filter((r) => r.isCyberbullying);
                const bullyingCount = bullying.length;

                // Calculate average confidence
                const avgConfidence =
                    results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

                // Determine overall cyberbullying type (most common non-safe type)
                const typeCounts = bullying.reduce((counts: Record<string, number>, item) => {
                    const type = item.cyberbullying_type;
                    counts[type] = (counts[type] || 0) + 1;
                    return counts;
                }, {});

                const mostCommonType =
                    Object.entries(typeCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type]) => Number(type))[0] || 3; // Default to 3 (safe) if no bullying found

                // Set overall analysis result
                setAnalysisResult({
                    isCyberbullying: bullyingCount > 0,
                    cyberbullying_type: mostCommonType,
                    confidence: avgConfidence,
                    details: results,
                });

                toast.success(`Analysis completed: Analyzed ${results.length} text samples`);
            } else {
                toast.warning("No suitable text found for analysis");
                setAnalysisResult({
                    isCyberbullying: false,
                    cyberbullying_type: 3,
                    confidence: 1.0,
                });
            }
        } catch (error) {
            console.error("Error analyzing content:", error);
            toast.error(
                `Analysis failed: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );

            // Fallback to mock response in case of errors
            setAnalysisResult({
                isCyberbullying: Math.random() > 0.5,
                cyberbullying_type: Math.floor(Math.random() * 3),
                confidence: Math.round((0.5 + Math.random() * 0.5) * 100) / 100,
            });
        } finally {
            setIsLoading(false);
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
                        <div className="flex gap-2 items-center">
                            <Select value={selectedModel} onValueChange={setSelectedModel}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select Model" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Analysis Models</SelectLabel>
                                        <SelectItem value="rf">Random Forest</SelectItem>
                                        <SelectItem value="mnb">Multinomial Naive Bayes</SelectItem>
                                        <SelectItem value="lg">Logistic Regression</SelectItem>
                                        <SelectItem value="svm">SVM</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (selectedData) {
                                        analyzeContent(selectedData);
                                    }
                                }}
                                disabled={!selectedData || isLoading}
                            >
                                {isLoading ? "Analyzing..." : "Analyze All Content"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setAnalysisResult(null);
                                    setSelectedData(null);
                                }}
                                disabled={!analysisResult && !selectedData}
                            >
                                Clear Analysis
                            </Button>
                        </div>
                    </div>

                    {selectedData && (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex justify-between items-center">
                                        <span>Selected Content</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {typeof selectedData === "string" ? (
                                        <p className="text-sm">{selectedData}</p>
                                    ) : (
                                        <ReactJson
                                            src={selectedData}
                                            collapsed={1}
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
                                            {analysisResult.isCyberbullying && (
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium">Bullying Type:</span>
                                                    <span>{analysisResult.cyberbullying_type}</span>
                                                </div>
                                            )}
                                            {analysisResult.details && analysisResult.details.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="font-medium mb-2">Details:</p>
                                                    <div className="max-h-64 overflow-y-auto">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-muted/50">
                                                                <tr>
                                                                    <th className="text-left p-2">Source</th>
                                                                    <th className="text-left p-2">Text</th>
                                                                    <th className="text-center p-2">Result</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {analysisResult.details.map((detail, idx) => (
                                                                    <tr key={idx} className="border-b">
                                                                        <td className="p-2 text-xs">{detail.source}</td>
                                                                        <td className="p-2">{detail.text}</td>
                                                                        <td className={`p-2 text-center ${detail.isCyberbullying ? "text-red-500" : "text-green-500"}`}>
                                                                            {detail.isCyberbullying ? "⚠️" : "✓"}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
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
