import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import BookmarkHTMLHighlighter, { Highlight } from './BookmarkHtmlHighlighter';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`;

// Properly type the PDF.js text items
interface PDFTextItem {
    str: string;
    transform: number[];
    width: number;
    height: number;
    dir: string;
    fontName?: string;
}

interface PDFHighlighterProps {
    pdfUrl: string;
    highlights?: Highlight[];
    onHighlight?: (highlightData: Omit<Highlight, "id">) => void;
    onUpdateHighlight?: (highlight: Highlight) => void;
    onDeleteHighlight?: (highlight: Highlight) => void;
}

export function PDFHighlighter({ pdfUrl, highlights = [], onHighlight, onUpdateHighlight, onDeleteHighlight }: PDFHighlighterProps) {
    const [pages, setPages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function loadPDF() {
            try {
                setLoading(true);
                const loadingTask = pdfjs.getDocument(pdfUrl);
                const pdf = await loadingTask.promise;
                const numPages = pdf.numPages;
                const pagesContent: string[] = [];

                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 });

                    // Get text content
                    const textContent = await page.getTextContent();
                    const textItems = textContent.items as PDFTextItem[];

                    // Group text items by y-position to maintain lines
                    const lineMap = new Map<number, PDFTextItem[]>();

                    textItems.forEach(item => {
                        // Round to nearest pixel to group items on the same line
                        const yPos = Math.round(item.transform[5]);
                        if (!lineMap.has(yPos)) {
                            lineMap.set(yPos, []);
                        }
                        lineMap.get(yPos)?.push(item);
                    });

                    // Sort lines by y-position (top to bottom)
                    const sortedLines = Array.from(lineMap.entries())
                        .sort((a, b) => b[0] - a[0]); // Reverse order (PDF coordinates)

                    // Build HTML content with line breaks between lines
                    let htmlContent = '';

                    sortedLines.forEach(([_, items]) => {
                        // Sort items within a line by x-position (left to right)
                        const sortedItems = items.sort((a, b) => a.transform[4] - b.transform[4]);

                        // Add items with appropriate spacing
                        let lineContent = '';
                        sortedItems.forEach(item => {
                            // Escape HTML special characters
                            const text = item.str
                                .replace(/&/g, '&amp;')
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;');

                            lineContent += text;
                        });

                        htmlContent += lineContent + '<br/>';
                    });

                    pagesContent.push(`
            <div class="pdf-page" data-page="${i}" style="width:${viewport.width}px; margin-bottom:20px; position:relative; background-color:white; padding:8px; border:1px solid #ddd;">
              <div class="pdf-page-content" style="white-space:pre-wrap; font-family:sans-serif;">
                ${htmlContent}
              </div>
            </div>
          `);
                }

                setPages(pagesContent);
                setLoading(false);
            } catch (error) {
                console.error('Error loading PDF:', error);
                setLoading(false);
            }
        }

        loadPDF();
    }, [pdfUrl]);

    if (loading) {
        return <div className="flex h-full items-center justify-center">Loading PDF...</div>;
    }

    return (
        <div ref={containerRef} className="pdf-container h-full overflow-auto">
            <BookmarkHTMLHighlighter
                htmlContent={pages.join('')}
                highlights={highlights}
                onHighlight={onHighlight}
                onUpdateHighlight={onUpdateHighlight}
                onDeleteHighlight={onDeleteHighlight}
                className="pdf-content p-4"
            />
        </div>
    );
}