import { User, CreateUserDto } from '../domain/user';
import { generateId } from '../utils/id';

class UserRepository {
  private users: Map<string, User> = new Map();
  private userByCpf: Map<string, string> = new Map(); // Map CPF to user ID

  async create(userData: CreateUserDto): Promise<User> {
    const id = generateId();
    const now = new Date();
    
    const user: User = {
      id,
      ...userData,
      createdAt: now,
      updatedAt: now,
    };
    
    this.users.set(id, user);
    this.userByCpf.set(userData.cpf, id);
    
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByCpf(cpf: string): Promise<User | null> {
    const userId = this.userByCpf.get(cpf);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    const existingUser = this.users.get(id);
    if (!existingUser) return null;
    
    const updatedUser: User = {
      ...existingUser,
      ...userData,
      updatedAt: new Date(),
    };
    
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    this.userByCpf.delete(user.cpf);
    this.users.delete(id);
    
    return true;
  }

  async list(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}

// Singleton instance
export const userRepository = new UserRepository(); 