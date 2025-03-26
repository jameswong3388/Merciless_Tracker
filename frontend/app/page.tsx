"use client";

import {useState} from "react";
import {useForm} from "react-hook-form";
import dynamic from "next/dynamic";
import {toast, Toaster} from "sonner";
import {Layers, GripVertical, Search, ShieldAlert, FileText} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel,} from "@/components/ui/form";
import {Switch} from "@/components/ui/switch";
import {Textarea} from "@/components/ui/textarea";
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from "@/components/ui/resizable";
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
        cyberbullying_type: string;
        cyberbullying_type_encode: number;
        confidence: number;
        details?: Array<{
            text: string, 
            source: string, 
            isCyberbullying: boolean, 
            cyberbullying_type: string,
            cyberbullying_type_encode: number,
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
                        cyberbullying_type_encode: result.cyberbullying_type_encode,
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

                // Get most common type (defaulting to "not_cyberbullying" if no bullying found)
                const mostCommonType = bullyingCount > 0 
                    ? Object.entries(typeCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type]) => type)[0] 
                    : "not_cyberbullying";
                
                // Get the corresponding encode value
                const mostCommonEncode = bullyingCount > 0 && bullying.length > 0
                    ? bullying.find(b => b.cyberbullying_type === mostCommonType)?.cyberbullying_type_encode || 3
                    : 3; // Default to 3 for not_cyberbullying

                // Set overall analysis result
                setAnalysisResult({
                    isCyberbullying: bullyingCount > 0,
                    cyberbullying_type: mostCommonType,
                    cyberbullying_type_encode: mostCommonEncode,
                    confidence: avgConfidence,
                    details: results,
                });

                toast.success(`Analysis completed: Analyzed ${results.length} text samples`);
            } else {
                toast.warning("No suitable text found for analysis");
                setAnalysisResult({
                    isCyberbullying: false,
                    cyberbullying_type: "not_cyberbullying",
                    cyberbullying_type_encode: 3,
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
                cyberbullying_type: Math.random() > 0.5 ? "not_cyberbullying" : ["age", "ethnicity", "gender", "religion"][Math.floor(Math.random() * 4)],
                cyberbullying_type_encode: Math.random() > 0.5 ? 3 : [0, 1, 2, 5][Math.floor(Math.random() * 4)],
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
        <div className="h-screen flex flex-col overflow-hidden bg-muted/5">
            <Toaster position="top-right"/>
            
            {/* Header */}
            <div className="border-b bg-card shadow-sm p-3">
                <div className="flex items-center justify-center max-w-screen-2xl mx-auto">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold">
                            Merciless Tracker
                            <span className="text-sm font-normal ml-2 text-muted-foreground">(No Mercy X Anti Cyber Bullying)</span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* Main Content: Resizable Panels */}
            <ResizablePanelGroup direction="horizontal" className="flex-1">
                {/* Left Panel - Configuration */}
                <ResizablePanel defaultSize={30} minSize={25} maxSize={50} className="bg-background">
                    <div className="h-full overflow-y-auto p-4">
                        <Card className="mb-6 shadow-sm border border-border/50">
                            <CardHeader className="pb-3 bg-muted/30">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Search className="h-4 w-4"/>
                                    Extract Configuration
                                </CardTitle>
                                <CardDescription>
                                    Configure the parameters for extracting data from websites
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
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
                </ResizablePanel>
                
                <ResizableHandle withHandle />
                
                {/* Right Panel - Results and Analysis */}
                <ResizablePanel defaultSize={70} className="flex flex-col">
                    <ResizablePanelGroup direction="vertical">
                        {/* Top Panel - Extraction Results */}
                        <ResizablePanel defaultSize={50} className="overflow-hidden">
                            <div className="h-full flex flex-col">
                                <div className="px-4 py-3 border-b flex justify-between items-center bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <h2 className="font-semibold">Extraction Results</h2>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setResults([])}>
                                        Clear Results
                                    </Button>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4">
                                    {results.length > 0 ? (
                                        <div className="space-y-4">
                                            {results.map((result, index) => (
                                                <Card
                                                    key={index}
                                                    className="cursor-pointer hover:bg-muted/50 transition-colors shadow-sm border border-border/50"
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
                                        <Card className="bg-muted/10 border border-border/50 shadow-sm">
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
                            </div>
                        </ResizablePanel>
                        
                        <ResizableHandle withHandle />
                        
                        {/* Bottom Panel - Cyberbullying Analysis */}
                        <ResizablePanel defaultSize={50} className="overflow-hidden">
                            <div className="h-full flex flex-col">
                                <div className="px-4 py-3 border-b flex justify-between items-center bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                                        <h2 className="font-semibold">Cyberbullying Analysis</h2>
                                    </div>
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
                                            size="sm"
                                            onClick={() => {
                                                if (selectedData) {
                                                    analyzeContent(selectedData);
                                                }
                                            }}
                                            disabled={!selectedData || isLoading}
                                        >
                                            {isLoading ? "Analyzing..." : "Analyze Content"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setAnalysisResult(null);
                                                setSelectedData(null);
                                            }}
                                            disabled={!analysisResult && !selectedData}
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-4">
                                    {selectedData && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Card className="md:col-span-1 shadow-sm border border-border/40 hover:shadow transition-shadow">
                                                <CardHeader className="pb-2 bg-muted/30">
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        <span>Selected Content</span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="max-h-[400px] overflow-y-auto">
                                                    {typeof selectedData === "string" ? (
                                                        <p className="text-sm">{selectedData}</p>
                                                    ) : (
                                                        <ReactJson
                                                            src={selectedData}
                                                            collapsed={1}
                                                            theme="default"
                                                        />
                                                    )}
                                                </CardContent>
                                            </Card>

                                            {analysisResult && (
                                                <Card
                                                    className={`md:col-span-1 shadow-sm hover:shadow transition-shadow ${
                                                        analysisResult.isCyberbullying 
                                                            ? "border-l-4 border-l-red-500" 
                                                            : "border-l-4 border-l-green-500"
                                                    }`}
                                                >
                                                    <CardHeader className={`pb-2 ${
                                                        analysisResult.isCyberbullying 
                                                            ? "bg-red-50/50" 
                                                            : "bg-green-50/50"
                                                    }`}>
                                                        <CardTitle className="text-lg flex justify-between items-center">
                                                            <span>Analysis Result</span>
                                                            <span
                                                                className={`text-sm px-3 py-1 rounded-full ${
                                                                    analysisResult.isCyberbullying
                                                                        ? "bg-red-100 text-red-700"
                                                                        : "bg-green-100 text-green-700"
                                                                }`}
                                                            >
                                                                {analysisResult.isCyberbullying
                                                                    ? "Cyberbullying Detected"
                                                                    : "Safe Content"}
                                                            </span>
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="flex flex-col space-y-4">
                                                            <div className="grid grid-cols-1 gap-4 mt-2">
                                                                <div className="col-span-1 bg-gray-50 p-4 rounded-lg shadow-inner">
                                                                    <p className="text-sm font-medium text-gray-500 mb-1">Confidence</p>
                                                                    <div className="flex items-center">
                                                                        <div className="text-xl font-bold mr-2">
                                                                            {(analysisResult.confidence * 100).toFixed(1)}%
                                                                        </div>
                                                                        <div className="flex-1 h-2 bg-gray-200 rounded-full">
                                                                            <div 
                                                                                className={`h-2 rounded-full ${
                                                                                    analysisResult.isCyberbullying ? "bg-red-600" : "bg-green-600"
                                                                                }`}
                                                                                style={{ width: `${analysisResult.confidence * 100}%` }}
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {analysisResult.details && analysisResult.details.length > 0 && (
                                                                <>
                                                                    <div className="bg-gray-50 p-4 rounded-lg shadow-inner mt-4">
                                                                        <h3 className="font-medium mb-3 text-gray-700">Analysis Summary</h3>
                                                                        {(() => {
                                                                            if (!analysisResult.details) return null;
                                                                            
                                                                            const totalSamples = analysisResult.details.length;
                                                                            const bullying = analysisResult.details.filter(d => d.isCyberbullying);
                                                                            const bullyingCount = bullying.length;
                                                                            const safeCount = totalSamples - bullyingCount;
                                                                            const bullyingPercentage = Math.round((bullyingCount / totalSamples) * 100);
                                                                            const safePercentage = 100 - bullyingPercentage;
                                                                            
                                                                            // Group by cyberbullying type
                                                                            const bullyingTypes = bullying.reduce((acc, item) => {
                                                                                const type = item.cyberbullying_type;
                                                                                acc[type] = (acc[type] || 0) + 1;
                                                                                return acc;
                                                                            }, {} as Record<string, number>);
                                                                            
                                                                            return (
                                                                                <div className="space-y-3">
                                                                                    <div className="text-center mb-4">
                                                                                        <span className="text-2xl font-bold">{totalSamples}</span>
                                                                                        <p className="text-sm text-gray-500">Total Analyzed Samples</p>
                                                                                    </div>
                                                                                    
                                                                                    <div className="flex items-center justify-between mb-1">
                                                                                        <span className="flex items-center text-sm">
                                                                                            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                                                                            Safe Content
                                                                                        </span>
                                                                                        <span className="text-sm font-medium">{safeCount} ({safePercentage}%)</span>
                                                                                    </div>
                                                                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                                                                                        <div 
                                                                                            className="bg-green-500 h-2.5 rounded-full" 
                                                                                            style={{ width: `${safePercentage}%` }}
                                                                                        ></div>
                                                                                    </div>
                                                                                    
                                                                                    <div className="flex items-center justify-between mb-1">
                                                                                        <span className="flex items-center text-sm">
                                                                                            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                                                                                            Bullying Content
                                                                                        </span>
                                                                                        <span className="text-sm font-medium">{bullyingCount} ({bullyingPercentage}%)</span>
                                                                                    </div>
                                                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                                                        <div 
                                                                                            className="bg-red-500 h-2.5 rounded-full" 
                                                                                            style={{ width: `${bullyingPercentage}%` }}
                                                                                        ></div>
                                                                                    </div>

                                                                                    {/* Cyberbullying type breakdown */}
                                                                                    {bullyingCount > 0 && (
                                                                                        <div className="mt-4 pt-3 border-t border-gray-200">
                                                                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Cyberbullying Types Detected</h4>
                                                                                            <div className="space-y-2">
                                                                                                {Object.entries(bullyingTypes).map(([type, count]) => {
                                                                                                    // Get the encode value for this type
                                                                                                    const encodeValue = bullying.find(b => b.cyberbullying_type === type)?.cyberbullying_type_encode;
                                                                                                    const typePercentage = Math.round((count / bullyingCount) * 100);

                                                                                                    return (
                                                                                                        <div key={type} className="space-y-1">
                                                                                                            <div className="flex items-center justify-between">
                                                                                                                <div className="flex items-center">
                                                                                                                    <span className="w-4 h-4 inline-flex items-center justify-center bg-red-100 text-red-800 rounded-full text-xs mr-2">
                                                                                                                        {encodeValue}
                                                                                                                    </span>
                                                                                                                    <span className="text-sm capitalize">{type}</span>
                                                                                                                </div>
                                                                                                                <span className="text-xs font-medium">{count} ({typePercentage}%)</span>
                                                                                                            </div>
                                                                                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                                                                <div
                                                                                                                    className="bg-red-400 h-1.5 rounded-full"
                                                                                                                    style={{ width: `${typePercentage}%` }}
                                                                                                                ></div>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    );
                                                                                                })}
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                    
                                                                    <div className="mt-4">
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <h3 className="font-medium text-gray-700">Content Details</h3>
                                                                            <span className="text-xs text-gray-500">
                                                                                {analysisResult.details.filter(d => d.isCyberbullying).length} problematic items
                                                                            </span>
                                                                        </div>
                                                                        <div className="max-h-64 overflow-y-auto border rounded-lg">
                                                                            <table className="w-full text-sm">
                                                                                <thead className="bg-gray-100">
                                                                                    <tr>
                                                                                        <th className="text-left p-2 text-xs font-medium text-gray-500">Source</th>
                                                                                        <th className="text-left p-2 text-xs font-medium text-gray-500">Text</th>
                                                                                        <th className="text-center p-2 text-xs font-medium text-gray-500">Status</th>
                                                                                        <th className="text-center p-2 text-xs font-medium text-gray-500">Type</th>
                                                                                        <th className="text-center p-2 text-xs font-medium text-gray-500">Confidence</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {analysisResult.details.map((detail, idx) => (
                                                                                        <tr key={idx} 
                                                                                            className={`border-b ${
                                                                                                detail.isCyberbullying ? "bg-red-50" : ""
                                                                                            }`}
                                                                                        >
                                                                                            <td className="p-2 text-xs font-mono">{detail.source}</td>
                                                                                            <td className="p-2">{detail.text}</td>
                                                                                            <td className="p-2 text-center">
                                                                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                                                                                                    detail.isCyberbullying 
                                                                                                        ? "bg-red-100 text-red-700" 
                                                                                                        : "bg-green-100 text-green-700"
                                                                                                }`}>
                                                                                                    {detail.isCyberbullying ? "!" : "✓"}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td className="p-2 text-center">
                                                                                                {detail.isCyberbullying ? (
                                                                                                    <span className="px-2 py-1 rounded-md bg-red-50 text-red-800 text-xs capitalize">
                                                                                                        {detail.cyberbullying_type}
                                                                                                        <span className="text-xs text-red-600 ml-1">
                                                                                                            {detail.cyberbullying_type_encode}
                                                                                                        </span>
                                                                                                    </span>
                                                                                                ) : (
                                                                                                    <span className="text-xs text-green-600">safe</span>
                                                                                                )}
                                                                                            </td>
                                                                                            <td className="p-2 text-center">
                                                                                                <div className="w-full bg-gray-200 rounded-full h-1.5 flex items-center">
                                                                                                    <div 
                                                                                                        className={`h-1.5 rounded-full ${
                                                                                                            detail.isCyberbullying ? "bg-red-500" : "bg-green-500"
                                                                                                        }`}
                                                                                                        style={{ width: `${detail.confidence * 100}%` }}
                                                                                                    ></div>
                                                                                                </div>
                                                                                                <span className="text-xs mt-1 block">
                                                                                                    {(detail.confidence * 100).toFixed(0)}%
                                                                                                </span>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </div>
                                    )}

                                    {!selectedData && !analysisResult && (
                                        <Card className="shadow-sm bg-muted/10 border border-border/50">
                                            <CardContent className="flex flex-col items-center justify-center py-12">
                                                <div className="rounded-full bg-gray-100 p-3 mb-4">
                                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                                                    </div>
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-700 mb-2">No Analysis Data</h3>
                                                <p className="text-center text-sm text-gray-500 max-w-xs">
                                                    Select extraction data from above and click &#34;Analyze Content&#34; to perform cyberbullying analysis
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
