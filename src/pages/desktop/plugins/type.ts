export interface Plugin {
  id: string;
  name: string;
  short_description: string;
  long_description: string;
  readme: string; //actually markdown
  license: string;
  authors: { name: string; email?: string; link?: string }[];
  category: string;
  last_update: string;
  images: { image: string; thumbnail: string }[];
  versions: Record<string, { url: string; last_update: string; plugin_version?: string }>;
  sourcecode: string;
  homepage: string;
}
