// =============================================================================
// CMS Pages — Fully typed block system
// Keep in sync with pageBlockSchemas.ts in verkkokauppapalvelu
// =============================================================================

/**
 * A published CMS page with typed content blocks.
 */
export interface StorePage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  blocks: PageBlock[];
  updatedAt: string;
}

// =============================================================================
// Base block fields (shared by all block types)
// =============================================================================

interface BaseBlock {
  id: string;
  order: number;
}

// =============================================================================
// Block types — discriminated union on `type`
// =============================================================================

export interface MarkdownBlock extends BaseBlock {
  type: "markdown";
  data: {
    content: string;
  };
}

export interface AccordionBlock extends BaseBlock {
  type: "accordion";
  data: {
    title?: string;
    description?: string;
    items: AccordionItem[];
  };
}

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface GalleryBlock extends BaseBlock {
  type: "gallery";
  data: {
    title?: string;
    items: GalleryItem[];
  };
}

export interface GalleryItem {
  id: string;
  src: string;
  alt?: string;
  order: number;
}

export interface AboutBlock extends BaseBlock {
  type: "about";
  data: {
    title: string;
    description: string;
    imageUrl?: string;
    imagePosition: "left" | "right";
  };
}

export interface ShowcaseBlock extends BaseBlock {
  type: "showcase";
  data: {
    items: ShowcaseItem[];
  };
}

export interface ShowcaseItem {
  title: string;
  description?: string;
  imageUrl: string;
  categorySlug: string;
}

// =============================================================================
// Discriminated union of all block types
// =============================================================================

export type PageBlock =
  | MarkdownBlock
  | AccordionBlock
  | GalleryBlock
  | AboutBlock
  | ShowcaseBlock;
