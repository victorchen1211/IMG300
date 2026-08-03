// @fontsource Package Imports for Offline & Fast Production Web Fonts
import "@fontsource/inter/700.css";
import "@fontsource/syne/700.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/bebas-neue/400.css";
import "@fontsource/oswald/700.css";
import "@fontsource/space-mono/700.css";
import "@fontsource/outfit/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/dancing-script/700.css";

export interface FontOption {
  label: string;
  value: string;
}

export const FONTSOURCE_OPTIONS: FontOption[] = [
  { label: "Inter (@fontsource/inter)", value: '"Inter", sans-serif' },
  { label: "Syne (@fontsource/syne)", value: '"Syne", sans-serif' },
  { label: "Playfair Display (@fontsource/playfair-display)", value: '"Playfair Display", serif' },
  { label: "Cinzel (@fontsource/cinzel)", value: '"Cinzel", serif' },
  { label: "Cormorant Garamond (@fontsource/cormorant-garamond)", value: '"Cormorant Garamond", serif' },
  { label: "Bebas Neue (@fontsource/bebas-neue)", value: '"Bebas Neue", sans-serif' },
  { label: "Oswald (@fontsource/oswald)", value: '"Oswald", sans-serif' },
  { label: "Space Mono (@fontsource/space-mono)", value: '"Space Mono", monospace' },
  { label: "Outfit (@fontsource/outfit)", value: '"Outfit", sans-serif' },
  { label: "Montserrat (@fontsource/montserrat)", value: '"Montserrat", sans-serif' },
  { label: "Dancing Script (@fontsource/dancing-script)", value: '"Dancing Script", cursive' },
  { label: "System Sans (Default)", value: 'system-ui, -apple-system, sans-serif' }
];
