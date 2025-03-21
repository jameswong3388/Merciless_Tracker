"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";

type FormValues = {
  url: string;
  depth: number;
};

export default function Home() {
  const [results, setResults] = useState<string[]>([]);
  const [selectedData, setSelectedData] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{isCyberbullying: boolean; confidence: number} | null>(null);
  
  const form = useForm<FormValues>({
    defaultValues: {
      url: "",
      depth: 1,
    },
  });

  const onSubmit = (values: FormValues) => {
    console.log(values);
    // This would be where the web crawling API is called
    setResults([`Crawled ${values.url} with depth ${values.depth}`, ...results]);
  };

  const analyzeContent = (content: string) => {
    // Mock analysis - in a real app, this would call an AI/ML API
    const isCyberbullying = content.toLowerCase().includes('bad') || Math.random() > 0.7;
    const confidence = Math.round((0.5 + Math.random() * 0.5) * 100) / 100;
    
    setAnalysisResult({
      isCyberbullying,
      confidence
    });
  };

  return (
    <div className="flex h-screen">
      {/* Left Panel - URL Settings */}
      <div className="w-1/3 border-r p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Web Crawler</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL to crawl</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter the starting URL for crawling
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="depth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Crawl Depth</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" max="5" {...field} />
                  </FormControl>
                  <FormDescription>
                    How many links deep to crawl (1-5)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">Start Crawling</Button>
          </form>
        </Form>
        
        <div className="mt-6">
          <h3 className="font-medium mb-2">Crawling Settings</h3>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4 mt-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Follow external links</span>
                      <input type="checkbox" id="external" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Respect robots.txt</span>
                      <input type="checkbox" id="robots" defaultChecked />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="advanced" className="mt-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Delay between requests (ms)</span>
                      <Input type="number" defaultValue="1000" className="w-24" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Timeout (seconds)</span>
                      <Input type="number" defaultValue="30" className="w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Panel - Split into Results and Analysis */}
      <div className="w-2/3 flex flex-col h-full overflow-hidden">
        {/* Top Half - Results */}
        <div className="h-1/2 p-6 overflow-y-auto border-b">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Crawling Results</h2>
            <Button variant="outline" onClick={() => setResults([])}>Clear Results</Button>
          </div>
          
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={index} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedData(result)}>
                  <CardContent className="pt-6">
                    <p>{result}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[150px] text-center">
                <p className="text-muted-foreground mb-2">No crawling results yet</p>
                <p className="text-muted-foreground text-sm">Enter a URL and click "Start Crawling" to begin</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Bottom Half - Analysis */}
        <div className="h-1/2 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Cyberbullying Analysis</h2>
            <Button 
              variant="outline" 
              onClick={() => selectedData && analyzeContent(selectedData)}
              disabled={!selectedData}
            >
              Analyze Selected Content
            </Button>
          </div>
          
          {selectedData ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Selected Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{selectedData}</p>
                </CardContent>
              </Card>
              
              {analysisResult && (
                <Card className={analysisResult.isCyberbullying ? "border-red-500" : "border-green-500"}>
                  <CardHeader>
                    <CardTitle>Analysis Result</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Classification:</span>
                        <span className={analysisResult.isCyberbullying ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
                          {analysisResult.isCyberbullying ? "Cyberbullying Content" : "Safe Content"}
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
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[150px] text-center">
                <p className="text-muted-foreground mb-2">No content selected</p>
                <p className="text-muted-foreground text-sm">Click on a result above to analyze it for cyberbullying</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
