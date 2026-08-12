export type KidBadge = {
  label: string;
  bgColor: string;
  textColor: string;
};

export type Parent = {
  id: string;
  name: string;
  initial: string;
  role: string;
  avatarBgColor: string;
  status: "active" | "pending";
};

export type Kid = {
  id: string;
  name: string;
  initial: string;
  avatarBgColor: string;
  avatarTextColor: string;
  age: string;
  parentCount: number;
  badges: KidBadge[];
  room: string;
  birthDate: string;
  enrollmentDate: string;
  allergyNotes: string | null;
  parents: Parent[];
};

export const kids: Kid[] = [
  {
    id: "mateo-fernandez",
    name: "Mateo Fernández",
    initial: "M",
    avatarBgColor: "#A9D9E8",
    avatarTextColor: "#1F7A93",
    age: "3 años",
    parentCount: 2,
    badges: [
      {
        label: "MANÍ",
        bgColor: "#FBD8CC",
        textColor: "#D9684A",
      },
    ],
    room: "Soles",
    birthDate: "12 mar 2022",
    enrollmentDate: "feb 2025",
    allergyNotes:
      "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    parents: [
      {
        id: "lucia-fernandez",
        name: "Lucía Fernández",
        initial: "L",
        role: "Mamá",
        avatarBgColor: "#C9B6E8",
        status: "active",
      },
      {
        id: "diego-fernandez",
        name: "Diego Fernández",
        initial: "D",
        role: "Papá",
        avatarBgColor: "#A9C7E8",
        status: "pending",
      },
    ],
  },
  {
    id: "sofia-mendez",
    name: "Sofía Méndez",
    initial: "S",
    avatarBgColor: "#F4B8CC",
    avatarTextColor: "#C44A7A",
    age: "2 años",
    parentCount: 1,
    badges: [],
    room: "Soles",
    birthDate: "15 may 2023",
    enrollmentDate: "mar 2025",
    allergyNotes: null,
    parents: [],
  },
  {
    id: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    initial: "B",
    avatarBgColor: "#B9DEC4",
    avatarTextColor: "#3E8B62",
    age: "3 años",
    parentCount: 2,
    badges: [],
    room: "Soles",
    birthDate: "8 ene 2022",
    enrollmentDate: "feb 2025",
    allergyNotes: null,
    parents: [],
  },
  {
    id: "valentina-soto",
    name: "Valentina Soto",
    initial: "V",
    avatarBgColor: "#F4DC8E",
    avatarTextColor: "#9A7B1E",
    age: "2 años",
    parentCount: 0,
    badges: [
      {
        label: "VINCULAR",
        bgColor: "#F9D2DE",
        textColor: "#C56486",
      },
    ],
    room: "Soles",
    birthDate: "22 ago 2023",
    enrollmentDate: "abr 2025",
    allergyNotes: null,
    parents: [],
  },
  {
    id: "tomas-diaz",
    name: "Tomás Díaz",
    initial: "T",
    avatarBgColor: "#C9B6E8",
    avatarTextColor: "#7B5FC0",
    age: "3 años",
    parentCount: 1,
    badges: [
      {
        label: "LACTOSA",
        bgColor: "#FBD8CC",
        textColor: "#D9684A",
      },
    ],
    room: "Soles",
    birthDate: "3 nov 2022",
    enrollmentDate: "feb 2025",
    allergyNotes: "Intolerancia a la lactosa. Evitar lácteos.",
    parents: [],
  },
  {
    id: "emma-castro",
    name: "Emma Castro",
    initial: "E",
    avatarBgColor: "#F4B8CC",
    avatarTextColor: "#C44A7A",
    age: "2 años",
    parentCount: 1,
    badges: [],
    room: "Soles",
    birthDate: "17 jun 2023",
    enrollmentDate: "mar 2025",
    allergyNotes: null,
    parents: [],
  },
  {
    id: "lucas-romero",
    name: "Lucas Romero",
    initial: "L",
    avatarBgColor: "#A9D9E8",
    avatarTextColor: "#1F7A93",
    age: "3 años",
    parentCount: 1,
    badges: [],
    room: "Soles",
    birthDate: "29 sep 2022",
    enrollmentDate: "feb 2025",
    allergyNotes: null,
    parents: [],
  },
  {
    id: "olivia-vega",
    name: "Olivia Vega",
    initial: "O",
    avatarBgColor: "#B9DEC4",
    avatarTextColor: "#3E8B62",
    age: "2 años",
    parentCount: 1,
    badges: [],
    room: "Soles",
    birthDate: "5 dic 2023",
    enrollmentDate: "abr 2025",
    allergyNotes: null,
    parents: [],
  },
];
