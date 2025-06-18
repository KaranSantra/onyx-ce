"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorCallout } from "@/components/ErrorCallout";
import { submitCaseQuery, PacketType } from "./lib";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypePrism from "rehype-prism-plus";
import rehypeKatex from "rehype-katex";
import "prismjs/themes/prism-tomorrow.css";
import "katex/dist/katex.min.css";
import { CodeBlock } from "@/app/chat/message/CodeBlock";
import { MemoizedAnchor, MemoizedParagraph } from "@/app/chat/message/MemoizedTextComponents";
import { extractCodeText, preprocessLaTeX } from "@/app/chat/message/codeUtils";
import { transformLinkUri } from "@/lib/utils";

export default function Page() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    stateOfResidence: "",
    additionalInformation: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Process content for markdown rendering (similar to chat implementation)
  const processContent = useCallback((content: string) => {
    const codeBlockRegex = /```(\w*)\n[\s\S]*?```|```[\s\S]*?$/g;
    const matches = content.match(codeBlockRegex);

    if (matches) {
      content = matches.reduce((acc, match) => {
        if (!match.match(/```\w+/)) {
          return acc.replace(match, match.replace("```", "```plaintext"));
        }
        return acc;
      }, content);

      const lastMatch = matches[matches.length - 1];
      if (!lastMatch.endsWith("```")) {
        return preprocessLaTeX(content);
      }
    }
    const processed = preprocessLaTeX(content);
    return processed + (!isLoading ? "" : " [*]() ");
  }, [isLoading]);

  // Custom anchor component for case file references
  const CaseFileAnchor = useCallback(({ href, children }: any) => {
    const value = children?.toString();
    console.log("CaseFileAnchor - Processing value:", JSON.stringify(value), "href:", href);
    
    // Convert any .html file reference to "Source link"
    const htmlFileMatch = value?.match(/^(.+?)\.html(\s*\[\d+\])?$/);
    if (htmlFileMatch) {
      const filename = htmlFileMatch[1];
      const caseUrl = `https://www.hbsslaw.com/cases/${filename}`;
      console.log("CaseFileAnchor - Matched HTML file:", filename, "URL:", caseUrl);
      
      return (
        <a
          href={caseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer text-link hover:text-link-hover underline"
        >
          Source link
        </a>
      );
    }
    
    // For regular links, use the default behavior
    return (
      <MemoizedAnchor
        updatePresentingDocument={() => {}} // No document preview in case-matcher
        docs={null}
        userFiles={null}
        href={href}
      >
        {children}
      </MemoizedAnchor>
    );
  }, []);

  // Callback functions for markdown components
  const anchorCallback = useCallback((props: any) => (
    <CaseFileAnchor href={props.href}>
      {props.children}
    </CaseFileAnchor>
  ), [CaseFileAnchor]);

  const paragraphCallback = useCallback((props: any) => (
    <MemoizedParagraph>{props.children}</MemoizedParagraph>
  ), []);

  // Custom table cell component to handle case file references
  const tableCellCallback = useCallback((props: any) => {
    const content = props.children?.toString();
    console.log("Table cell content:", JSON.stringify(content));
    
    // Check if this cell contains a .html file reference
    const htmlFileMatch = content?.match(/^(.+?)\.html(\s*\[\d+\])?$/);
    if (htmlFileMatch) {
      const filename = htmlFileMatch[1];
      const caseUrl = `https://www.hbsslaw.com/cases/${filename}`;
      console.log("Table cell - Matched HTML file:", filename, "URL:", caseUrl);
      
      return (
        <td className={props.className}>
          <a
            href={caseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer text-link hover:text-link-hover underline"
          >
            Source link
          </a>
        </td>
      );
    }
    
    // Default table cell behavior
    return <td className={props.className}>{props.children}</td>;
  }, []);

  // Memoized markdown components (simplified version of chat implementation)
  const markdownComponents = useMemo(() => ({
    a: anchorCallback,
    p: paragraphCallback,
    td: tableCellCallback,
    b: ({ node, className, children }: any) => (
      <span className={className}>{children}</span>
    ),
    code: ({ node, className, children }: any) => {
      const codeText = extractCodeText(node, response, children);
      return (
        <CodeBlock className={className} codeText={codeText}>
          {children}
        </CodeBlock>
      );
    },
  }), [anchorCallback, paragraphCallback, tableCellCallback, response]);

  // Process and render the response content
  const processedResponse = useMemo(() => {
    if (!response) return "";
    return processContent(response);
  }, [response, processContent]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.additionalInformation.trim()) {
      setError("Please provide additional information about your case.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse("");

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Submit the case query and get streaming response
      const streamGenerator = await submitCaseQuery(
        formData.additionalInformation,
        abortControllerRef.current.signal
      );

      // Process streaming response
      for await (const packet of streamGenerator) {
        if (packet.answer_piece) {
          setResponse(prev => prev + packet.answer_piece);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        console.error("Error submitting case query:", error);
        setError(error.message || "Failed to process your request. Please try again.");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-4xl font-light text-blue-600 dark:text-blue-400 mb-2">
            CASE MATCHER
          </h1>
          <p className="text-gray-700 dark:text-gray-300">
            Fill out the form for a confidential review of your matter.
          </p>
        </div>

        <div className="grid grid-cols-[40%_60%] min-h-[calc(100vh-140px)]">
          {/* Contact Form */}
          <div className="p-6 border-r border-gray-200 dark:border-gray-700 overflow-y-auto w-full">
            <form
              onSubmit={handleSubmit}
              className="space-y-3 w-full max-w-none"
            >
              <div className="w-full">
                <Label
                  htmlFor="firstName"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block"
                >
                  First name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className="w-full h-9"
                />
              </div>

              <div className="w-full">
                <Label
                  htmlFor="lastName"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block"
                >
                  Last name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className="w-full h-9"
                />
              </div>

              <div className="w-full">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full h-9"
                />
              </div>

              <div className="w-full">
                <Label
                  htmlFor="phoneNumber"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block"
                >
                  Phone number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  className="w-full h-9"
                />
              </div>

              <div className="w-full">
                <Label
                  htmlFor="stateOfResidence"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block"
                >
                  State of residence
                </Label>
                <Select
                  value={formData.stateOfResidence}
                  onValueChange={(value) =>
                    handleInputChange("stateOfResidence", value)
                  }
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Please Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AL">Alabama</SelectItem>
                    <SelectItem value="AK">Alaska</SelectItem>
                    <SelectItem value="AZ">Arizona</SelectItem>
                    <SelectItem value="AR">Arkansas</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="CO">Colorado</SelectItem>
                    <SelectItem value="CT">Connecticut</SelectItem>
                    <SelectItem value="DE">Delaware</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="HI">Hawaii</SelectItem>
                    <SelectItem value="ID">Idaho</SelectItem>
                    <SelectItem value="IL">Illinois</SelectItem>
                    <SelectItem value="IN">Indiana</SelectItem>
                    <SelectItem value="IA">Iowa</SelectItem>
                    <SelectItem value="KS">Kansas</SelectItem>
                    <SelectItem value="KY">Kentucky</SelectItem>
                    <SelectItem value="LA">Louisiana</SelectItem>
                    <SelectItem value="ME">Maine</SelectItem>
                    <SelectItem value="MD">Maryland</SelectItem>
                    <SelectItem value="MA">Massachusetts</SelectItem>
                    <SelectItem value="MI">Michigan</SelectItem>
                    <SelectItem value="MN">Minnesota</SelectItem>
                    <SelectItem value="MS">Mississippi</SelectItem>
                    <SelectItem value="MO">Missouri</SelectItem>
                    <SelectItem value="MT">Montana</SelectItem>
                    <SelectItem value="NE">Nebraska</SelectItem>
                    <SelectItem value="NV">Nevada</SelectItem>
                    <SelectItem value="NH">New Hampshire</SelectItem>
                    <SelectItem value="NJ">New Jersey</SelectItem>
                    <SelectItem value="NM">New Mexico</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="NC">North Carolina</SelectItem>
                    <SelectItem value="ND">North Dakota</SelectItem>
                    <SelectItem value="OH">Ohio</SelectItem>
                    <SelectItem value="OK">Oklahoma</SelectItem>
                    <SelectItem value="OR">Oregon</SelectItem>
                    <SelectItem value="PA">Pennsylvania</SelectItem>
                    <SelectItem value="RI">Rhode Island</SelectItem>
                    <SelectItem value="SC">South Carolina</SelectItem>
                    <SelectItem value="SD">South Dakota</SelectItem>
                    <SelectItem value="TN">Tennessee</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="UT">Utah</SelectItem>
                    <SelectItem value="VT">Vermont</SelectItem>
                    <SelectItem value="VA">Virginia</SelectItem>
                    <SelectItem value="WA">Washington</SelectItem>
                    <SelectItem value="WV">West Virginia</SelectItem>
                    <SelectItem value="WI">Wisconsin</SelectItem>
                    <SelectItem value="WY">Wyoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full">
                <Label
                  htmlFor="additionalInformation"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block"
                >
                  Additional information
                </Label>
                <Textarea
                  id="additionalInformation"
                  value={formData.additionalInformation}
                  onChange={(e) =>
                    handleInputChange("additionalInformation", e.target.value)
                  }
                  className="w-full min-h-[100px] resize-y"
                  placeholder="Please describe your legal matter in detail..."
                />
              </div>

              {error && <ErrorCallout errorMsg={error} />}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 font-medium disabled:opacity-50"
              >
                {isLoading ? "Analyzing Your Case..." : "Find Matching Cases"}
              </Button>
            </form>
          </div>

          {/* Results Section */}
          <div className="p-6 overflow-y-auto">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Legal Analysis
            </h2>

            {isLoading && !response && (
              <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-lg mb-2">Analyzing Your Case</p>
                  <p className="text-sm">Please wait while we process your request...</p>
                </div>
              </div>
            )}

            {!isLoading && !response && !error && (
              <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <p className="text-lg mb-2">Legal Analysis Results</p>
                  <p className="text-sm">
                    Fill out the form and submit to see your case analysis here
                  </p>
                </div>
              </div>
            )}

            {response && (
              <div className="bg-transparent rounded-lg p-4">
                <div className="max-w-none">
                  <ReactMarkdown
                    className="prose dark:prose-invert max-w-full text-base"
                    components={markdownComponents}
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[[rehypePrism, { ignoreMissing: true }], rehypeKatex]}
                    urlTransform={transformLinkUri}
                  >
                    {processedResponse}
                  </ReactMarkdown>
                  {isLoading && (
                    <div className="flex items-center mt-2 text-blue-600">
                      <div className="animate-pulse">▊</div>
                      <span className="ml-2 text-sm">Generating response...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
