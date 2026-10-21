export type CarStatus = "available" | "reserved" | "sold";

export type Photo = {
  id: string;
  url: string;
  alt: string;
};

export type Car = {
  id: string;
  slug: string;
  make: string;
  makeEn: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  color: string;
  interior: string;
  engine: string;
  horsepower: number;
  transmission: string;
  drivetrain: string;
  options: string[];
  story: string;
  status: CarStatus;
  published: boolean;
  featured: boolean;
  photos: Photo[];
  createdAt: string;
  updatedAt: string;
};

export type Staff = {
  id: string;
  displayName: string;
  role: string;
  lineUrl: string;
  lineId: string;
  note: string;
  lineUserId: string;
  sortOrder: number;
  createdAt: string;
};

export type Session = {
  id: string;
  createdAt: string;
  expiresAt: string;
};

export type Admin = {
  passwordHash: string;
  createdAt: string;
};

export type Store = {
  admin: Admin | null;
  staff: Staff[];
  cars: Car[];
  sessions: Session[];
};
