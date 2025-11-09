export interface ArtistLink {
  name: string;
  url: string;
}

export interface Artist {
  id: string;
  name: string;
  profileImage: string;
  statement: string;
  gallery: string[];
  links: ArtistLink[];
  tags: string[];
}
