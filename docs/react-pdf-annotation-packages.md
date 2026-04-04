# Best Free React PDF Annotation Packages (2025)

A comprehensive guide to open-source and free React PDF annotation libraries with their features and functionalities.

---

## Quick Comparison Table

| Package | Text Highlight | Shapes | Comments | Drawing | Free | Active |
|---------|---------------|--------|----------|---------|------|--------|
| react-pdf-highlighter | Yes | Rectangle | Yes | No | Yes (MIT) | Yes |
| pdf-annotator-react | Yes | Yes | Yes | Yes | Yes | Yes |
| react-pdf | Basic | No | No | No | Yes (MIT) | Yes |
| PDF.js (Mozilla) | Manual | Manual | Manual | Manual | Yes | Yes |
| pdf-lib | No | Yes | Yes | No | Yes (MIT) | No* |
| pdfme | Template | Limited | No | No | Yes | Yes |

*pdf-lib hasn't been updated since Nov 2021

---

## 1. react-pdf-highlighter (Recommended for Text Annotations)

**GitHub:** [agentcooper/react-pdf-highlighter](https://github.com/agentcooper/react-pdf-highlighter)

**Stats:** 1.3k Stars | 497 Forks | MIT License

### Installation
```bash
npm install react-pdf-highlighter
```

### Required CSS
```tsx
import "react-pdf-highlighter/dist/style.css";
```

### Features
| Feature | Supported |
|---------|-----------|
| Text Highlights | Yes |
| Image/Area Highlights | Yes |
| Rectangle Selection | Yes |
| Popover Comments | Yes |
| Scroll to Highlight | Yes |
| Viewport-Independent Data | Yes |
| TypeScript Support | Yes (94%) |

### Browser Support
- Google Chrome
- Safari 10+
- Firefox 52+

### Pros
- Built on PDF.js (Mozilla)
- Native React components
- Highlight data is viewport-independent (good for server storage)
- Active maintenance
- Good documentation with live demo

### Cons
- No shape annotations (circle, line, arrow)
- No freehand drawing
- Limited to text and rectangular highlights

### Basic Usage
```tsx
import { PdfLoader, PdfHighlighter } from "react-pdf-highlighter";
import "react-pdf-highlighter/dist/style.css";

function PDFAnnotator({ url }) {
  return (
    <PdfLoader url={url}>
      {(pdfDocument) => (
        <PdfHighlighter
          pdfDocument={pdfDocument}
          highlights={highlights}
          onSelectionFinished={(position, content, hideTipAndSelection) => {
            // Handle new highlight
          }}
        />
      )}
    </PdfLoader>
  );
}
```

---

## 2. pdf-annotator-react

**NPM:** [pdf-annotator-react](https://www.npmjs.com/package/pdf-annotator-react)

**Latest Version:** 0.4.10

### Installation
```bash
npm install pdf-annotator-react
```

### Features
| Feature | Supported |
|---------|-----------|
| Text Highlights | Yes |
| Shape Annotations | Yes |
| Comments/Notes | Yes |
| Freehand Drawing | Yes |
| Multiple Colors | Yes |

### Pros
- Modern React component library
- Full annotation capabilities
- Drawing and shapes support
- Actively maintained

### Cons
- Smaller community
- Less documentation
- Newer package (less battle-tested)

---

## 3. react-pdf

**NPM:** [react-pdf](https://www.npmjs.com/package/react-pdf)

**GitHub:** Popular with 9k+ stars | MIT License

### Installation
```bash
npm install react-pdf
```

### Features
| Feature | Supported |
|---------|-----------|
| PDF Rendering | Yes |
| Page Navigation | Yes |
| Zoom Controls | Yes |
| Text Layer | Yes |
| Annotation Layer | Basic (links only) |
| Custom Annotations | Manual implementation |

### Annotation CSS (Required)
```tsx
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
```

### Pros
- Lightweight wrapper around PDF.js
- Excellent for basic PDF viewing
- Very popular and well-maintained
- Easy to integrate

### Cons
- No built-in annotation tools
- Custom annotations require manual implementation
- Best for viewing, not annotating

### Basic Usage
```tsx
import { Document, Page } from 'react-pdf';

function PDFViewer({ file }) {
  const [numPages, setNumPages] = useState(null);

  return (
    <Document file={file} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
      <Page pageNumber={1} />
    </Document>
  );
}
```

---

## 4. PDF.js (Mozilla)

**Website:** [Mozilla PDF.js](https://mozilla.github.io/pdf.js/)

**GitHub:** 50k+ stars | Apache 2.0 License

### Installation
```bash
npm install pdfjs-dist
```

### Features
| Feature | Supported |
|---------|-----------|
| PDF Rendering | Yes |
| Text Selection | Yes |
| Search | Yes |
| Annotations | Manual |
| Form Filling | Yes |
| Printing | Yes |

### Pros
- Industry standard PDF renderer
- Highly customizable
- Extensive community support
- Full control over implementation

### Cons
- Requires significant custom development for annotations
- Steeper learning curve
- Not React-specific

---

## 5. pdf-lib

**NPM:** [pdf-lib](https://www.npmjs.com/package/pdf-lib)

**GitHub:** 7,700+ stars | MIT License

### Installation
```bash
npm install pdf-lib
```

### Features
| Feature | Supported |
|---------|-----------|
| Create PDFs | Yes |
| Modify PDFs | Yes |
| Add Text | Yes |
| Add Images | Yes |
| Add Shapes | Yes |
| Form Fields | Yes |
| Digital Signatures | Yes |
| Merge PDFs | Yes |

### Pros
- Most powerful for PDF modification
- Works in browser and Node.js
- No external dependencies
- Can modify existing PDFs

### Cons
- Not updated since November 2021
- Not a viewer (for generation/modification)
- Requires building your own UI

### Basic Usage
```tsx
import { PDFDocument, rgb } from 'pdf-lib';

async function addAnnotation() {
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  firstPage.drawRectangle({
    x: 50,
    y: 50,
    width: 200,
    height: 100,
    borderColor: rgb(1, 0, 0),
    borderWidth: 2,
  });

  const pdfBytes = await pdfDoc.save();
}
```

---

## 6. pdfme

**NPM:** [pdfme](https://www.npmjs.com/package/@pdfme/generator)

**GitHub:** 3,400+ stars

### Installation
```bash
npm install @pdfme/generator @pdfme/ui
```

### Features
| Feature | Supported |
|---------|-----------|
| Template-based PDF | Yes |
| WYSIWYG Editor | Yes |
| Form Fields | Yes |
| Text Annotations | Yes |
| TypeScript | Yes |

### Pros
- Great for form-based PDFs
- Visual template editor
- React-first API
- Active development

### Cons
- Focused on generation, not annotation
- Template-based approach
- Limited annotation types

---

## Recommendation Summary

### For Text Highlighting & Comments
**Use: react-pdf-highlighter**
- Best for document review workflows
- Simple API, good documentation
- Production-ready

### For Full Annotation (Shapes, Drawing, Comments)
**Use: pdf-annotator-react**
- Modern, full-featured
- All annotation types supported

### For Simple PDF Viewing (Build Your Own Annotations)
**Use: react-pdf + custom implementation**
- Lightweight base
- Full control over annotation UI

### For PDF Generation & Modification
**Use: pdf-lib or pdfme**
- Server-side or client-side PDF creation
- Add annotations programmatically

---

## Implementation Tips

### 1. Storing Annotations
Store annotations in a viewport-independent format:
```typescript
interface Annotation {
  id: string;
  type: 'highlight' | 'rectangle' | 'circle' | 'comment';
  pageNumber: number;
  position: {
    x: number;      // percentage or absolute
    y: number;
    width: number;
    height: number;
  };
  content?: string;
  color?: string;
  createdAt: string;
  createdBy: string;
}
```

### 2. Scaling Annotations
Always store positions as percentages or use a fixed reference size:
```typescript
// Convert to percentage
const percentX = (absoluteX / pageWidth) * 100;
const percentY = (absoluteY / pageHeight) * 100;

// Convert back when rendering
const renderX = (percentX / 100) * currentPageWidth;
const renderY = (percentY / 100) * currentPageHeight;
```

### 3. Performance Considerations
- Use virtualization for multi-page PDFs
- Lazy load annotations per page
- Debounce annotation saves
- Use Web Workers for PDF parsing

---

## Sources

- [ThemeSelection - React PDF Libraries 2025](https://themeselection.com/react-pdf-library-and-viewers/)
- [react-pdf-highlighter GitHub](https://github.com/agentcooper/react-pdf-highlighter)
- [react-pdf NPM](https://www.npmjs.com/package/react-pdf)
- [pdf-annotator-react NPM](https://www.npmjs.com/package/pdf-annotator-react)
- [Nutrient - React PDF Annotations Guide](https://www.nutrient.io/guides/web/annotations/react/)
- [DEV Community - Open-Source PDF Libraries](https://dev.to/ansonch/6-open-source-pdf-generation-and-modification-libraries-every-react-dev-should-know-in-2025-13g0)
