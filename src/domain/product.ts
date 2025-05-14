export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateProductDto = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>; 