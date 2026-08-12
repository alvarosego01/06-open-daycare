type PostAuthor = {
  name: string;
  initial: string;
  bgColor: string;
  textColor: string;
};

type PostBase = {
  id: string;
  author: PostAuthor;
  timestamp: string;
  publishedBy: string;
  recipient: string;
  content: string;
  likes: number;
  comments: number;
};

type PostAchievement = PostBase & {
  type: "achievement";
};

type PostActivity = PostBase & {
  type: "activity";
  photoPlaceholder?: string;
};

type PostAnnouncement = Omit<PostBase, "author"> & {
  type: "announcement";
  author: {
    name: string;
    icon: "megaphone";
    bgColor: string;
    textColor: string;
  };
};

type Post = PostAchievement | PostActivity | PostAnnouncement;

export const posts: Post[] = [
  {
    id: "1",
    type: "achievement",
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
    type: "activity",
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
    photoPlaceholder: "Foto · pintando con témperas",
    likes: 3,
    comments: 1,
  },
  {
    id: "3",
    type: "announcement",
    author: {
      name: "Anuncio general",
      icon: "megaphone",
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
