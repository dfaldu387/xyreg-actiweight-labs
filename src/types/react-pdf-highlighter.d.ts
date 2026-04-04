declare module "react-pdf-highlighter" {
  import { ReactNode } from "react";

  export interface ScaledPosition {
    boundingRect: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      height: number;
      pageNumber: number;
    };
    rects: Array<{
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      width: number;
      height: number;
      pageNumber: number;
    }>;
    pageNumber: number;
  }

  export interface Content {
    text?: string;
    image?: string;
  }

  export interface Comment {
    text: string;
    emoji: string;
  }

  export interface IHighlight {
    id: string;
    position: ScaledPosition;
    content: Content;
    comment: Comment;
  }

  export interface NewHighlight {
    position: ScaledPosition;
    content: Content;
    comment: Comment;
  }

  export interface PdfHighlighterProps {
    pdfDocument: any;
    enableAreaSelection?: (event: MouseEvent) => boolean;
    onScrollChange?: () => void;
    scrollRef?: (scrollTo: (highlight: IHighlight) => void) => void;
    onSelectionFinished?: (
      position: ScaledPosition,
      content: Content,
      hideTipAndSelection: () => void,
      transformSelection: () => void
    ) => ReactNode;
    highlightTransform?: (
      highlight: IHighlight,
      index: number,
      setTip: (highlight: IHighlight, callback: (highlight: IHighlight) => ReactNode) => void,
      hideTip: () => void,
      viewportToScaled: (rect: any) => ScaledPosition,
      screenshot: (rect: any) => string,
      isScrolledTo: boolean
    ) => ReactNode;
    highlights: IHighlight[];
  }

  export interface PdfLoaderProps {
    url: string;
    beforeLoad: ReactNode;
    children: (pdfDocument: any) => ReactNode;
  }

  export interface HighlightProps {
    isScrolledTo: boolean;
    position: ScaledPosition;
    comment: Comment;
  }

  export interface AreaHighlightProps {
    isScrolledTo: boolean;
    highlight: IHighlight;
    onChange: (boundingRect: any) => void;
  }

  export interface PopupProps {
    popupContent: ReactNode;
    onMouseOver: (popupContent: ReactNode) => void;
    onMouseOut: () => void;
    children: ReactNode;
  }

  export interface TipProps {
    onOpen: () => void;
    onConfirm: (comment: Comment) => void;
  }

  export const PdfHighlighter: React.FC<PdfHighlighterProps>;
  export const PdfLoader: React.FC<PdfLoaderProps>;
  export const Highlight: React.FC<HighlightProps>;
  export const AreaHighlight: React.FC<AreaHighlightProps>;
  export const Popup: React.FC<PopupProps>;
  export const Tip: React.FC<TipProps>;
}
