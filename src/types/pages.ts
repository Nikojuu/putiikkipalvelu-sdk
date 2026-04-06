// =============================================================================
// CMS Pages — Fully typed block system
// Keep in sync with pageBlockSchemas.ts in verkkokauppapalvelu
// =============================================================================

/**
 * A published CMS page with typed content blocks.
 */
export interface PageSeo {
  seoTitle: string | null;
  seoDescription: string | null;
  domain: string | null;
  openGraphImageUrl: string | null;
  ogImageAlt: string | null;
  twitterImageUrl: string | null;
  twitterHandle: string | null;
}

export interface StorePage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  blocks: PageBlock[];
  updatedAt: string;
  storeName: string;
  seo: PageSeo | null;
}

// =============================================================================
// Base block fields (shared by all block types)
// =============================================================================

interface BaseBlock {
  id: string;
  order: number;
  hidden?: boolean;
  /** Technical identifier for targeting this block from the storefront template */
  key?: string;
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
    title?: string;
    description?: string;
    items: ShowcaseItem[];
  };
}

export interface ShowcaseItem {
  title: string;
  description?: string;
  imageUrl: string;
  categorySlug: string;
}

export interface HeroBlock extends BaseBlock {
  type: "hero";
  data: {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
  };
}

export interface LatestProductsBlock extends BaseBlock {
  type: "latest_products";
  data: {
    title?: string;
    description?: string;
    count: number;
  };
}

export interface CtaBlock extends BaseBlock {
  type: "cta";
  data: {
    title?: string;
    description?: string;
    primaryButtonText?: string;
    primaryButtonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
  };
}

export interface CarouselContentItem {
  id: string;
  src: string;
  alt?: string;
  order: number;
}

export interface CarouselContentBlock extends BaseBlock {
  type: "carousel_content";
  data: {
    content: string;
    items: CarouselContentItem[];
    contentPosition: "left" | "right";
  };
}

// =============================================================================
// Opening Hours Calendar block
// =============================================================================

export interface OpeningHoursEntry {
  open: string;
  close: string;
  note?: string;
}

export interface OpeningHoursBlock extends BaseBlock {
  type: "opening_hours";
  data: {
    title?: string;
    days: Record<string, OpeningHoursEntry>;
  };
}

// =============================================================================
// Image Grid block
// =============================================================================

export interface ImageGridItem {
  id: string;
  imageUrl: string;
  content: string;
  order: number;
}

export interface ImageGridBlock extends BaseBlock {
  type: "image_grid";
  data: {
    title?: string;
    columns: 2 | 3 | 4;
    items: ImageGridItem[];
  };
}

// =============================================================================
// Text Grid block
// =============================================================================

export interface TextGridItem {
  id: string;
  content: string;
  order: number;
}

export interface TextGridBlock extends BaseBlock {
  type: "text_grid";
  data: {
    title?: string;
    description?: string;
    columns: 2 | 3 | 4 | 5 | 6;
    items: TextGridItem[];
  };
}

// =============================================================================
// Table block
// =============================================================================

export interface TableBlock extends BaseBlock {
  type: "table";
  data: {
    title?: string;
    description?: string;
    headers: string[];
    rows: string[][];
  };
}

// =============================================================================
// Discriminated union of all block types
// =============================================================================

export type PageBlock =
  | MarkdownBlock
  | AccordionBlock
  | GalleryBlock
  | AboutBlock
  | ShowcaseBlock
  | HeroBlock
  | LatestProductsBlock
  | CtaBlock
  | CarouselContentBlock
  | OpeningHoursBlock
  | ImageGridBlock
  | TextGridBlock
  | TableBlock;
