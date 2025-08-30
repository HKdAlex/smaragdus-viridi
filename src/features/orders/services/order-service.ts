// Placeholder order service - will be implemented by another team
export class OrderService {
  // Placeholder methods
  static async createOrder() {
    throw new Error('Order service not implemented yet');
  }
  
  static async getOrder() {
    throw new Error('Order service not implemented yet');
  }
}

// Export as orderService for compatibility
export const orderService = new OrderService();
