import { HealthStatus } from '../types';

class HealthService {
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
  }

  getHealthStatus(): HealthStatus {
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime
    };
  }
}

export const healthService = new HealthService();