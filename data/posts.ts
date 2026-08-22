export type PostAuthor = {
  name: string;
  initial: string;
  bgColor: string;
  textColor: string;
};

export type PostCategory =
  | "comida"
  | "siesta"
  | "actividad"
  | "logro"
  | "animo"
  | "foto"
  | "anuncio";

export type Post = {
  id: string;
  category: PostCategory;
  author: PostAuthor;
  timestamp: string;
  publishedBy: string;
  recipient: string;
  content: string;
  photos?: string[];
  likes: number;
  comments: number;
};

type PostCategoryMeta = {
  label: string;
  bg: string;
  text: string;
};

export const POST_CATEGORY_META: Record<PostCategory, PostCategoryMeta> = {
  comida: { label: "Comida", bg: "#9A7B1E", text: "#FFFFFF" },
  siesta: { label: "Siesta", bg: "#E7DCF6", text: "#7B5FC0" },
  actividad: { label: "Actividad", bg: "#2E89A6", text: "#FFFFFF" },
  logro: { label: "Logro", bg: "#CFEBD8", text: "#3E9B6C" },
  animo: { label: "Ánimo", bg: "#F9D2DE", text: "#C56486" },
  foto: { label: "Foto", bg: "#FBD8CC", text: "#D9684A" },
  anuncio: { label: "Anuncio", bg: "#CCD8F4", text: "#4E72C8" },
};

export const posts: Post[] = [
  {
    id: "1",
    category: "logro",
    author: {
      name: "Mateo",
      initial: "M",
      bgColor: "#A9D9E8",
      textColor: "#1F7A93",
    },
    timestamp: "14:20",
    publishedBy: "publicado por vos",
    recipient: "familia de Mateo",
    content:
      "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 5,
    comments: 2,
  },
  {
    id: "2",
    category: "actividad",
    author: {
      name: "Mateo",
      initial: "M",
      bgColor: "#A9D9E8",
      textColor: "#1F7A93",
    },
    timestamp: "09:40",
    publishedBy: "publicado por vos",
    recipient: "familia de Mateo",
    content:
      "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photos: ["/photos/painting.svg"],
    likes: 3,
    comments: 1,
  },
  {
    id: "3",
    category: "anuncio",
    author: {
      name: "Anuncio general",
      initial: "A",
      bgColor: "#CCD8F4",
      textColor: "#4E72C8",
    },
    timestamp: "07:50",
    publishedBy: "Maestra Caro",
    recipient: "",
    content:
      "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 0,
    comments: 0,
  },
];
