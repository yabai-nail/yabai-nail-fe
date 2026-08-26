// Public browse types: home, promotions, nail-designs, reviews,
// localization and app-bootstrap responses that any client can request
// without an active session.

export interface AppBootstrap {
  readonly appVersion: string;
  readonly minSupportedVersion?: string;
  readonly features?: Readonly<Record<string, boolean>>;
  readonly branches?: ReadonlyArray<Record<string, unknown>>;
  readonly defaultBranchId?: string;
  readonly locale?: string;
  readonly [field: string]: unknown;
}

export interface CustomerHome {
  readonly hero?: Readonly<Record<string, unknown>>;
  readonly sections: ReadonlyArray<Record<string, unknown>>;
  readonly generatedAt: string;
  readonly [field: string]: unknown;
}

export interface LocalizationLanguage {
  readonly code: string;
  readonly label: string;
  readonly nativeLabel?: string;
  readonly default?: boolean;
  readonly [field: string]: unknown;
}

export interface PublicPromotion {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly description?: string;
  readonly discount?: number;
  readonly percentage?: number;
  readonly startsAt?: string;
  readonly endsAt?: string;
  readonly [field: string]: unknown;
}

export interface NailDesign {
  readonly id: string;
  readonly name: string;
  readonly imageUrl?: string;
  readonly categoryIds?: ReadonlyArray<string>;
  readonly favoriteCount?: number;
  readonly [field: string]: unknown;
}

export interface PublicReview {
  readonly id: string;
  readonly rating: number;
  readonly content?: string;
  readonly customerName?: string;
  readonly createdAt: string;
  readonly serviceName?: string;
  readonly [field: string]: unknown;
}
