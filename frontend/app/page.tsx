"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import {useForm} from "react-hook-form";
import {Layers} from "lucide-react";
import {Switch} from "@/components/ui/switch";
import {Textarea} from "@/components/ui/textarea";
import {toast, Toaster} from "sonner";
import dynamic from "next/dynamic";

// Dynamically import ReactJson (SSR disabled)
const ReactJson = dynamic(() => import('react18-json-view'), {
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
    const [results, setResults] = useState<any[]>([]);
    const [selectedData, setSelectedData] = useState<any | null>(null);
    const [analysisResult, setAnalysisResult] = useState<{
        isCyberbullying: boolean;
        confidence: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [extractId, setExtractId] = useState<string | null>(null);

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

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const filteredUrls = values.urls.filter((url) => url.trim() !== "");
            if (filteredUrls.length === 0) {
                toast.error("Please enter at least one URL");
                throw new Error("Please enter at least one URL");
            }

            let parsedSchema;
            if (values.schema.trim()) {
                try {
                    parsedSchema = JSON.parse(values.schema);
                } catch (error) {
                    toast.error("Invalid JSON schema");
                    throw new Error("Invalid JSON schema");
                }
            }

            toast.info("Starting extraction...");

            const response = await fetch("http://localhost:3002/v1/extract", {
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
            });

            if (!response.ok) {
                toast.error(`API error: ${response.status}`);
                throw new Error(`API error: ${response.status}`);
            }

            const data: ExtractResult = await response.json();

            if (data.success) {
                toast.success(`Extract completed with ID: ${data.extractId}`);
                setExtractId(data.extractId);
                setResults([data.data || {}, ...results]);

                if (!data.data) {
                    pollForResults(data.extractId);
                }
            } else {
                toast.error("Extract request failed");
                throw new Error("Extract request failed");
            }
        } catch (error) {
            console.error("Error starting extract:", error);
            setResults([
                `Error: ${
                    error instanceof Error ? error.message : String(error)
                }`,
                ...results,
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const pollForResults = async (id: string) => {
        try {
            const response = await fetch(`http://localhost:3002/v1/extract/${id}`);

            if (!response.ok) {
                toast.error(`API error: ${response.status}`);
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === "completed") {
                toast.success("Extraction completed successfully!");
                const resultData = data.data || data.result || {};
                setResults([resultData, ...results]);
            } else if (data.status === "processing") {
                setTimeout(() => pollForResults(id), 5000);
                setResults([{status: "processing", id}, ...results]);
            } else if (data.status === "failed") {
                toast.error(`Extract failed: ${data.error || "Unknown error"}`);
                setResults([
                    {status: "failed", error: data.error || "Unknown error"},
                    ...results,
                ]);
            }
        } catch (error) {
            console.error("Error polling for results:", error);
            toast.error(
                `Polling error: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
            setResults([
                {
                    status: "error",
                    error: error instanceof Error ? error.message : String(error),
                },
                ...results,
            ]);
        }
    };

    const analyzeContent = (content: string) => {
        // Mock analysis logic
        const isCyberbullying =
            content.toLowerCase().includes("bad") || Math.random() > 0.7;
        const confidence = Math.round((0.5 + Math.random() * 0.5) * 100) / 100;

        setAnalysisResult({isCyberbullying, confidence});
    };

    const addUrlField = () => {
        const currentUrls = form.getValues().urls;
        form.setValue("urls", [...currentUrls, ""]);
    };

    const removeUrlField = (index: number) => {
        const currentUrls = form.getValues().urls;
        if (currentUrls.length > 1) {
            form.setValue("urls", currentUrls.filter((_, i) => i !== index));
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
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addUrlField}
                                        className="w-full"
                                    >
                                        Add URL
                                    </Button>
                                </div>

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
                                                    form.setValue(
                                                        "schema",
                                                        JSON.stringify(sampleSchema, null, 2)
                                                    );
                                                }}
                                            >
                                                Load Sample Schema
                                            </Button>
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4">
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
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

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
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

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
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
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
                                    onClick={() => setSelectedData(result)}
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
                                <p className="text-muted-foreground mb-2">
                                    No extraction results yet
                                </p>
                                <p className="text-muted-foreground text-sm">
                                    Enter URLs and click "Start Extraction" to begin
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Cyberbullying Analysis */}
                <div className="h-1/2 p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Cyberbullying Analysis</h2>
                        <Button
                            variant="outline"
                            onClick={() =>
                                selectedData && analyzeContent(selectedData as string)
                            }
                            disabled={!selectedData}
                        >
                            Analyze Selected Content
                        </Button>
                    </div>

                    {selectedData && (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Selected Content</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {typeof selectedData === "string" ? (
                                        <p className="text-sm">{selectedData}</p>
                                    ) : (
                                        <ReactJson src={selectedData} collapsed={1}/>
                                    )}
                                </CardContent>
                            </Card>

                            {analysisResult && (
                                <Card
                                    className={
                                        analysisResult.isCyberbullying
                                            ? "border-red-500"
                                            : "border-green-500"
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
                                                <span>
                          {(analysisResult.confidence * 100).toFixed(1)}%
                        </span>
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
